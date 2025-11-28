import {
  Lucid,
  Blockfrost,
  getAddressDetails,
  validatorToAddress,
  Data,
  fromText,
} from "@lucid-evolution/lucid";
import {
  BLOCKFROST_API_URL,
  BLOCKFROST_API_KEY,
  EMPLOYER_MNEMONIC,
  NETWORK,
  USDM_UNIT,
} from "../config.js";
import { db } from "../database.js";
import {
  ApplicationStatus,
  JobStatus,
  EscrowStatus,
  EscrowInfo,
  Notification,
  NotificationType,
} from "../types.js";
import { randomBytes } from "crypto";
import * as fs from "fs";

/**
 * ===================================================================
 * Accept Application & Create Escrow (Onchain)
 * ===================================================================
 *
 * This script handles the employer accepting a freelancer's application
 * and automatically creating the escrow smart contract onchain.
 *
 * Workflow:
 * 1. Employer reviews applications
 * 2. Employer accepts chosen application
 * 3. Application status updated to ACCEPTED
 * 4. Escrow contract created onchain with milestones
 * 5. Funds locked in escrow
 * 6. Job status updated to IN_PROGRESS
 * 7. Freelancer notified
 *
 * Usage:
 *   npm run accept-application <applicationId>
 *
 * ===================================================================
 */

/**
 * Milestone Datum Schema for Aiken
 */
const MilestoneSchema = Data.Object({
  amount: Data.Integer(),
  deadline: Data.Integer(),
  released: Data.Boolean(),
});

/**
 * Job Datum Schema for Aiken (with milestones)
 */
const JobDatumSchema = Data.Object({
  employer: Data.Bytes(),
  freelancer: Data.Bytes(),
  job_id: Data.Bytes(),
  total_amount: Data.Integer(),
  milestones: Data.Array(MilestoneSchema),
  current_milestone: Data.Integer(),
  created_at: Data.Integer(),
});

type MilestoneDatum = Data.Static<typeof MilestoneSchema>;
type JobDatum = Data.Static<typeof JobDatumSchema>;

const Milestone = MilestoneSchema as unknown as MilestoneDatum;
const JobDatum = JobDatumSchema as unknown as JobDatum;

/**
 * Read milestone validator
 */
function readMilestoneValidator() {
  const plutusJson = JSON.parse(fs.readFileSync("plutus.json", "utf8"));

  const validator = plutusJson.validators.find(
    (v: any) => v.title === "decentgigs_milestone.decentgigs_milestone.spend"
  );

  if (!validator) {
    throw new Error(
      "Milestone validator not found. Make sure decentgigs_milestone.ak is compiled."
    );
  }

  return {
    type: "PlutusV3" as const,
    script: validator.compiledCode,
  };
}

/**
 * Create job datum with milestones
 */
function createMilestoneDatum(
  employerPkh: string,
  freelancerPkh: string,
  jobId: string,
  totalAmount: bigint,
  milestones: {
    amount: number;
    deadline: number;
  }[]
): string {
  const milestoneDatums: MilestoneDatum[] = milestones.map((m) => ({
    amount: BigInt(Math.floor(m.amount * 1_000_000)), // Convert to atomic units
    deadline: BigInt(m.deadline),
    released: false,
  }));

  const datum: JobDatum = {
    employer: employerPkh,
    freelancer: freelancerPkh,
    job_id: fromText(jobId),
    total_amount: totalAmount,
    milestones: milestoneDatums,
    current_milestone: 0n,
    created_at: BigInt(Date.now()),
  };

  return Data.to(datum, JobDatum);
}

/**
 * Accept application and create escrow
 */
async function acceptApplication(applicationId: string): Promise<void> {
  console.log("\n═══════════════════════════════════════════════════");
  console.log("   ✅ Accepting Application & Creating Escrow");
  console.log("═══════════════════════════════════════════════════\n");

  try {
    // Get application
    const application = await db.getApplication(applicationId);

    if (!application) {
      throw new Error(`Application ${applicationId} not found`);
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new Error(
        `Application is ${application.status}, cannot accept`
      );
    }

    // Get job
    const job = await db.getJob(application.jobId);

    if (!job) {
      throw new Error(`Job ${application.jobId} not found`);
    }

    console.log(`📋 Job: ${job.title}`);
    console.log(`💼 Freelancer: ${application.freelancerAddress.slice(0, 40)}...`);
    console.log(`💰 Budget: ${job.budget} USDM`);
    console.log(`📊 Milestones: ${job.milestones.length}\n`);

    // Initialize Lucid
    const lucid = await Lucid(
      new Blockfrost(BLOCKFROST_API_URL, BLOCKFROST_API_KEY),
      NETWORK
    );

    lucid.selectWallet.fromSeed(EMPLOYER_MNEMONIC);
    const employerAddress = await lucid.wallet().address();

    // Verify employer
    if (employerAddress !== job.employerAddress) {
      throw new Error("Only the job poster can accept applications");
    }

    // Get PKHs
    const employerPkh = getAddressDetails(employerAddress).paymentCredential!.hash;
    const freelancerPkh = application.freelancerPkh;

    // Check employer has enough funds
    const utxos = await lucid.wallet().getUtxos();
    const usdmBalance = utxos.reduce(
      (sum, utxo) => sum + Number(utxo.assets[USDM_UNIT] || 0n),
      0
    ) / 1_000_000;

    console.log(`💵 Current USDM Balance: ${usdmBalance} USDM`);

    if (usdmBalance < job.budget) {
      throw new Error(
        `Insufficient USDM! Need ${job.budget} USDM, have ${usdmBalance} USDM`
      );
    }

    // Get validator and script address
    const validator = readMilestoneValidator();
    const scriptAddress = validatorToAddress(NETWORK, validator);

    console.log(`📜 Script Address: ${scriptAddress.slice(0, 40)}...`);

    // Create datum with milestones
    const totalAmount = BigInt(Math.floor(job.budget * 1_000_000));
    const datum = createMilestoneDatum(
      employerPkh,
      freelancerPkh,
      job.id,
      totalAmount,
      job.milestones.map((m) => ({
        amount: m.amount,
        deadline: m.deadline,
      }))
    );

    console.log(`\n🔒 Creating escrow with milestones...`);

    // Build transaction
    const tx = await lucid
      .newTx()
      .pay.ToAddressWithData(
        scriptAddress,
        {
          kind: "inline",
          value: datum,
        },
        {
          [USDM_UNIT]: totalAmount,
          lovelace: 5_000_000n, // 5 ADA for script execution
        }
      )
      .complete();

    console.log(`✍️  Signing transaction...`);
    const signedTx = await tx.sign.withWallet().complete();

    console.log(`📤 Submitting transaction...`);
    const txHash = await signedTx.submit();

    console.log(`\n✅ Escrow created!`);
    console.log(`   Tx Hash: ${txHash}`);

    console.log(`\n⏳ Waiting for confirmation...`);
    await lucid.awaitTx(txHash);

    console.log(`✅ Transaction confirmed!`);

    // Update application status
    await db.updateApplication(applicationId, {
      status: ApplicationStatus.ACCEPTED,
    });

    // Update job status
    await db.updateJob(job.id, {
      status: JobStatus.IN_PROGRESS,
      freelancerAddress: application.freelancerAddress,
      freelancerPkh: application.freelancerPkh,
      escrowTxHash: txHash,
      escrowOutputIndex: 0,
    });

    // Save escrow info
    const escrowInfo: EscrowInfo = {
      jobId: job.id,
      txHash,
      outputIndex: 0,
      employerPkh,
      freelancerPkh,
      totalAmount,
      milestones: job.milestones,
      currentMilestone: 0,
      createdAt: Date.now(),
      status: EscrowStatus.ACTIVE,
    };

    await db.saveEscrow(escrowInfo);

    // Notify freelancer
    const notification: Notification = {
      id: `notif_${Date.now()}_${randomBytes(4).toString('hex')}`,
      userAddress: application.freelancerAddress,
      type: NotificationType.APPLICATION_ACCEPTED,
      title: "Application Accepted!",
      message: `Your application for "${job.title}" has been accepted. Escrow created.`,
      jobId: job.id,
      read: false,
      createdAt: Date.now(),
    };

    await db.saveNotification(notification);

    console.log(`\n🔗 View on Explorer:`);
    console.log(`   https://preprod.cardanoscan.io/transaction/${txHash}`);

    console.log(`\n📊 Escrow Summary:`);
    console.log(`   Job ID: ${job.id}`);
    console.log(`   Total Locked: ${job.budget} USDM`);
    console.log(`   Milestones: ${job.milestones.length}`);

    job.milestones.forEach((m) => {
      const deadlineDate = new Date(m.deadline).toLocaleDateString();
      console.log(`\n   Milestone ${m.number}:`);
      console.log(`     ${m.description}`);
      console.log(`     Amount: ${m.amount} USDM`);
      console.log(`     Deadline: ${deadlineDate}`);
    });

    console.log(`\n✨ Work can now begin! Freelancer will deliver milestones.\n`);

  } catch (error) {
    console.error("\n❌ Error accepting application:", error);
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const applicationId = args[0];

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!applicationId) {
    console.error("Usage: npm run accept-application <applicationId>");
    process.exit(1);
  }

  acceptApplication(applicationId).catch(console.error);
}

export { acceptApplication };
