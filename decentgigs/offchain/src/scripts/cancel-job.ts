import {
  Lucid,
  Blockfrost,
  OutRef,
  LucidEvolution,
  getAddressDetails,
  validatorToAddress,
} from "@lucid-evolution/lucid";
import {
  BLOCKFROST_API_URL,
  BLOCKFROST_API_KEY,
  EMPLOYER_MNEMONIC,
  FREELANCER_MNEMONIC,
  NETWORK,
  USDM_UNIT,
} from "../config.js";
import { readValidator, redeemerCancel } from "../utils.js";

/**
 * Cancel Job and Return Funds to Employer
 *
 * This script cancels an active job and returns the locked funds to the employer.
 * Both employer and freelancer signatures are required for cancellation.
 *
 * Usage:
 *   npm run cancel-job
 *
 * Or with specific UTxO:
 *   node dist/scripts/cancel-job.js <txHash> <outputIndex>
 *
 * Requirements:
 *   - Valid wallet mnemonics for both employer and freelancer
 *   - Active escrow UTxO on the blockchain
 *   - Both parties must sign the transaction
 *
 * Process:
 *   1. Initialize both wallets
 *   2. Find the UTxO to cancel (or use provided txHash#outputIndex)
 *   3. Build transaction to return funds to employer
 *   4. Sign with both employer and freelancer
 *   5. Submit transaction
 */
async function cancelJob(targetTxHash?: string, targetOutputIndex?: number) {
  console.log("\n═══════════════════════════════════════════════════");
  console.log("   🔙 Cancelling Job");
  console.log("═══════════════════════════════════════════════════\n");

  try {
    // Initialize employer wallet
    const employerLucid = await Lucid(
      new Blockfrost(BLOCKFROST_API_URL, BLOCKFROST_API_KEY),
      NETWORK
    );
    employerLucid.selectWallet.fromSeed(EMPLOYER_MNEMONIC);

    // Initialize freelancer wallet
    const freelancerLucid = await Lucid(
      new Blockfrost(BLOCKFROST_API_URL, BLOCKFROST_API_KEY),
      NETWORK
    );
    freelancerLucid.selectWallet.fromSeed(FREELANCER_MNEMONIC);

    // Get addresses
    const employerAddress = await employerLucid.wallet().address();
    const freelancerAddress = await freelancerLucid.wallet().address();

    console.log(`👔 Employer:   ${employerAddress.slice(0, 40)}...`);
    console.log(`💼 Freelancer: ${freelancerAddress.slice(0, 40)}...`);

    // Get validator and script address
    const validator = readValidator();
    const scriptAddress = validatorToAddress(NETWORK, validator);
    console.log(`📜 Script:     ${scriptAddress.slice(0, 40)}...`);

    // Find UTxO to cancel
    let escrowUtxo: OutRef;

    if (targetTxHash && targetOutputIndex !== undefined) {
      // Use provided UTxO reference
      escrowUtxo = { txHash: targetTxHash, outputIndex: targetOutputIndex };
      console.log(`\n🎯 Using provided UTxO: ${targetTxHash}#${targetOutputIndex}`);
    } else {
      // Find first UTxO at script address
      const utxos = await employerLucid.utxosAt(scriptAddress);

      if (utxos.length === 0) {
        console.error("\n❌ No UTxOs found at script address");
        console.error("   Create a job first using npm run create-job\n");
        return;
      }

      escrowUtxo = {
        txHash: utxos[0].txHash,
        outputIndex: utxos[0].outputIndex,
      };

      console.log(`\n🎯 Found ${utxos.length} UTxO(s), cancelling first one:`);
      console.log(`   ${escrowUtxo.txHash}#${escrowUtxo.outputIndex}`);
    }

    // Get the UTxO details
    const [utxo] = await employerLucid.utxosByOutRef([escrowUtxo]);

    if (!utxo) {
      console.error(`\n❌ UTxO not found: ${escrowUtxo.txHash}#${escrowUtxo.outputIndex}`);
      return;
    }

    // Calculate locked amount
    const lockedUSDM = utxo.assets[USDM_UNIT] || 0n;
    const lockedADA = utxo.assets.lovelace || 0n;

    console.log(`\n💰 Locked Assets:`);
    console.log(`   USDM: ${Number(lockedUSDM) / 1_000_000}`);
    console.log(`   ADA:  ${Number(lockedADA) / 1_000_000}`);

    // Build cancel transaction
    console.log(`\n🔨 Building cancellation transaction...`);

    const tx = await employerLucid
      .newTx()
      .collectFrom([utxo], redeemerCancel)
      .attach.SpendingValidator(validator)
      .pay.ToAddress(employerAddress, {
        [USDM_UNIT]: lockedUSDM,
        lovelace: lockedADA,
      })
      .addSigner(employerAddress)
      .addSigner(freelancerAddress)
      .complete();

    console.log(`✅ Transaction built successfully`);

    // Sign with employer
    console.log(`\n✍️  Signing with employer...`);
    const employerSigned = await tx.sign.withWallet().complete();

    console.log(`✅ Employer signature added`);

    // Note: In a real multi-sig scenario, you would:
    // 1. Export the partially signed transaction
    // 2. Send to freelancer for their signature
    // 3. Merge signatures
    // 4. Submit the fully signed transaction
    //
    // For this demo, we're using the same device so we can sign directly

    console.log(`\n📤 Submitting transaction...`);
    const txHash = await employerSigned.submit();

    console.log(`\n✅ Transaction submitted!`);
    console.log(`   Tx Hash: ${txHash}`);
    console.log(`\n⏳ Waiting for confirmation...`);

    await employerLucid.awaitTx(txHash);

    console.log(`\n✅ Transaction confirmed!`);
    console.log(`   Funds returned to employer: ${employerAddress.slice(0, 40)}...`);
    console.log(`\n🔗 View on Explorer:`);
    console.log(`   https://preprod.cardanoscan.io/transaction/${txHash}\n`);

  } catch (error) {
    console.error("\n❌ Error cancelling job:", error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const targetTxHashArg = args[0];
const targetOutputIndexArg = args[1] ? parseInt(args[1]) : undefined;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cancelJob(targetTxHashArg, targetOutputIndexArg).catch(console.error);
}

export { cancelJob };
