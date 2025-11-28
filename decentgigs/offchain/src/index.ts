import {
  Lucid,
  Blockfrost,
  OutRef,
  TxHash,
  Datum,
  Address,
  LucidEvolution,
  getAddressDetails,
  validatorToAddress,
} from "@lucid-evolution/lucid";

import {
  BLOCKFROST_API_URL,
  BLOCKFROST_API_KEY,
  EMPLOYER_MNEMONIC,
  FREELANCER_MNEMONIC,
  USDM_UNIT,
  LOCK_AMOUNT,
  NETWORK,
} from "./config.js";

import { readValidator, redeemerRelease, redeemerCancel, createJobDatum } from "./utils.js";


async function initLucid(seedPhrase: string): Promise<LucidEvolution> {
  const lucid = await Lucid(
    new Blockfrost(BLOCKFROST_API_URL, BLOCKFROST_API_KEY),
    NETWORK
  );

  lucid.selectWallet.fromSeed(seedPhrase);
  return lucid;
}

async function deployEscrow(
  lucid: LucidEvolution,
  validatorAddress: Address,
  employerPkh: string,
  freelancerPkh: string,
  amount: bigint
): Promise<TxHash> {
  console.log("\n🔒 Creating Escrow (Locking Funds)...");
  console.log(`   Amount: ${amount} USDM`);
  console.log(`   Script Address: ${validatorAddress}`);

  const datum = createJobDatum(employerPkh, freelancerPkh);

  const tx = await lucid
    .newTx()
    .pay.ToAddressWithData(
      validatorAddress,
      {
        kind: "inline",
        value: datum,
      },
      {
        [USDM_UNIT]: amount,
        lovelace: 2_000_000n, 
      }
    )
    .complete();

  const signedTx = await tx.sign.withWallet().complete();
  const txHash = await signedTx.submit();

  console.log(`   ✅ Tx submitted: ${txHash}`);
  return txHash;
}


async function releasePayment(
  employerLucid: LucidEvolution,
  freelancerLucid: LucidEvolution,
  escrowUtxo: OutRef,
  freelancerAddress: Address,
  employerAddress: Address
): Promise<TxHash> {
  console.log("\n💸 Releasing Payment to Freelancer...");

  const [utxo] = await employerLucid.utxosByOutRef([escrowUtxo]);
  if (!utxo) throw new Error("❌ Escrow UTXO not found");

  const lockedAmount = utxo.assets[USDM_UNIT] || 0n;
  console.log(`   Locked USDM: ${lockedAmount}`);
  console.log(`   Sending to: ${freelancerAddress}`);

  const validator = readValidator();

  const tx = await employerLucid
    .newTx()
    .collectFrom([utxo], redeemerRelease)
    .attach.SpendingValidator(validator)
    .pay.ToAddress(freelancerAddress, {
      [USDM_UNIT]: lockedAmount,
      lovelace: 2_000_000n,
    })
    .addSigner(employerAddress)
    .addSigner(freelancerAddress)
    .complete();

  console.log("   ✍️  Signing with employer...");
  const employerSigned = await tx.sign.withWallet().complete();

  // TODO: Multi-sig: merge signatures if SDK supports. For now, only employer signature is submitted.
  const txHash = await employerSigned.submit();
  console.log(`   ✅ Tx submitted: ${txHash}`);
  return txHash;
}

async function cancelJob(
  employerLucid: LucidEvolution,
  freelancerLucid: LucidEvolution,
  escrowUtxo: OutRef,
  employerAddress: Address,
  freelancerAddress: Address
): Promise<TxHash> {
  console.log("\n🔙 Cancelling Job (Returning to Employer)...");

  const [utxo] = await employerLucid.utxosByOutRef([escrowUtxo]);
  if (!utxo) throw new Error("❌ Escrow UTXO not found");

  const lockedAmount = utxo.assets[USDM_UNIT] || 0n;
  console.log(`   Locked USDM: ${lockedAmount}`);
  console.log(`   Returning to: ${employerAddress}`);

  const validator = readValidator();
  const tx = await employerLucid
    .newTx()
    .collectFrom([utxo], redeemerCancel)
    .attach.SpendingValidator(validator)
    .pay.ToAddress(employerAddress, {
      [USDM_UNIT]: lockedAmount,
      lovelace: 2_000_000n,
    })
    .addSigner(employerAddress)
    .addSigner(freelancerAddress)
    .complete();

  console.log("   ✍️  Signing with employer...");
  const employerSigned = await tx.sign.withWallet().complete();

  // TODO: Multi-sig: merge signatures if SDK supports. For now, only employer signature is submitted.
  const txHash = await employerSigned.submit();
  console.log(`   ✅ Tx submitted: ${txHash}`);
  return txHash;
}


async function main() {
  console.log("\n═══════════════════════════════════════════════════");
  console.log("   🚀 DecentGigs Escrow Deployment");
  console.log("═══════════════════════════════════════════════════\n");

  if (BLOCKFROST_API_KEY.includes("YOUR_") || EMPLOYER_MNEMONIC.includes("seed_phrase")) {
    console.error("❌ ERROR: Please update configuration in src/config.ts");
    console.error("   - Get Blockfrost API key from: https://blockfrost.io");
    console.error("   - Generate wallet mnemonics or use existing ones");
    return;
  }

  try {
    console.log("📡 Initializing wallets...");
    const employerLucid = await initLucid(EMPLOYER_MNEMONIC);
    const freelancerLucid = await initLucid(FREELANCER_MNEMONIC);

    const employerAddress = await employerLucid.wallet().address();
    const freelancerAddress = await freelancerLucid.wallet().address();

    const employerPkh = getAddressDetails(employerAddress).paymentCredential?.hash!;
    const freelancerPkh = getAddressDetails(freelancerAddress).paymentCredential?.hash!;

    const validator = readValidator();
    const validatorAddress = validatorToAddress(NETWORK, validator);

    console.log("✅ Wallets loaded:");
    console.log(`   Employer:   ${employerAddress}`);
    console.log(`   Freelancer: ${freelancerAddress}`);
    console.log(`   Script:     ${validatorAddress}\n`);

    const employerUtxos = await employerLucid.wallet().getUtxos();
    const employerAda = employerUtxos.reduce(
      (sum, utxo) => sum + (utxo.assets.lovelace || 0n),
      0n
    );

    console.log(`💰 Employer Balance: ${Number(employerAda) / 1_000_000} ADA`);


    if (employerAda < 10_000_000n) {
      console.error("\n❌ Insufficient funds! Need at least 10 ADA");
      console.error("   Get test ADA from: https://docs.cardano.org/cardano-testnet/tools/faucet/");
      return;
    }

    let deployedUtxo: OutRef | undefined;

    try {
      const deployTxHash = await deployEscrow(
        employerLucid,
        validatorAddress,
        employerPkh,
        freelancerPkh,
        LOCK_AMOUNT
      );

      console.log("   ⏳ Waiting for confirmation...");
      await employerLucid.awaitTx(deployTxHash);
      console.log("   ✅ Confirmed!");

      deployedUtxo = { txHash: deployTxHash, outputIndex: 0 };

      console.log(`\n🔗 View on Explorer:`);
      console.log(`   https://preprod.cardanoscan.io/transaction/${deployTxHash}`);
    } catch (error) {
      console.error("\n❌ Deploy failed:", error);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));

    if (deployedUtxo) {
      try {
        const releaseTxHash = await releasePayment(
          employerLucid,
          freelancerLucid,
          deployedUtxo,
          freelancerAddress,
          employerAddress
        );

        console.log("   ⏳ Waiting for confirmation...");
        await employerLucid.awaitTx(releaseTxHash);
        console.log("   ✅ Confirmed! Freelancer received payment.");

        console.log(`\n🔗 View on Explorer:`);
        console.log(`   https://preprod.cardanoscan.io/transaction/${releaseTxHash}`);
      } catch (error) {
        console.error("\n❌ Release payment failed:", error);
      }
    }

    console.log("\n--- Testing Cancel Scenario ---");
    console.log("   Creating new escrow for cancel test...");

    let cancelUtxo: OutRef | undefined;

    try {
      const cancelDeployTxHash = await deployEscrow(
        employerLucid,
        validatorAddress,
        employerPkh,
        freelancerPkh,
        LOCK_AMOUNT
      );

      console.log("   ⏳ Waiting for confirmation...");
      await employerLucid.awaitTx(cancelDeployTxHash);
      console.log("   ✅ Confirmed!");

      cancelUtxo = { txHash: cancelDeployTxHash, outputIndex: 0 };

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const cancelTxHash = await cancelJob(
        employerLucid,
        freelancerLucid,
        cancelUtxo,
        employerAddress,
        freelancerAddress
      );

      console.log("   ⏳ Waiting for confirmation...");
      await employerLucid.awaitTx(cancelTxHash);
      console.log("   ✅ Confirmed! Funds returned to employer.");

      console.log(`\n🔗 View on Explorer:`);
      console.log(`   https://preprod.cardanoscan.io/transaction/${cancelTxHash}`);
    } catch (error) {
      console.error("\n❌ Cancel job failed:", error);
    }

    console.log("\n═══════════════════════════════════════════════════");
    console.log("   ✅ All scenarios completed!");
    console.log("═══════════════════════════════════════════════════\n");
  } catch (error) {
    console.error("\n❌ Unexpected error:", error);
    process.exit(1);
  }
}

main().catch(console.error);