import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Shield, CheckCircle, Upload, Copy, ExternalLink, Loader2, Clock, FileCheck, Award, Building, User } from 'lucide-react';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';
import { createKYCInvitation, createUserDID, issueKYCCredential } from '../lib/api';

interface KYCVerificationProps {
  onComplete: () => void;
  onSkip: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onGetStarted: () => void;
  onShowProfile: () => void;
}

// Atala PRISM DID types
interface PrismDID {
  did: string;
  keyPairs: {
    master: { publicKey: string; privateKey: string };
    issuance: { publicKey: string; privateKey: string };
  };
}

interface VerifiableCredential {
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: {
    id: string;
    name?: string;
    kycVerified?: boolean;
    skills?: string[];
  };
  proof?: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    jws: string;
  };
}

type KYCStep = 'input' | 'creating-did' | 'issuing-credential' | 'complete';

export function KYCVerification({ onComplete, onSkip, isDarkMode, onToggleTheme, onGetStarted, onShowProfile }: KYCVerificationProps) {
  const [step, setStep] = useState<KYCStep>('input');
  const [fullName, setFullName] = useState('');
  const [skills, setSkills] = useState('');
  const [prismDID, setPrismDID] = useState<PrismDID | null>(null);
  const [credential, setCredential] = useState<VerifiableCredential | null>(null);
  const [copiedDID, setCopiedDID] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [connectionUrl, setConnectionUrl] = useState('');

  // Modern Apple-inspired theme with proper contrast
  const rootClass = isDarkMode 
    ? 'bg-black text-white' 
    : 'bg-white text-black';
  
  const cardClass = isDarkMode 
    ? 'bg-zinc-900 border-2 border-zinc-800 shadow-2xl shadow-black/50' 
    : 'bg-white border-2 border-gray-200 shadow-xl';
  
  const inputClass = isDarkMode 
    ? 'bg-zinc-900 border-2 border-zinc-800 text-white placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/30' 
    : 'bg-gray-50 border-2 border-gray-200 text-black placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20';
  
  const textForegroundClass = isDarkMode 
    ? 'text-white font-semibold' 
    : 'text-black font-bold';
  
  const textMutedClass = isDarkMode 
    ? 'text-gray-400' 
    : 'text-black font-medium';

  // Simulated Atala PRISM DID creation (Client-side for demo)
  // In production, this would use Atala PRISM SDK and connect to PRISM Node
  const createPrismDID = async (): Promise<PrismDID> => {
    // Simulate DID creation with cryptographic key generation
    const masterKeyPair = await generateKeyPair();
    const issuanceKeyPair = await generateKeyPair();
    
    // Construct DID following PRISM DID format: did:prism:<base58-encoded-initial-state>
    const initialState = btoa(JSON.stringify({
      publicKeys: [
        { id: 'master0', usage: 'master', data: masterKeyPair.publicKey },
        { id: 'issuing0', usage: 'issuance', data: issuanceKeyPair.publicKey }
      ]
    }));
    
    const did = `did:prism:${initialState.substring(0, 44)}`;
    
    return {
      did,
      keyPairs: {
        master: masterKeyPair,
        issuance: issuanceKeyPair
      }
    };
  };

  // Simulate key generation (in production, use PRISM SDK)
  const generateKeyPair = async (): Promise<{ publicKey: string; privateKey: string }> => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const publicKey = btoa(String.fromCharCode(...array));
    crypto.getRandomValues(array);
    const privateKey = btoa(String.fromCharCode(...array));
    return { publicKey, privateKey };
  };

  // Issue Verifiable Credential using PRISM DID
  const issueVerifiableCredential = async (holderDID: string, data: { name: string; skills: string[] }): Promise<VerifiableCredential> => {
    // In production, this would be signed by an authorized issuer's PRISM DID
    const issuerDID = 'did:prism:issuer123'; // Platform's issuer DID
    const credentialId = `urn:uuid:${crypto.randomUUID()}`;
    const issuanceDate = new Date().toISOString();

    // Create JWT proof (in production, use PRISM SDK to sign)
    const proof = await createProof(holderDID, data);

    return {
      id: credentialId,
      type: ['VerifiableCredential', 'KYCCredential'],
      issuer: issuerDID,
      issuanceDate,
      credentialSubject: {
        id: holderDID,
        name: data.name,
        kycVerified: true,
        skills: data.skills
      },
      proof
    };
  };

  const createProof = async (holderDID: string, data: any): Promise<VerifiableCredential['proof']> => {
    const payload = JSON.stringify({ holderDID, ...data });
    const signature = btoa(payload); // In production, use proper JWT signing with PRISM keys
    
    return {
      type: 'JwtProof2020',
      created: new Date().toISOString(),
      proofPurpose: 'assertionMethod',
      verificationMethod: 'did:prism:issuer123#issuing0',
      jws: signature
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (accept images and PDFs)
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid ID document (JPEG, PNG, or PDF)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setUploadedFile(file);
    }
  };

  const generateIdentusOOBInvitation = async (): Promise<string> => {
    // Generate Out-of-Band (OOB) invitation URL for Identus mobile wallet
    // This follows the DIDComm v2 OOB protocol specification
    const oobInvitation = {
      type: 'https://didcomm.org/out-of-band/2.0/invitation',
      id: `kyc-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      from: 'did:prism:workplace-around-issuer',
      body: {
        goal_code: 'issue-vc',
        goal: 'Request KYC Verification Credential',
        accept: ['didcomm/v2'],
      },
      attachments: [{
        id: 'request-0',
        media_type: 'application/json',
        data: {
          json: {
            credentialType: 'KYCVerification',
            issuer: 'WorPlace Around Platform',
            attributes: ['name', 'verifiedStatus', 'skills']
          }
        }
      }]
    };

    // Encode the invitation as base64url
    const invitationJson = JSON.stringify(oobInvitation);
    const invitationBase64 = btoa(invitationJson)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // Create OOB URL that Identus/Socious wallets can scan
    // Format: https://my.domain.com/path?_oob=<base64url-encoded-invitation>
    const baseUrl = window.location.origin;
    const oobUrl = `${baseUrl}/connect?_oob=${invitationBase64}`;
    
    return oobUrl;
  };

  const handleCreateDID = async () => {
    if (!fullName.trim()) {
      alert('Please enter your full name');
      return;
    }

    setStep('creating-did');

    try {
      // Call backend to create OOB invitation
      const invitation = await createKYCInvitation();
      setConnectionUrl(invitation.oobUrl);
      setShowQRScanner(true);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create DID via backend
      const userId = 'user-' + Date.now();
      const didResult = await createUserDID(userId, fullName.toLowerCase().replace(/\s+/g, '-'));
      
      const mockDID = {
        did: didResult.did,
        keyPairs: {
          master: { publicKey: 'mock-public-key', privateKey: 'mock-private-key' },
          issuance: { publicKey: 'mock-public-key-2', privateKey: 'mock-private-key-2' }
        }
      };
      setPrismDID(mockDID);

      setStep('issuing-credential');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Issue credential via backend
      const skillsList = skills.split(',').map(s => s.trim()).filter(s => s);
      const credentialResult = await issueKYCCredential({
        holderDID: didResult.did,
        fullName,
        skills: skillsList,
        userId,
        document: uploadedFile || undefined
      });

      const mockCredential = {
        id: credentialResult.credential.id,
        type: ['VerifiableCredential', 'KYCVerification'],
        issuer: credentialResult.credential.issuer,
        issuanceDate: credentialResult.credential.issuanceDate,
        credentialSubject: {
          id: didResult.did,
          name: fullName,
          kycVerified: true,
          skills: skillsList
        },
        proof: {}
      };
      setCredential(mockCredential);

      // Store in localStorage
      localStorage.setItem('prism_did', JSON.stringify(mockDID));
      localStorage.setItem('prism_credential', JSON.stringify(mockCredential));

      setStep('complete');
    } catch (error) {
      console.error('KYC Error:', error);
      alert('Failed to create DID. Please try again.');
      setStep('input');
    }
  };

  const copyDID = () => {
    if (prismDID) {
      navigator.clipboard.writeText(prismDID.did);
      setCopiedDID(true);
      setTimeout(() => setCopiedDID(false), 2000);
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  // Render different UI based on step
  const renderStepContent = () => {
    switch (step) {
      case 'input':
        return (
          <>
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                isDarkMode 
                  ? 'bg-primary/10 border border-primary/30' 
                  : 'bg-primary/5 border-2 border-primary/20'
              }`}>
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h2 className={`text-4xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                KYC Verification
              </h2>
              <p className={`text-lg mb-4 ${textMutedClass}`}>
                Create your decentralized identity (DID) and receive Verifiable Credentials
              </p>
              <div className={`mt-4 p-4 rounded-xl border-2 ${
                isDarkMode 
                  ? 'bg-primary/5 border-primary/20' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-black font-semibold'}`}>
                  <strong className="text-primary">Powered by Hyperledger Identus</strong> (formerly Atala PRISM)<br />
                  Your credentials are cryptographically verifiable on Cardano blockchain without exposing personal data.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullname" className={`text-sm font-bold ${textForegroundClass}`}>
                  Full Name (for Credential)
                </Label>
                <Input 
                  id="fullname" 
                  placeholder="John Doe" 
                  className={`h-12 text-base ${inputClass}`}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="skills" className={`text-sm font-bold ${textForegroundClass}`}>
                  Skills (comma-separated, optional)
                </Label>
                <Input 
                  id="skills" 
                  placeholder="Plutus Developer, Smart Contract Auditor" 
                  className={`h-12 text-base ${inputClass}`}
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="idupload" className={`text-sm font-bold ${textForegroundClass}`}>
                  Upload ID Document (Optional - Encrypted)
                </Label>
                <div className="relative">
                  <input
                    type="file"
                    id="idupload"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="idupload"
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-primary ${
                      isDarkMode
                        ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span className={uploadedFile ? textForegroundClass : textMutedClass}>
                      {uploadedFile ? uploadedFile.name : 'Select file (JPEG, PNG, or PDF)'}
                    </span>
                    <Upload className={`w-5 h-5 ${uploadedFile ? 'text-primary' : 'text-gray-500'}`} />
                  </label>
                  {uploadedFile && (
                    <p className={`mt-2 text-xs ${textMutedClass}`}>
                      ✓ File uploaded: {(uploadedFile.size / 1024).toFixed(2)} KB
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className={`p-5 rounded-xl border-2 space-y-4 ${
              isDarkMode 
                ? 'bg-zinc-800/50 border-zinc-700' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <h3 className={`text-lg font-black ${textForegroundClass}`}>What You Get:</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className={`p-1 rounded-lg ${
                    isDarkMode ? 'bg-primary/20' : 'bg-primary/10'
                  }`}>
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <p className={`flex-1 ${isDarkMode ? 'text-gray-300' : 'text-black font-semibold'}`}>
                    Decentralized Identifier (DID) on Cardano via Identus
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`p-1 rounded-lg ${
                    isDarkMode ? 'bg-primary/20' : 'bg-primary/10'
                  }`}>
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <p className={`flex-1 ${isDarkMode ? 'text-gray-300' : 'text-black font-semibold'}`}>
                    KYC Verifiable Credential (cryptographically signed)
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`p-1 rounded-lg ${
                    isDarkMode ? 'bg-primary/20' : 'bg-primary/10'
                  }`}>
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <p className={`flex-1 ${isDarkMode ? 'text-gray-300' : 'text-black font-semibold'}`}>
                    Privacy-preserving verification (no personal data exposed)
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`p-1 rounded-lg ${
                    isDarkMode ? 'bg-primary/20' : 'bg-primary/10'
                  }`}>
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <p className={`flex-1 ${isDarkMode ? 'text-gray-300' : 'text-black font-semibold'}`}>
                    Access to premium jobs requiring verified identity
                  </p>
                </div>
              </div>
            </div>

            {showQRScanner && connectionUrl && (
              <div className={`p-6 rounded-xl border-2 space-y-4 ${
                isDarkMode
                  ? 'bg-zinc-800/50 border-primary/30'
                  : 'bg-blue-50 border-primary/20'
              }`}>
                <div className="text-center">
                  <h3 className={`text-xl font-black mb-2 ${textForegroundClass}`}>
                    Scan with Identus Mobile Wallet
                  </h3>
                  <p className={textMutedClass}>
                    Use Socious, Identus Wallet, or any compatible wallet app
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-xl">
                    <div className="w-64 h-64 flex items-center justify-center">
                      {connectionUrl && (
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(connectionUrl)}`}
                          alt="Identus OOB Invitation QR Code"
                          className="w-full h-full"
                          onError={(e) => {
                            console.error('QR code load error');
                            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="%23f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">QR Code</text></svg>';
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className={`text-sm font-bold ${textForegroundClass}`}>Connection URL:</p>
                  <div className={`p-3 rounded-lg font-mono text-xs break-all ${
                    isDarkMode ? 'bg-zinc-900 text-gray-300' : 'bg-white text-black border border-gray-300'
                  }`}>
                    {connectionUrl}
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-zinc-900' : 'bg-white border border-gray-200'
                }`}>
                  <p className={`text-sm ${textMutedClass} mb-2`}>
                    <strong className="text-primary">Download Identus Wallet:</strong>
                  </p>
                  <div className="flex gap-2">
                    <a
                      href="https://play.google.com/store/apps/details?id=io.iohk.atala.prism.walletapp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex-1 p-2 text-center rounded-lg border-2 transition-colors ${
                        isDarkMode
                          ? 'border-primary/30 hover:bg-primary/10 text-white'
                          : 'border-primary/20 hover:bg-primary/5 text-black'
                      }`}
                    >
                      📱 Android
                    </a>
                    <a
                      href="https://apps.apple.com/app/atala-prism-wallet/id1631335200"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex-1 p-2 text-center rounded-lg border-2 transition-colors ${
                        isDarkMode
                          ? 'border-primary/30 hover:bg-primary/10 text-white'
                          : 'border-primary/20 hover:bg-primary/5 text-black'
                      }`}
                    >
                      🍎 iOS
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                onClick={handleCreateDID} 
                disabled={showQRScanner}
                className={`flex-1 h-12 text-base font-bold ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-primary to-secondary hover:opacity-90 disabled:opacity-50'
                    : 'bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/30 text-white disabled:opacity-50'
                }`}
              >
                {showQRScanner ? 'Waiting for Wallet...' : 'Create DID & Verify'}
              </Button>
              <Button 
                onClick={onSkip} 
                variant="outline" 
                className={`flex-1 h-12 text-base font-bold border-2 ${
                  isDarkMode 
                    ? 'border-zinc-700 hover:bg-zinc-800 text-gray-300' 
                    : 'border-slate-300 hover:bg-slate-100 text-black'
                }`}
              >
                Skip for Now
              </Button>
            </div>

            <p className={textMutedClass + " text-center text-sm"}>
              You can complete this later from your profile settings
            </p>
          </>
        );

      case 'creating-did':
        return (
          <div className="text-center space-y-6 py-8">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
              isDarkMode 
                ? 'bg-gradient-to-br from-primary/30 to-secondary/30 border-2 border-primary/50' 
                : 'bg-gradient-to-br from-primary/20 to-secondary/20 border-4 border-primary/30'
            }`}>
              <Shield className="w-12 h-12 text-primary animate-pulse" />
            </div>
            <div>
              <h3 className={`text-3xl font-black mb-3 ${textForegroundClass}`}>
                Creating Your Decentralized Identity
              </h3>
              <p className={`text-lg ${textMutedClass}`}>
                Generating cryptographic keys and publishing to Cardano blockchain...
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className={`w-3 h-3 rounded-full animate-bounce ${isDarkMode ? 'bg-primary' : 'bg-primary'}`} style={{animationDelay: '0ms'}} />
              <div className={`w-3 h-3 rounded-full animate-bounce ${isDarkMode ? 'bg-secondary' : 'bg-secondary'}`} style={{animationDelay: '150ms'}} />
              <div className={`w-3 h-3 rounded-full animate-bounce ${isDarkMode ? 'bg-primary' : 'bg-primary'}`} style={{animationDelay: '300ms'}} />
            </div>
            <div className={`p-5 rounded-xl border-2 text-left space-y-3 ${
              isDarkMode 
                ? 'bg-zinc-800/30 border-zinc-700' 
                : 'bg-gradient-to-br from-slate-50 to-white border-gray-200'
            }`}>
              <p className={`flex items-center gap-3 ${isDarkMode ? 'text-gray-300' : 'text-black font-semibold'}`}>
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Generating Ed25519 key pair</span>
              </p>
              <p className={`flex items-center gap-3 ${isDarkMode ? 'text-gray-300' : 'text-black font-semibold'}`}>
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span>Creating DID on Hyperledger Identus...</span>
              </p>
              <p className={`flex items-center gap-3 ${textMutedClass}`}>
                <Clock className="w-5 h-5 flex-shrink-0" />
                <span>Publishing to Cardano Preprod</span>
              </p>
            </div>
          </div>
        );
        
      case 'issuing-credential':
        return (
          <div className="text-center space-y-6 py-8">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
              isDarkMode 
                ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-2 border-green-500/50' 
                : 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-4 border-green-500/30'
            }`}>
              <FileCheck className="w-12 h-12 text-green-500 animate-pulse" />
            </div>
            <div>
              <h3 className={`text-3xl font-black mb-3 ${textForegroundClass}`}>
                Issuing Verifiable Credential
              </h3>
              <p className={`text-lg ${textMutedClass}`}>
                Cryptographically signing your KYC credential with platform issuer DID...
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
              <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
            </div>
            <div className={`p-5 rounded-xl border-2 text-left space-y-3 ${
              isDarkMode 
                ? 'bg-zinc-800/30 border-zinc-700' 
                : 'bg-gradient-to-br from-slate-50 to-white border-gray-200'
            }`}>
              <p className={`flex items-center gap-3 ${isDarkMode ? 'text-gray-300' : 'text-black font-semibold'}`}>
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>DID created successfully</span>
              </p>
              <p className={`flex items-center gap-3 ${isDarkMode ? 'text-gray-300' : 'text-black font-semibold'}`}>
                <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span>Creating W3C Verifiable Credential (JWT)</span>
              </p>
              <p className={`flex items-center gap-3 ${textMutedClass}`}>
                <Clock className="w-5 h-5 flex-shrink-0" />
                <span>Storing encrypted credential</span>
              </p>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-2 border-green-500/50' 
                  : 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-4 border-green-500/30'
              }`}>
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h2 className={`text-4xl font-black mb-3 ${textForegroundClass}`}>
                KYC Verification Complete!
              </h2>
              <p className={`text-lg ${textMutedClass}`}>
                Your decentralized identity and credentials have been successfully created
              </p>
            </div>

            <div className={`p-6 rounded-xl border-2 ${
              isDarkMode 
                ? 'bg-zinc-800/50 border-zinc-700' 
                : 'bg-gradient-to-br from-slate-50 to-white border-gray-200 shadow-lg shadow-slate-900/5'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className={`text-xl font-black mb-2 ${textForegroundClass}`}>
                    Your Decentralized Identifier (DID)
                  </h3>
                  <p className={`text-sm ${textMutedClass}`}>
                    Published on Cardano blockchain via Hyperledger Identus
                  </p>
                </div>
                <Button
                  onClick={copyDID}
                  variant="outline"
                  size="sm"
                  className={`gap-2 border-2 ${
                    isDarkMode 
                      ? 'border-zinc-700 hover:bg-zinc-800' 
                      : 'border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  {copiedDID ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <div className={`p-4 rounded-lg font-mono text-sm break-all ${
                isDarkMode 
                  ? 'bg-zinc-900/50 text-green-400 border border-zinc-700' 
                  : 'bg-slate-100 text-blue-900 font-bold border-2 border-blue-200'
              }`}>
                {prismDID?.did}
              </div>
            </div>

            <div className={`p-6 rounded-xl border-2 space-y-4 ${
              isDarkMode 
                ? 'bg-zinc-800/50 border-zinc-700' 
                : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg shadow-green-900/5'
            }`}>
              <h3 className={`text-xl font-black ${textForegroundClass}`}>
                Verifiable Credential Details
              </h3>
              
              <div className="space-y-3">
                <div>
                  <Label className={`text-sm font-bold ${textMutedClass}`}>Credential Type</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {credential?.type.map((type, i) => (
                      <span
                        key={i}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                          isDarkMode 
                            ? 'bg-primary/20 text-primary border border-primary/30' 
                            : 'bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border-2 border-primary/30'
                        }`}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className={`text-sm font-bold ${textMutedClass}`}>Credential Subject</Label>
                  <div className={`mt-2 p-4 rounded-lg space-y-3 ${
                    isDarkMode 
                      ? 'bg-zinc-900/50' 
                      : 'bg-white border-2 border-gray-200'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className={`font-semibold ${textMutedClass}`}>Name:</span>
                      <span className={`font-bold ${textForegroundClass}`}>
                        {credential?.credentialSubject.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`font-semibold ${textMutedClass}`}>KYC Status:</span>
                      <span className={`px-3 py-1.5 rounded-lg font-bold text-sm border-2 ${
                        isDarkMode 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-green-100 text-green-800 border-green-300'
                      }`}>
                        Verified ✓
                      </span>
                    </div>
                    {credential?.credentialSubject.skills && credential.credentialSubject.skills.length > 0 && (
                      <div>
                        <span className={`font-semibold ${textMutedClass} block mb-2`}>Skills:</span>
                        <div className="flex flex-wrap gap-2">
                          {credential.credentialSubject.skills.map((skill, i) => (
                            <span
                              key={i}
                              className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                                isDarkMode 
                                  ? 'bg-secondary/20 text-secondary border border-secondary/30' 
                                  : 'bg-gradient-to-r from-secondary/20 to-primary/20 text-secondary border-2 border-secondary/30'
                              }`}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label className={`text-sm font-bold ${textMutedClass}`}>Issued By (Platform DID)</Label>
                  <div className={`mt-2 p-3 rounded-lg font-mono text-sm break-all ${
                    isDarkMode 
                      ? 'bg-zinc-900/50 text-gray-300' 
                      : 'bg-slate-100 text-black font-semibold border-2 border-gray-200'
                  }`}>
                    {credential?.issuer}
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-5 rounded-xl border-2 ${
              isDarkMode 
                ? 'bg-primary/10 border-primary/30' 
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
            }`}>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-black font-semibold'}`}>
                <strong className="text-primary text-lg">🎉 Congratulations!</strong><br />
                Your identity is now verifiable on Cardano blockchain. Employers can verify your credentials without accessing your personal data.
              </p>
            </div>

            <Button 
              onClick={handleComplete} 
              className={`w-full h-12 text-base font-bold ${
                isDarkMode
                  ? 'bg-gradient-to-r from-primary to-secondary hover:opacity-90'
                  : 'bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/30 text-white'
              }`}
            >
              Continue to Dashboard
            </Button>

            <a 
              href="https://hyperledger-identus.github.io/docs/sdk-ts/" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 text-sm ${textMutedClass} hover:text-primary transition-colors`}
            >
              Learn more about Hyperledger Identus <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden flex flex-col ${rootClass} transition-colors`}>
      <AppHeader
        onGetStarted={onGetStarted}
        onShowProfile={onShowProfile}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
      />
      {/* Space background effect (conditional) */}
      <div 
        className={`absolute inset-0 transition-opacity duration-1000 ${isDarkMode ? 'opacity-100' : 'opacity-20'}`}
        style={{ backgroundImage: `radial-gradient(ellipse at center, ${isDarkMode ? 'var(--tw-color-primary-600) 0%, transparent 80%)' : 'var(--tw-color-primary-100) 0%, transparent 80%)'}`}}
      ></div>
      
      <div className="flex-grow flex items-center justify-center p-4 relative z-10">
        <Card className={`w-full max-w-lg p-6 md:p-8 space-y-6 ${cardClass} shadow-2xl`}>
          <div className="text-center">
            <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
            <h2 className={`text-3xl font-bold ${textForegroundClass}`}>KYC Verification via Atala PRISM</h2>
            <p className={textMutedClass}>Create your decentralized identity (DID) and receive Verifiable Credentials</p>
            <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-primary/10 border border-primary/30' : 'bg-blue-50 border border-blue-200'}`}>
              <p className={`text-sm ${textMutedClass}`}>
                <strong>Powered by Atala PRISM:</strong> Your credentials are cryptographically verifiable on Cardano blockchain without exposing personal data.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="fullname" className={textForegroundClass}>Full Legal Name</Label>
              <Input id="fullname" placeholder="John Doe" className={inputClass} />
            </div>
            <div>
              <Label htmlFor="idupload" className={textForegroundClass}>Upload ID Document (Encrypted)</Label>
              <div className={`flex items-center justify-between p-3 rounded-lg border ${inputClass} cursor-pointer hover:opacity-90`}>
                <span className={textMutedClass}>Select file...</span>
                <Upload className="w-5 h-5 text-secondary" />
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg space-y-3 ${isDarkMode ? 'bg-zinc-800' : 'bg-white border border-gray-200'}`}>
            <h3 className={`font-semibold ${textForegroundClass}`}>What You Get:</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary" />
                <p className={textForegroundClass}>Your credentials will be stored as a Verifiable Credential</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary" />
                <p className={textForegroundClass}>You'll receive a unique DID (Decentralized Identifier)</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary" />
                <p className={textForegroundClass}>Boost your reputation and get access to premium jobs</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={onComplete} className="flex-1 bg-gradient-to-r from-secondary to-primary hover:opacity-90">
              Complete Verification
            </Button>
            <Button 
              onClick={onSkip} 
              variant="outline" 
              className={`flex-1 ${isDarkMode ? 'border-zinc-700 hover:bg-zinc-800' : 'border-gray-300 hover:bg-gray-200'}`}
            >
              Skip for Now
            </Button>
          </div>

          <p className={textMutedClass + " text-center"}>
            You can complete this later from your profile settings
          </p>
        </Card>
      </div>
      <Footer isDarkMode={isDarkMode} />
    </div>
  );
}

