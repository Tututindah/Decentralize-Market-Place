import { Lucid, Blockfrost, getAddressDetails } from "@lucid-evolution/lucid";
import {
  BLOCKFROST_API_URL,
  BLOCKFROST_API_KEY,
  EMPLOYER_MNEMONIC,
  NETWORK,
} from "../config.js";
import { db } from "../database.js";
import {
  JobPosting,
  JobCategory,
  JobStatus,
  Milestone,
} from "../types.js";
import { randomBytes } from "crypto";

/**
 * ===================================================================
 * Post a New Job (Offchain)
 * ===================================================================
 *
 * This script creates a new job posting in the offchain database.
 * The job will be visible to freelancers who can then apply.
 *
 * Workflow:
 * 1. Employer provides job details
 * 2. Job is saved to offchain database
 * 3. Job appears in job listings
 * 4. Freelancers can apply
 *
 * Usage:
 *   npm run post-job
 *
 * ===================================================================
 */

/**
 * Generate unique job ID
 */
function generateJobId(): string {
  return `job_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

/**
 * Calculate milestone deadlines
 * Distributes milestones evenly over the specified duration
 */
function calculateMilestoneDeadlines(
  startDate: number,
  durationMonths: number,
  milestoneCount: number
): number[] {
  const deadlines: number[] = [];
  const msPerMonth = 30 * 24 * 60 * 60 * 1000; // Approximate month in ms
  const intervalMs = (durationMonths * msPerMonth) / milestoneCount;

  for (let i = 1; i <= milestoneCount; i++) {
    deadlines.push(startDate + (intervalMs * i));
  }

  return deadlines;
}

/**
 * Post a new job
 */
async function postJob(jobData: {
  title: string;
  description: string;
  category: JobCategory;
  skills: string[];
  budget: number;
  durationMonths: number;
  milestones: {
    description: string;
    percentage: number; // Percentage of total budget
  }[];
}): Promise<JobPosting> {
  console.log("\n═══════════════════════════════════════════════════");
  console.log("   📋 Posting New Job");
  console.log("═══════════════════════════════════════════════════\n");

  try {
    // Initialize Lucid to get employer address
    const lucid = await Lucid(
      new Blockfrost(BLOCKFROST_API_URL, BLOCKFROST_API_KEY),
      NETWORK
    );

    lucid.selectWallet.fromSeed(EMPLOYER_MNEMONIC);
    const employerAddress = await lucid.wallet().address();
    const employerDetails = getAddressDetails(employerAddress);
    const employerPkh = employerDetails.paymentCredential!.hash;

    console.log(`👔 Employer: ${employerAddress.slice(0, 40)}...`);
    console.log(`   PKH: ${employerPkh}\n`);

    // Validate milestone percentages sum to 100
    const totalPercentage = jobData.milestones.reduce(
      (sum, m) => sum + m.percentage,
      0
    );

    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error(
        `Milestone percentages must sum to 100%. Current: ${totalPercentage}%`
      );
    }

    // Generate job ID
    const jobId = generateJobId();

    // Calculate milestone details
    const startDate = Date.now();
    const deadlines = calculateMilestoneDeadlines(
      startDate,
      jobData.durationMonths,
      jobData.milestones.length
    );

    const milestones: Milestone[] = jobData.milestones.map((m, index) => ({
      number: index + 1,
      description: m.description,
      amount: (jobData.budget * m.percentage) / 100,
      deadline: deadlines[index],
      released: false,
    }));

    // Create job posting
    const job: JobPosting = {
      id: jobId,
      title: jobData.title,
      description: jobData.description,
      category: jobData.category,
      skills: jobData.skills,
      budget: jobData.budget,
      milestones,
      employerAddress,
      employerPkh,
      status: JobStatus.OPEN,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Save to database
    await db.saveJob(job);

    console.log(`✅ Job posted successfully!`);
    console.log(`\n📋 Job Details:`);
    console.log(`   ID:       ${job.id}`);
    console.log(`   Title:    ${job.title}`);
    console.log(`   Category: ${job.category}`);
    console.log(`   Budget:   ${job.budget} USDM`);
    console.log(`   Duration: ${jobData.durationMonths} months`);
    console.log(`\n📊 Milestones:`);

    milestones.forEach((m) => {
      const deadlineDate = new Date(m.deadline).toLocaleDateString();
      console.log(`   ${m.number}. ${m.description}`);
      console.log(`      Amount: ${m.amount} USDM`);
      console.log(`      Deadline: ${deadlineDate}`);
    });

    console.log(`\n✨ Job is now visible to freelancers!\n`);

    return job;

  } catch (error) {
    console.error("\n❌ Error posting job:", error);
    throw error;
  }
}

/**
 * Example: Post a sample job
 */
async function postSampleJob() {
  const job = await postJob({
    title: "Build a DeFi Dashboard on Cardano",
    description: `
We are looking for an experienced blockchain developer to build a comprehensive
DeFi dashboard for Cardano. The dashboard should display:

- Wallet balances (ADA and native tokens)
- Staking information
- Transaction history
- DEX price charts
- Portfolio analytics

Requirements:
- Experience with Cardano and Plutus
- Proficiency in React/Next.js
- Strong UI/UX design skills
- Familiarity with Lucid or similar Cardano libraries

Deliverables:
1. Responsive web application
2. Smart contract integration
3. Documentation
4. Testing suite
    `.trim(),
    category: JobCategory.BLOCKCHAIN,
    skills: [
      "Cardano",
      "Plutus",
      "React",
      "TypeScript",
      "Lucid",
      "Web3",
    ],
    budget: 5000, // 5000 USDM
    durationMonths: 3,
    milestones: [
      {
        description: "UI/UX Design and Mockups",
        percentage: 20,
      },
      {
        description: "Frontend Development (Wallet Integration)",
        percentage: 30,
      },
      {
        description: "Backend & Smart Contract Integration",
        percentage: 30,
      },
      {
        description: "Testing, Documentation & Deployment",
        percentage: 20,
      },
    ],
  });

  return job;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  postSampleJob().catch(console.error);
}

export { postJob, postSampleJob };
