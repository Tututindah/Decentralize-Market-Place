import {
  Lucid,
  Blockfrost,
  LucidEvolution,
  validatorToAddress,
  Data,
} from "@lucid-evolution/lucid";
import {
  BLOCKFROST_API_URL,
  BLOCKFROST_API_KEY,
  NETWORK,
  USDM_UNIT,
} from "../config.js";
import { readValidator, JobDatum } from "../utils.js";

/**
 * Job Information Interface
 * Represents a job with all its details
 */
interface JobInfo {
  txHash: string;
  outputIndex: number;
  jobId: string;
  employerPkh: string;
  freelancerPkh: string;
  lockedUSDM: number;
  lockedADA: number;
}

/**
 * List All Active Jobs
 *
 * This script retrieves and displays all active jobs (UTxOs) locked in the
 * DecentGigs escrow smart contract. It parses the datum of each UTxO to
 * extract job information.
 *
 * Usage:
 *   npm run list-jobs
 *
 * Requirements:
 *   - Valid Blockfrost API key in config.ts
 *   - Active escrows on the Cardano blockchain
 */
async function listAllJobs(): Promise<JobInfo[]> {
  console.log("\n═══════════════════════════════════════════════════");
  console.log("   📋 Listing All Active DecentGigs Jobs");
  console.log("═══════════════════════════════════════════════════\n");

  try {
    // Initialize Lucid with Blockfrost provider
    const lucid = await Lucid(
      new Blockfrost(BLOCKFROST_API_URL, BLOCKFROST_API_KEY),
      NETWORK
    );

    // Get validator and script address
    const validator = readValidator();
    const scriptAddress = validatorToAddress(NETWORK, validator);

    console.log(`📍 Contract Address: ${scriptAddress}\n`);

    // Query all UTxOs at the script address
    const utxos = await lucid.utxosAt(scriptAddress);

    if (utxos.length === 0) {
      console.log("❌ No active jobs found");
      console.log("   Create a new job to get started.\n");
      return [];
    }

    console.log(`✅ Found ${utxos.length} active job(s):\n`);

    const jobs: JobInfo[] = [];

    // Parse and display each job
    for (let i = 0; i < utxos.length; i++) {
      const utxo = utxos[i];

      try {
        if (!utxo.datum) {
          console.log(`⚠️  Job #${i + 1}: Missing datum (invalid UTxO)\n`);
          continue;
        }

        // Parse the datum
        const datum = Data.from(utxo.datum, JobDatum);

        // Decode job ID from hex to UTF-8
        let jobIdText: string;
        try {
          jobIdText = Buffer.from(datum.job_id, 'hex').toString('utf8');
        } catch {
          jobIdText = datum.job_id;
        }

        // Extract asset amounts
        const lockedUSDM = Number(utxo.assets[USDM_UNIT] || 0n) / 1_000_000;
        const lockedADA = Number(utxo.assets.lovelace || 0n) / 1_000_000;

        const jobInfo: JobInfo = {
          txHash: utxo.txHash,
          outputIndex: utxo.outputIndex,
          jobId: jobIdText,
          employerPkh: datum.employer,
          freelancerPkh: datum.freelancer,
          lockedUSDM,
          lockedADA,
        };

        jobs.push(jobInfo);

        // Display job information
        console.log(`╔═══════════════════════════════════════════════════╗`);
        console.log(`║ Job #${i + 1}                                              ║`);
        console.log(`╚═══════════════════════════════════════════════════╝`);
        console.log(`   🆔 Job ID:        ${jobIdText}`);
        console.log(`   📍 UTxO:          ${utxo.txHash}#${utxo.outputIndex}`);
        console.log(`   👔 Employer:      ${datum.employer.slice(0, 16)}...`);
        console.log(`   💼 Freelancer:    ${datum.freelancer.slice(0, 16)}...`);
        console.log(`   💰 Locked USDM:   ${lockedUSDM} USDM`);
        console.log(`   🪙 Locked ADA:    ${lockedADA} ADA`);
        console.log(`   🔗 Explorer:      https://preprod.cardanoscan.io/transaction/${utxo.txHash}`);
        console.log();

      } catch (error) {
        console.log(`⚠️  Job #${i + 1}: Error parsing datum - ${error}\n`);
      }
    }

    // Display summary
    console.log(`═══════════════════════════════════════════════════`);
    const totalUSDM = jobs.reduce((sum, job) => sum + job.lockedUSDM, 0);
    const totalADA = jobs.reduce((sum, job) => sum + job.lockedADA, 0);

    console.log(`   📊 Summary:`);
    console.log(`      Total Jobs:  ${jobs.length}`);
    console.log(`      Total USDM:  ${totalUSDM} USDM`);
    console.log(`      Total ADA:   ${totalADA} ADA`);
    console.log(`═══════════════════════════════════════════════════\n`);

    return jobs;

  } catch (error) {
    console.error("\n❌ Error listing jobs:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  listAllJobs().catch(console.error);
}

export { listAllJobs, JobInfo };
