
import { useState, useEffect, useCallback } from 'react';
import { 
  initializeIdentusAgent, 
  createConnectionRequest,
  createPrismDID,
  issueKYCCredential,
  getAllDIDs,
  getAllCredentials
} from '../lib/identus-agent';

export type ConnectionStatus = 
  | 'idle' 
  | 'generating-qr' 
  | 'waiting-for-scan' 
  | 'connecting' 
  | 'connected' 
  | 'issuing-credential'
  | 'complete' 
  | 'error';

interface UseIdentusConnectionReturn {
  status: ConnectionStatus;
  connectionUrl: string | null;
  userDID: string | null;
  credential: any | null;
  error: string | null;
  
  generateQRCode: () => Promise<void>;
  createDIDForUser: (alias?: string) => Promise<void>;
  issueCredential: (data: { name: string; skills?: string[] }) => Promise<void>;
  checkExistingDID: () => Promise<void>;
  reset: () => void;
}

export function useIdentusConnection(): UseIdentusConnectionReturn {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [connectionUrl, setConnectionUrl] = useState<string | null>(null);
  const [userDID, setUserDID] = useState<string | null>(null);
  const [credential, setCredential] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateQRCode = useCallback(async () => {
    try {
      setStatus('generating-qr');
      setError(null);

      const { oobUrl, invitationId } = await createConnectionRequest();
      
      setConnectionUrl(oobUrl);
      setStatus('waiting-for-scan');

      console.log('QR Code generated. Invitation ID:', invitationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code');
      setStatus('error');
    }
  }, []);


  const createDIDForUser = useCallback(async (alias: string = 'user-kyc') => {
    try {
      setStatus('connecting');
      setError(null);

      const userId = 'user-' + Date.now();
      const did = await createPrismDID(alias, userId);
      
      setUserDID(did.did);
      setStatus('connected');

      console.log('✅ User DID created:', did.did);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create DID');
      setStatus('error');
    }
  }, []);

  const issueCredential = useCallback(async (data: { 
    name: string; 
    skills?: string[] 
  }) => {
    if (!userDID) {
      setError('No DID available. Create DID first.');
      setStatus('error');
      return;
    }

    try {
      setStatus('issuing-credential');
      setError(null);

      // Use backend API for credential issuance
      const vc = await issueKYCCredential(
        userDID,
        data.name,
        '',
        data.skills || [],
        'user-' + Date.now(),
        undefined
      );

      setCredential(vc);
      setStatus('complete');

      console.log('✅ Credential issued successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to issue credential');
      setStatus('error');
    }
  }, [userDID]);

  /**
   * Check if user already has a DID
   */
  const checkExistingDID = useCallback(async () => {
    try {
      const dids = await getAllDIDs();
      
      if (dids && dids.length > 0) {
        setUserDID(dids[0].toString());
        
        // Check for existing credentials
        const credentials = await getAllCredentials();
        if (credentials && credentials.length > 0) {
          setCredential(credentials[0]);
          setStatus('complete');
        } else {
          setStatus('connected');
        }
        
        console.log('✅ Found existing DID:', dids[0].toString());
      }
    } catch (err) {
      console.log('No existing DID found or error:', err);
    }
  }, []);

  /**
   * Reset the connection state
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setConnectionUrl(null);
    setUserDID(null);
    setCredential(null);
    setError(null);
  }, []);

  // Check for existing DID on mount
  useEffect(() => {
    checkExistingDID();
  }, [checkExistingDID]);

  return {
    status,
    connectionUrl,
    userDID,
    credential,
    error,
    generateQRCode,
    createDIDForUser,
    issueCredential,
    checkExistingDID,
    reset,
  };
}
