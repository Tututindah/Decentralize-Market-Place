import {
  Lucid,
  Blockfrost,
  PolicyId,
  Unit,
  fromText,
  LucidEvolution,
  getAddressDetails,
} from "@lucid-evolution/lucid";
import {
  BLOCKFROST_API_URL,
  BLOCKFROST_API_KEY,
  EMPLOYER_MNEMONIC,
  NETWORK,
} from "../config.js";
import * as fs from "fs";

/**
 * ===================================================================
 * Mock USDM Token Minting Script
 * ===================================================================
 *
 * This script mints mock USDM tokens for testing the DecentGigs platform
 * on the Cardano preprod testnet.
 *
 * IMPORTANT: This is for TESTING ONLY
 * On mainnet, you would use real USDM tokens from the official USDM provider.
 *
 * Usage:
 *   npm run mint-usdm <amount>
 *
 * Example:
 *   npm run mint-usdm 10000   # Mint 10,000 USDM tokens
 *
 * ===================================================================
 */

/**
 * Mint Mock USDM Tokens
 *
 * This uses a simple native script approach where the minting policy
 * is the payment credential hash of the wallet. This allows the wallet
 * owner to mint and burn tokens freely (for testing purposes only).
 *
 * @param amount - Amount to mint (in whole USDM units, not atomic)
 */
async function mintMockUSDM(amount: number) {
  console.log("\n═══════════════════════════════════════════════════");
  console.log("   🪙 Minting Mock USDM Tokens on Blockchain");
  console.log("═══════════════════════════════════════════════════\n");

  try {
    // Initialize Lucid
    const lucid = await Lucid(
      new Blockfrost(BLOCKFROST_API_URL, BLOCKFROST_API_KEY),
      NETWORK
    );

    // Select employer wallet as the minter
    lucid.selectWallet.fromSeed(EMPLOYER_MNEMONIC);

    const address = await lucid.wallet().address();
    const { paymentCredential } = getAddressDetails(address);

    if (!paymentCredential) {
      throw new Error("No payment credential found");
    }

    console.log(`🔑 Minter Address: ${address}\n`);
    console.log(`📋 Payment PKH: ${paymentCredential.hash}\n`);

    // Check wallet balance
    const utxos = await lucid.wallet().getUtxos();
    const balance = utxos.reduce(
      (sum, utxo) => sum + Number(utxo.assets.lovelace || 0n),
      0
    ) / 1_000_000;

    console.log(`💰 Current ADA Balance: ${balance.toFixed(6)} ADA`);

    if (balance < 5) {
      console.error("\n❌ Insufficient ADA! Need at least 5 ADA");
      console.error("   Get test ADA from: https://docs.cardano.org/cardano-testnet/tools/faucet/\n");
      return;
    }

    // Use payment credential hash as policy ID (simple native script)
    const policyId = paymentCredential.hash as PolicyId;

    console.log(`\n🔨 Creating mock USDM token...`);
    console.log(`   Policy ID: ${policyId}`);

    // Define asset name
    const assetName = fromText("MOCK_USDM");
    const unit: Unit = policyId + assetName;

    // Convert amount to atomic units (6 decimals, like real USDM)
    const atomicAmount = BigInt(amount * 1_000_000);

    console.log(`\n💸 Minting ${amount.toLocaleString()} MOCK_USDM tokens...`);
    console.log(`   Asset Name: ${assetName}`);
    console.log(`   Unit: ${unit}`);
    console.log(`   Atomic Amount: ${atomicAmount.toLocaleString()}`);

    // Build and complete transaction
    console.log(`\n🔧 Building transaction...`);
    const tx = await lucid
      .newTx()
      .mintAssets({
        [unit]: atomicAmount,
      })
      .complete();

    // Sign transaction
    console.log(`✍️  Signing transaction...`);
    const signedTx = await tx.sign.withWallet().complete();

    // Submit to blockchain
    console.log(`📤 Submitting to blockchain...`);
    const txHash = await signedTx.submit();

    console.log(`\n✅ Transaction submitted!`);
    console.log(`   TX Hash: ${txHash}`);
    console.log(`   Explorer: https://preprod.cardanoscan.io/transaction/${txHash}`);

    // Wait for confirmation
    console.log(`\n⏳ Waiting for blockchain confirmation...`);
    await lucid.awaitTx(txHash);

    console.log(`\n🎉 Minting successful!`);
    console.log(`\n╔═══════════════════════════════════════════════════╗`);
    console.log(`║         Mock USDM Token Details                   ║`);
    console.log(`╚═══════════════════════════════════════════════════╝`);
    console.log(`   Policy ID:    ${policyId}`);
    console.log(`   Asset Name:   ${assetName}`);
    console.log(`   Unit:         ${unit}`);
    console.log(`   Amount:       ${amount.toLocaleString()} MOCK_USDM`);
    console.log(`   Atomic:       ${atomicAmount.toLocaleString()} (6 decimals)`);
    console.log(`   TX Hash:      ${txHash}`);
    console.log(`   Minter:       ${address.slice(0, 50)}...`);

    // Save policy info to file
    const policyInfo = {
      policyId,
      assetName,
      unit,
      mintTxHash: txHash,
      amount,
      atomicAmount: atomicAmount.toString(),
      minter: address,
      network: NETWORK,
      createdAt: Date.now(),
      explorerUrl: `https://preprod.cardanoscan.io/transaction/${txHash}`,
    };

    const policyFile = "mock_usdm_policy.json";
    fs.writeFileSync(policyFile, JSON.stringify(policyInfo, null, 2));

    console.log(`\n💾 Policy info saved to: ${policyFile}`);

    console.log(`\n📝 Update your config.ts with these values:`);
    console.log(`╔═══════════════════════════════════════════════════╗`);
    console.log(`   export const USDM_POLICY_ID = "${policyId}";`);
    console.log(`   export const USDM_ASSET_NAME = "${assetName}";`);
    console.log(`╚═══════════════════════════════════════════════════╝`);

    console.log(`\n✨ Mock USDM tokens minted successfully on Cardano preprod!`);
    console.log(`   You can now use these tokens in your DecentGigs escrow contracts.\n`);

    return {
      policyId,
      assetName,
      unit,
      txHash,
      amount,
      explorerUrl: `https://preprod.cardanoscan.io/transaction/${txHash}`,
    };

  } catch (error) {
    console.error("\n❌ Error minting USDM:", error);
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
    }
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const amount = args[0] ? parseInt(args[0]) : 10000; // Default 10,000 USDM

console.log(`\n⚠️  NOTICE: Minting ${amount.toLocaleString()} Mock USDM tokens for TESTING ONLY`);
console.log(`   This is NOT real USDM. Use only on Cardano preprod testnet.`);

// Run minting if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  mintMockUSDM(amount).catch(console.error);
}

export { mintMockUSDM };
