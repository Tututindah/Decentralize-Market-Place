/**
 * Hyperledger Identus Integration Library
 * (formerly known as Atala PRISM)
 * 
 * This file provides utilities for integrating Hyperledger Identus decentralized identity
 * protocol with the Cardano blockchain.
 * 
 * PRODUCTION SETUP:
 * 1. Install Identus SDK: npm install @hyperledger/identus-edge-agent-sdk
 * 2. Configure Identus Cloud Agent endpoint or self-hosted mediator
 * 3. Replace simulated functions with actual SDK calls
 * 
 * @see https://hyperledger-identus.github.io/docs/sdk-ts/
 * @see https://hyperledger-identus.github.io/docs/sdk-ts/docs/sdk/
 */

// Type definitions for Atala PRISM
export interface PrismDID {
  did: string;
  keyPairs: {
    master: { publicKey: string; privateKey: string };
    issuance: { publicKey: string; privateKey: string };
  };
}

export interface VerifiableCredential {
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

/**
 * Production Implementation Guide (Hyperledger Identus SDK):
 * 
 * import SDK from '@hyperledger/identus-edge-agent-sdk';
 * import { Agent } from '@hyperledger/identus-edge-agent-sdk';
 * 
 * const agent = await Agent.initialize({
 *   mediatorDID: 'did:peer:2.Ez6LS...', // Your mediator DID
 *   pluto: new Pluto(), // Database for storage
 *   apollo: new Apollo(), // Cryptographic operations
 *   castor: new Castor() // DID operations
 * });
 * 
 * // Start agent
 * await agent.start();
 * 
 * // Create DID
 * const did = await agent.createNewPrismDID({
 *   alias: 'user-kyc',
 *   services: []
 * });
 * 
 * // Issue Credential
 * const credential = await agent.createVerifiableCredential({
 *   credentialSubject: {
 *     name: 'John Doe',
 *     kycVerified: true
 *   },
 *   type: ['VerifiableCredential', 'KYCCredential'],
 *   issuerDID: platformIssuerDID,
 *   subjectDID: holderDID
 * });
 */

// Hyperledger Identus Agent configuration
export const IDENTUS_CONFIG = {
  // Use Identus Cloud Agent or self-hosted mediator
  cloudAgentUrl: process.env.NEXT_PUBLIC_IDENTUS_CLOUD_AGENT_URL || 'https://k8s-dev.atalaprism.io/prism-agent',
  mediatorDID: process.env.NEXT_PUBLIC_IDENTUS_MEDIATOR_DID || 'did:peer:2.Ez6LSms...mediator',
  
  // Platform issuer DID (should be created once and stored securely)
  issuerDID: process.env.NEXT_PUBLIC_PLATFORM_ISSUER_DID || 'did:prism:platform-issuer',
  
  // Credential schema URLs
  credentialSchemas: {
    kyc: 'https://decentgigs.io/schemas/kyc-credential-v1.json',
    skills: 'https://decentgigs.io/schemas/skills-credential-v1.json'
  }
};

// Legacy export for backward compatibility
export const PRISM_CONFIG = IDENTUS_CONFIG;

/**
 * Verify a Verifiable Credential
 * Production implementation would use PRISM SDK verification
 */
export async function verifyCredential(credential: VerifiableCredential): Promise<boolean> {
  // In production:
  // return await prism.verifyCredential(credential);
  
  // For demo, check basic structure
  return !!(
    credential.id &&
    credential.type.includes('VerifiableCredential') &&
    credential.credentialSubject &&
    credential.proof
  );
}

/**
 * Store DID and credentials securely
 * In production, use encrypted storage or hardware wallet
 */
export function storePrismCredentials(did: PrismDID, credentials: VerifiableCredential[]) {
  // WARNING: This is for demo only. Production should use:
  // - Encrypted localStorage
  // - Hardware wallet integration (Ledger, Trezor)
  // - Secure enclave on mobile
  
  const encrypted = {
    did: did.did,
    credentials: credentials.map(c => ({
      id: c.id,
      type: c.type,
      issuer: c.issuer,
      credentialSubject: c.credentialSubject
    }))
    // Never store private keys in browser storage in production!
  };
  
  localStorage.setItem('prism_data', JSON.stringify(encrypted));
}

/**
 * Retrieve stored credentials
 */
export function getPrismCredentials(): { did: string; credentials: any[] } | null {
  const data = localStorage.getItem('prism_data');
  return data ? JSON.parse(data) : null;
}

/**
 * Create credential offer (for employer verification requests)
 */
export interface CredentialOffer {
  type: string;
  requiredClaims: string[];
  issuer: string;
}

export function createVerificationRequest(jobId: string, requiredCredentials: string[]): CredentialOffer {
  return {
    type: 'KYCVerificationRequest',
    requiredClaims: requiredCredentials,
    issuer: PRISM_CONFIG.issuerDID
  };
}

/**
 * Present credential (selective disclosure)
 * User can choose which claims to reveal
 */
export async function presentCredential(
  credential: VerifiableCredential,
  requestedClaims: string[]
): Promise<any> {
  // In production, use PRISM SDK to create presentation with selective disclosure
  // This allows revealing only requested fields without exposing full credential
  
  const presentation = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiablePresentation'],
    verifiableCredential: [credential],
    proof: {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      verificationMethod: credential.credentialSubject.id,
      proofPurpose: 'authentication'
    }
  };
  
  return presentation;
}
