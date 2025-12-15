// Admin configuration for the TrustFlow platform
export const ADMIN_CONFIG = {
  // Arbiter addresses for different networks
  arbiters: {
    preprod: [
      'addr_test1qz3s3c8l8qp3j7n7z5x6y5w8v9u7t6s5r4q3p2o1n0m9l8k7j6h5g4f3d2s1',
      'addr_test1qz4s4c9l9qp4j8n8z6x7y6w9v0u8t7s6r5q4p3o2n1m0l9k8j7h6g5f4d3s2',
    ],
    mainnet: [
      'addr1qx3s3c8l8qp3j7n7z5x6y5w8v9u7t6s5r4q3p2o1n0m9l8k7j6h5g4f3d2s1',
      'addr1qx4s4c9l9qp4j8n8z6x7y6w9v0u8t7s6r5q4p3o2n1m0l9k8j7h6g5f4d3s2',
    ],
  },

  // Default arbiter address based on environment
  defaultNetwork: (process.env.NEXT_PUBLIC_CARDANO_NETWORK || 'preprod') as 'preprod' | 'mainnet',

  // Fee structure
  fees: {
    platformFeePercentage: 2.5, // 2.5% platform fee
    disputeFee: 10, // 10 ADA dispute fee
  },

  // Escrow settings
  escrow: {
    defaultThreshold: 2, // 2 of 3 signatures required
    lockPeriod: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    minEscrowAmount: 10, // Minimum 10 ADA
    maxEscrowAmount: 100000, // Maximum 100,000 ADA
  },
  
  // Direct access to platform fee percentage (for backwards compatibility)
  platformFeePercentage: 2.5,
  minEscrowAmount: 10,
  maxEscrowAmount: 100000,
};

// Get arbiter address for current network
export function getArbiterAddress(index: number = 0): string {
  const network = ADMIN_CONFIG.defaultNetwork;
  const arbiters = ADMIN_CONFIG.arbiters[network];
  return arbiters[index] || arbiters[0];
}

// Get all arbiters for current network
export function getAllArbiters(): string[] {
  const network = ADMIN_CONFIG.defaultNetwork;
  return ADMIN_CONFIG.arbiters[network];
}

// Check if address is an arbiter
export function isArbiter(address: string): boolean {
  const arbiters = getAllArbiters();
  return arbiters.includes(address);
}
