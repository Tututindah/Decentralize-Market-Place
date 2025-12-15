/**
 * Backend API Client
 * Connects frontend to DID KYC backend service
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface OOBInvitation {
  oobUrl: string;
  invitationId: string;
  qrCode: string; // Base64 data URL
}

export interface DIDResponse {
  did: string;
  alias: string;
  createdAt: string;
}

export interface CredentialResponse {
  credential: {
    id: string;
    type: string;
    issuer: string;
    issuanceDate: string;
  };
  kycDocument: {
    id: string;
    verified: boolean;
    verifiedAt: string;
  };
}

export interface KYCStatus {
  hasDID: boolean;
  did?: string;
  verified: boolean;
  verifiedAt?: string;
  credentialId?: string;
}

/**
 * Create OOB invitation for mobile wallet connection
 */
export async function createKYCInvitation(
  goalCode: string = 'issue-kyc-credential',
  goal: string = 'KYC Verification for WorPlace Around'
): Promise<OOBInvitation> {
  const response = await fetch(`${API_URL}/api/kyc/create-invitation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ goalCode, goal }),
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to create invitation');
  }

  return result.data;
}

/**
 * Create a new DID for a user
 */
export async function createUserDID(
  userId: string,
  alias: string
): Promise<DIDResponse> {
  const response = await fetch(`${API_URL}/api/kyc/create-did`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, alias }),
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to create DID');
  }

  return result.data;
}

/**
 * Issue KYC credential
 */
export async function issueKYCCredential(data: {
  holderDID: string;
  fullName: string;
  email?: string;
  skills?: string[];
  userId: string;
  document?: File;
}): Promise<CredentialResponse> {
  const formData = new FormData();
  formData.append('holderDID', data.holderDID);
  formData.append('fullName', data.fullName);
  formData.append('userId', data.userId);

  if (data.email) {
    formData.append('email', data.email);
  }

  if (data.skills && data.skills.length > 0) {
    formData.append('skills', JSON.stringify(data.skills));
  }

  if (data.document) {
    formData.append('document', data.document);
  }

  const response = await fetch(`${API_URL}/api/kyc/issue-credential`, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to issue credential');
  }

  return result.data;
}

/**
 * Get credentials for a DID
 */
export async function getCredentials(did: string): Promise<any[]> {
  const response = await fetch(`${API_URL}/api/kyc/credential/${did}`);

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to get credentials');
  }

  return result.data;
}

/**
 * Verify a credential
 */
export async function verifyCredential(credential: any): Promise<boolean> {
  const response = await fetch(`${API_URL}/api/kyc/verify-credential`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ credential }),
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to verify credential');
  }

  return result.data.valid;
}

/**
 * Get KYC status for a user
 */
export async function getKYCStatus(userId: string): Promise<KYCStatus> {
  const response = await fetch(`${API_URL}/api/kyc/status/${userId}`);

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to get KYC status');
  }

  return result.data;
}

/**
 * Check backend health
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);
    const result = await response.json();
    return result.status === 'ok';
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}

export { API_URL };
