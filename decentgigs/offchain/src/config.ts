import { toUnit } from "@lucid-evolution/lucid";

/**
 * ===================================================================
 * DecentGigs Smart Contract Configuration
 * ===================================================================
 *
 * This file contains all configuration parameters for the DecentGigs
 * escrow smart contract on Cardano.
 *
 * IMPORTANT: Update these values before running the contract
 *
 * Setup Steps:
 * 1. Get Blockfrost API key from https://blockfrost.io
 * 2. Generate or use existing wallet seed phrases (24 words)
 * 3. Fund wallets with testnet ADA and USDM tokens
 * 4. Update the configuration values below
 * 5. Build and deploy the contract
 *
 * ===================================================================
 */

// ===================================================================
// BLOCKFROST CONFIGURATION
// ===================================================================

/**
 * Blockfrost API URL for Cardano Preprod Testnet
 *
 * This is the endpoint for accessing Cardano blockchain data
 * through Blockfrost's infrastructure.
 *
 * Networks:
 * - Preprod: https://cardano-preprod.blockfrost.io/api/v0
 * - Mainnet: https://cardano-mainnet.blockfrost.io/api/v0
 */
export const BLOCKFROST_API_URL = "https://cardano-preprod.blockfrost.io/api/v0";

/**
 * Blockfrost Project API Key
 *
 * Get your API key from: https://blockfrost.io
 * 1. Create an account
 * 2. Create a new project (select Preprod network)
 * 3. Copy the API key and paste below
 *
 * Example: "preprod1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6"
 */
export const BLOCKFROST_API_KEY = "preprodHRP2qbfZXQbN1FOMOio2HzZ9VO0vZigh";

// ===================================================================
// WALLET CONFIGURATION
// ===================================================================

/**
 * Employer Wallet Mnemonic (24-word seed phrase)
 *
 * This is the wallet that:
 * - Creates escrow jobs
 * - Locks USDM tokens
 * - Signs to release payment or cancel jobs
 *
 * Security:
 * - NEVER commit real seed phrases to version control
 * - Use environment variables in production
 * - Use hardware wallets for mainnet
 *
 * Generate new wallet:
 * - Daedalus/Yoroi wallet
 * - Cardano CLI
 * - Or use existing wallet
 *
 * Example: "word1 word2 word3 ... word24"
 */
export const EMPLOYER_MNEMONIC = "adapt payment ostrich expose noise twice bundle web brave top adapt club glance fortune number vintage daring arrest weasel produce sketch pilot kid midnight";

/**
 * Freelancer Wallet Mnemonic (24-word seed phrase)
 *
 * This is the wallet that:
 * - Receives payment when job is completed
 * - Signs to release payment or cancel jobs
 *
 * Must be different from employer wallet
 *
 * Example: "word1 word2 word3 ... word24"
 */
export const FREELANCER_MNEMONIC = "fruit client abuse follow feel spread diagram mention anxiety illegal crucial venture valve always turn render special guitar giraffe sea wood forget print minute";

// ===================================================================
// TOKEN CONFIGURATION
// ===================================================================

/**
 * USDM Token Policy ID
 *
 * USDM is a USD-pegged stablecoin on Cardano
 * This is the unique identifier for the USDM token
 *
 * Preprod USDM Policy ID (for testing)
 * Mainnet will have a different policy ID
 */
export const USDM_POLICY_ID = "c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad";

/**
 * USDM Token Asset Name (hexadecimal)
 *
 * This is the hex-encoded name of the USDM asset
 * "0014df105553444d" decodes to "USDM"
 */
export const USDM_ASSET_NAME = "0014df105553444d";

/**
 * USDM Unit Identifier
 *
 * Combines policy ID and asset name into a single unit identifier
 * Used by Lucid to identify the token in transactions
 *
 * Format: <policyId><assetName>
 */
export const USDM_UNIT = toUnit(USDM_POLICY_ID, USDM_ASSET_NAME);

// ===================================================================
// ESCROW PARAMETERS
// ===================================================================

/**
 * Default Lock Amount for Jobs
 *
 * Amount of USDM to lock in escrow for each job
 *
 * USDM uses 6 decimal places:
 * - 1 USDM = 1,000,000 units
 * - 5 USDM = 5,000,000 units
 * - 100 USDM = 100,000,000 units
 *
 * This can be customized per job in the deployment script
 */
export const LOCK_AMOUNT = 5_000_000n; // 5 USDM

// ===================================================================
// NETWORK CONFIGURATION
// ===================================================================

/**
 * Cardano Network
 *
 * Options:
 * - "Preprod": Cardano preprod testnet (for testing)
 * - "Mainnet": Cardano mainnet (for production)
 *
 * Current: Preprod (testnet)
 *
 * IMPORTANT: Always test on Preprod before deploying to Mainnet
 */
export const NETWORK = "Preprod" as const;

// ===================================================================
// VALIDATION
// ===================================================================

/**
 * Configuration Validator
 *
 * Checks if configuration is properly set before running scripts
 *
 * @returns true if configuration is valid
 * @throws Error if configuration is invalid
 */
export function validateConfig(): boolean {
  const errors: string[] = [];

  if (BLOCKFROST_API_KEY.includes("YOUR_")) {
    errors.push("Blockfrost API key not set");
  }

  const isDefaultEmployer = EMPLOYER_MNEMONIC.includes("your 24 word");
  const isDefaultFreelancer = FREELANCER_MNEMONIC.includes("your 24 word");

  if (isDefaultEmployer) {
    errors.push("Employer mnemonic not set");
  }

  if (isDefaultFreelancer) {
    errors.push("Freelancer mnemonic not set");
  }

  if (!isDefaultEmployer && !isDefaultFreelancer) {
    if ((EMPLOYER_MNEMONIC as string) === (FREELANCER_MNEMONIC as string)) {
      errors.push("Employer and Freelancer must have different wallets");
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Configuration errors:\n${errors.map(e => `  - ${e}`).join('\n')}\n\n` +
      `Please update src/config.ts with valid values.`
    );
  }

  return true;
}

// ===================================================================
// EXPORT ALL CONFIGURATION
// ===================================================================

export default {
  BLOCKFROST_API_URL,
  BLOCKFROST_API_KEY,
  EMPLOYER_MNEMONIC,
  FREELANCER_MNEMONIC,
  USDM_POLICY_ID,
  USDM_ASSET_NAME,
  USDM_UNIT,
  LOCK_AMOUNT,
  NETWORK,
};