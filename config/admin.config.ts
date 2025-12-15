/**
 * Admin Configuration
 * Hardcoded admin addresses for platform operations
 */

/**
 * ARBITER WALLET ADDRESS
 * This is the designated arbiter for dispute resolution in escrows
 * The arbiter can mediate disputes and approve refunds
 *
 * IMPORTANT: In production, use a secure admin wallet address
 * For development/testing on Preprod network
 */
export const ADMIN_ARBITER_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ARBITER_ADDRESS ||
  "addr_test1qzx9hu8j4ah3auytk0mwcaavrrzjvxrxmxf6gp2yy52kkxprt4x67w2l4rjqfxygrx8rhlcxf4gp5nvnmxmh2qyag3rs4ntx4c";

/**
 * Platform admin addresses (for future use)
 */
export const ADMIN_CONFIG = {
  // Main arbiter for escrow disputes
  arbiterAddress: ADMIN_ARBITER_ADDRESS,

  // Platform fee wallet (for future implementation)
  feeWalletAddress: process.env.NEXT_PUBLIC_FEE_WALLET_ADDRESS || ADMIN_ARBITER_ADDRESS,

  // Platform fee percentage (e.g., 2.5%)
  platformFeePercentage: parseFloat(process.env.NEXT_PUBLIC_PLATFORM_FEE || "2.5"),

  // Minimum escrow amount in USDM (with 6 decimals)
  minEscrowAmount: 10_000_000, // 10 USDM

  // Maximum escrow amount in USDM (with 6 decimals)
  maxEscrowAmount: 1_000_000_000_000, // 1,000,000 USDM
};

/**
 * Get arbiter address for escrow creation
 */
export function getArbiterAddress(): string {
  return ADMIN_CONFIG.arbiterAddress;
}

/**
 * Validate if address is admin
 */
export function isAdminAddress(address: string): boolean {
  return address === ADMIN_CONFIG.arbiterAddress ||
         address === ADMIN_CONFIG.feeWalletAddress;
}
