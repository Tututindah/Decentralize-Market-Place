import { supabase } from '@/app/src/lib/supabase';
import { Database } from '@/app/src/lib/database.types';

type UserUpdate = Database['public']['Tables']['users']['Update'];

export interface KYCData {
  userId: string;
  fullName: string;
  email?: string;
  documentType?: string;
  documentNumber?: string;
  did?: string;
  verificationMethod?: 'mock' | 'identus' | 'prism';
}

export interface KYCResult {
  success: boolean;
  did?: string;
  credential?: any;
  error?: string;
}

export class KYCService {
  // Submit KYC information
  async submitKYC(data: KYCData): Promise<KYCResult> {
    try {
      // Generate mock DID if not provided
      const did = data.did || this.generateMockDID();

      // Update user with KYC information
      const { error } = await supabase
        .from('users')
        .update({
          name: data.fullName,
          email: data.email,
        })
        .eq('id', data.userId);

      if (error) {
        throw new Error(`Failed to submit KYC: ${error.message}`);
      }

      // Generate mock credential
      const credential = this.generateMockCredential(did, data);

      return {
        success: true,
        did,
        credential,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Verify KYC status
  async verifyKYC(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('users')
      .select('kyc_verified')
      .eq('id', userId)
      .single();

    if (error) {
      return false;
    }

    return data?.kyc_verified || false;
  }

  // Generate mock DID (for development)
  generateMockDID(): string {
    const randomId = Math.random().toString(36).substring(2, 15);
    return `did:prism:${randomId}`;
  }

  // Generate mock Verifiable Credential
  generateMockCredential(did: string, data: KYCData): any {
    const now = new Date().toISOString();
    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://www.w3.org/2018/credentials/examples/v1',
      ],
      id: `urn:uuid:${Math.random().toString(36).substring(2)}`,
      type: ['VerifiableCredential', 'KYCCredential'],
      issuer: 'did:prism:issuer:trustflow',
      issuanceDate: now,
      credentialSubject: {
        id: did,
        name: data.fullName,
        email: data.email,
        kycVerified: true,
        verificationDate: now,
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: now,
        proofPurpose: 'assertionMethod',
        verificationMethod: `${did}#keys-1`,
        jws: `mock-signature-${Math.random().toString(36).substring(2)}`,
      },
    };
  }

  // Get KYC details for user
  async getKYCDetails(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('users')
      .select('name, email, kyc_verified, did_identifier')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to get KYC details: ${error.message}`);
    }

    return data;
  }

  // Mint reputation NFT (delegates to reputation service)
  async mintReputationNFT(userId: string, txHash?: string): Promise<any> {
    // Import dynamically to avoid circular dependency
    const { reputationService } = await import('./reputation.service');
    return reputationService.mintReputationNFT(userId, txHash);
  }
}

export const kycService = new KYCService();
