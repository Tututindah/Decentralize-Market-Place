import {
  Lucid,
  Blockfrost,
  LucidEvolution,
  getAddressDetails,
} from "@lucid-evolution/lucid";
import {
  BLOCKFROST_API_URL,
  BLOCKFROST_API_KEY,
  EMPLOYER_MNEMONIC,
  FREELANCER_MNEMONIC,
  NETWORK,
  USDM_UNIT,
} from "../config.js";

/**
 * Wallet Balance Information
 */
interface WalletBalance {
  address: string;
  ada: number;
  usdm: number;
  utxoCount: number;
}

/**
 * Check Wallet Balances
 *
 * This script checks and displays the balances of both employer and freelancer
 * wallets, including ADA and USDM token amounts.
 *
 * Usage:
 *   npm run check-balance
 *
 * Requirements:
 *   - Valid wallet mnemonics in config.ts
 *   - Valid Blockfrost API key
 *
 * Output:
 *   - Wallet addresses
 *   - ADA balance
 *   - USDM token balance
 *   - Number of UTxOs
 */
async function checkWalletBalance(
  mnemonic: string,
  label: string
): Promise<WalletBalance> {
  // Initialize Lucid and select wallet
  const lucid = await Lucid(
    new Blockfrost(BLOCKFROST_API_URL, BLOCKFROST_API_KEY),
    NETWORK
  );

  lucid.selectWallet.fromSeed(mnemonic);

  // Get wallet address
  const address = await lucid.wallet().address();

  // Get all UTxOs
  const utxos = await lucid.wallet().getUtxos();

  // Calculate total ADA
  const totalAda = utxos.reduce(
    (sum, utxo) => sum + Number(utxo.assets.lovelace || 0n),
    0
  ) / 1_000_000;

  // Calculate total USDM
  const totalUSDM = utxos.reduce(
    (sum, utxo) => sum + Number(utxo.assets[USDM_UNIT] || 0n),
    0
  ) / 1_000_000;

  // Display balance information
  console.log(`╔═══════════════════════════════════════════════════╗`);
  console.log(`║ ${label.padEnd(49)} ║`);
  console.log(`╚═══════════════════════════════════════════════════╝`);
  console.log(`   📍 Address:      ${address.slice(0, 30)}...`);
  console.log(`   💰 ADA Balance:  ${totalAda.toFixed(6)} ADA`);
  console.log(`   💵 USDM Balance: ${totalUSDM.toFixed(6)} USDM`);
  console.log(`   📦 UTxO Count:   ${utxos.length}`);
  console.log(`   🔗 Explorer:     https://preprod.cardanoscan.io/address/${address}`);
  console.log();

  return {
    address,
    ada: totalAda,
    usdm: totalUSDM,
    utxoCount: utxos.length,
  };
}

/**
 * Main function to check all wallet balances
 */
async function checkAllBalances() {
  console.log("\n═══════════════════════════════════════════════════");
  console.log("   💳 Checking Wallet Balances");
  console.log("═══════════════════════════════════════════════════\n");

  try {
    // Check if configuration is valid
    if (
      EMPLOYER_MNEMONIC.includes("your 24 word") ||
      FREELANCER_MNEMONIC.includes("your 24 word")
    ) {
      console.error("❌ ERROR: Please update wallet mnemonics in config.ts");
      console.error("   Generate new wallets or use existing seed phrases.\n");
      return;
    }

    // Check employer wallet
    const employerBalance = await checkWalletBalance(
      EMPLOYER_MNEMONIC,
      "👔 Employer Wallet"
    );

    // Check freelancer wallet
    const freelancerBalance = await checkWalletBalance(
      FREELANCER_MNEMONIC,
      "💼 Freelancer Wallet"
    );

    // Display summary
    console.log(`═══════════════════════════════════════════════════`);
    console.log(`   📊 Summary:`);
    console.log(`      Total ADA:  ${(employerBalance.ada + freelancerBalance.ada).toFixed(6)} ADA`);
    console.log(`      Total USDM: ${(employerBalance.usdm + freelancerBalance.usdm).toFixed(6)} USDM`);
    console.log(`═══════════════════════════════════════════════════\n`);

    // Check if wallets have sufficient funds
    if (employerBalance.ada < 10) {
      console.log("⚠️  WARNING: Employer wallet has less than 10 ADA");
      console.log("   Get test ADA from: https://docs.cardano.org/cardano-testnet/tools/faucet/\n");
    }

    if (freelancerBalance.ada < 5) {
      console.log("⚠️  WARNING: Freelancer wallet has less than 5 ADA");
      console.log("   Get test ADA from: https://docs.cardano.org/cardano-testnet/tools/faucet/\n");
    }

  } catch (error) {
    console.error("\n❌ Error checking balances:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkAllBalances().catch(console.error);
}

export { checkWalletBalance, checkAllBalances, WalletBalance };
