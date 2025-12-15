/**
 * Mock Identus SDK Types
 * Placeholder until SDK is properly installed
 */

// Mock Agent class
export class Agent {
  async start(): Promise<void> {
    console.log('Mock Identus Agent started');
  }

  async stop(): Promise<void> {
    console.log('Mock Identus Agent stopped');
  }
}

// Mock SDK exports
export const Domain = {
  Message: class {
    static fromJson(_json: string) {
      return {};
    }
  },
  ApiImpl: class {},
  InMemoryStore: class {
    static async load() {
      return new this();
    }
  },
};

// Mock connection types
export interface ConnectionRequest {
  type: string;
  from: string;
  to?: string[];
  body: any;
}

export interface Credential {
  id: string;
  type: string[];
  credentialSubject: any;
  issuer: string;
  issuanceDate: string;
}

export default {
  Agent,
  Domain,
};
