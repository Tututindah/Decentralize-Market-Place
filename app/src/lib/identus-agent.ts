/**
 * Identus Agent - Backend API Integration
 * All Atala PRISM/Identus operations happen via backend
 */

import { 
  createKYCInvitation, 
  createUserDID as apiCreateUserDID, 
  issueKYCCredential as apiIssueKYCCredential,
  OOBInvitation,
  DIDResponse,
  CredentialResponse
} from './api';

// Environment configuration
export const IDENTUS_CONFIG = {
  mediatorDID: process.env.NEXT_PUBLIC_IDENTUS_MEDIATOR_DID || 'did:peer:2.Ez6LSghwSE437wnDE1pt3X6hVDUQzSjsHzinpX3XFvMjRAm7y',
  cloudAgentUrl: process.env.NEXT_PUBLIC_IDENTUS_CLOUD_AGENT_URL || 'https://k8s-dev.atalaprism.io/prism-agent',
  apiKey: process.env.NEXT_PUBLIC_IDENTUS_AGENT_API_KEY,
};

// Mock Agent class for compatibility
class IdentusAgentClient {
  private initialized = false;

  async start() {
    if (this.initialized) return;
    console.log('✅ Identus Agent initialized (using backend API)');
    this.initialized = true;
  }
  
  async stop() {
    console.log('Identus Agent stopped');
    this.initialized = false;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// Agent instance (singleton)
let agentInstance: IdentusAgentClient | null = null;

/**
 * Initialize Identus Agent
 * Uses backend API for all operations
 */
export async function initializeIdentusAgent(): Promise<IdentusAgentClient> {
  if (agentInstance) {
    return agentInstance;
  }

  agentInstance = new IdentusAgentClient();
  await agentInstance.start();
  return agentInstance;
}

/**
 * Get current agent instance
 */
export function getAgent(): IdentusAgentClient | null {
  return agentInstance;
}

/**
 * Create an Out-of-Band invitation for mobile wallet connection
 */
export async function createOOBInvitation(): Promise<OOBInvitation> {
  const agent = await initializeIdentusAgent();
  if (!agent.isInitialized()) {
    throw new Error('Agent not initialized');
  }

  return await createKYCInvitation();
}

/**
 * Create connection request (alias for createOOBInvitation)
 */
export async function createConnectionRequest(): Promise<OOBInvitation> {
  return await createOOBInvitation();
}

/**
 * Create a new PRISM DID for user
 */
export async function createPrismDID(
  alias: string,
  userId: string
): Promise<DIDResponse> {
  const agent = await initializeIdentusAgent();
  if (!agent.isInitialized()) {
    throw new Error('Agent not initialized');
  }

  return await apiCreateUserDID(alias, userId);
}

/**
 * Issue KYC credential to holder
 */
export async function issueKYCCredential(
  holderDID: string,
  fullName: string,
  email: string,
  skills: string[],
  userId: string,
  document?: File
): Promise<CredentialResponse> {
  const agent = await initializeIdentusAgent();
  if (!agent.isInitialized()) {
    throw new Error('Agent not initialized');
  }

  return await apiIssueKYCCredential({
    holderDID,
    fullName,
    email,
    skills,
    userId,
    document
  });
}

/**
 * Parse OOB invitation from URL or QR code
 */
export function parseOOBInvitation(oobUrl: string): any {
  try {
    // OOB URL format: https://domain.com?_oob=base64url_encoded_json
    const url = new URL(oobUrl);
    const oobParam = url.searchParams.get('_oob');
    
    if (!oobParam) {
      throw new Error('Invalid OOB URL: missing _oob parameter');
    }

    // Decode base64url
    const jsonStr = atob(oobParam.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error parsing OOB invitation:', error);
    throw error;
  }
}

/**
 * Generate QR code data URL from OOB invitation
 */
export async function generateQRCode(oobUrl: string): Promise<string> {
  // Use QR server API for simplicity
  const encodedUrl = encodeURIComponent(oobUrl);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedUrl}`;
}

/**
 * Get all DIDs (mock - returns empty array, DIDs are managed by backend)
 */
export async function getAllDIDs(): Promise<any[]> {
  // In this architecture, DIDs are managed by backend
  // This is a compatibility function
  return [];
}

/**
 * Get all credentials (mock - returns empty array, credentials are managed by backend)
 */
export async function getAllCredentials(): Promise<any[]> {
  // In this architecture, credentials are managed by backend
  // This is a compatibility function
  return [];
}

// Export types for convenience
export type { OOBInvitation, DIDResponse, CredentialResponse };
