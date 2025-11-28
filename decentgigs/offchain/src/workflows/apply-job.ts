import { Lucid, Blockfrost, getAddressDetails } from "@lucid-evolution/lucid";
import {
  BLOCKFROST_API_URL,
  BLOCKFROST_API_KEY,
  FREELANCER_MNEMONIC,
  NETWORK,
} from "../config.js";
import { db } from "../database.js";
import {
  Application,
  ApplicationStatus,
  JobStatus,
  Notification,
  NotificationType,
} from "../types.js";
import { randomBytes } from "crypto";

/**
 * ===================================================================
 * Apply to a Job (Offchain)
 * ===================================================================
 *
 * This script allows freelancers to apply to open jobs.
 * Applications are stored offchain and visible to employers.
 *
 * Workflow:
 * 1. Freelancer browses open jobs
 * 2. Freelancer submits application with proposal
 * 3. Application saved to database
 * 4. Employer receives notification
 * 5. Employer can accept/reject application
 *
 * Usage:
 *   npm run apply-job <jobId>
 *
 * ===================================================================
 */

/**
 * Generate unique application ID
 */
function generateApplicationId(): string {
  return `app_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

/**
 * Generate notification ID
 */
function generateNotificationId(): string {
  return `notif_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

/**
 * Apply to a job
 */
async function applyToJob(applicationData: {
  jobId: string;
  proposal: string;
  proposedTimeline: number; // in days
  portfolioLinks?: string[];
}): Promise<Application> {
  console.log("\n═══════════════════════════════════════════════════");
  console.log("   📝 Applying to Job");
  console.log("═══════════════════════════════════════════════════\n");

  try {
    // Check if job exists and is open
    const job = await db.getJob(applicationData.jobId);

    if (!job) {
      throw new Error(`Job ${applicationData.jobId} not found`);
    }

    if (job.status !== "open") {
      throw new Error(`Job ${applicationData.jobId} is not open for applications`);
    }

    // Initialize Lucid to get freelancer address
    const lucid = await Lucid(
      new Blockfrost(BLOCKFROST_API_URL, BLOCKFROST_API_KEY),
      NETWORK
    );

    lucid.selectWallet.fromSeed(FREELANCER_MNEMONIC);
    const freelancerAddress = await lucid.wallet().address();
    const freelancerDetails = getAddressDetails(freelancerAddress);
    const freelancerPkh = freelancerDetails.paymentCredential!.hash;

    console.log(`💼 Freelancer: ${freelancerAddress.slice(0, 40)}...`);
    console.log(`   PKH: ${freelancerPkh}\n`);

    // Check if already applied
    const existingApplications = await db.listApplications(applicationData.jobId);
    const alreadyApplied = existingApplications.some(
      (app) => app.freelancerAddress === freelancerAddress
    );

    if (alreadyApplied) {
      throw new Error("You have already applied to this job");
    }

    // Create application
    const application: Application = {
      id: generateApplicationId(),
      jobId: applicationData.jobId,
      freelancerAddress,
      freelancerPkh,
      proposal: applicationData.proposal,
      proposedTimeline: applicationData.proposedTimeline,
      portfolioLinks: applicationData.portfolioLinks || [],
      status: ApplicationStatus.PENDING,
      appliedAt: Date.now(),
    };

    // Save application
    await db.saveApplication(application);

    // Create notification for employer
    const notification: Notification = {
      id: generateNotificationId(),
      userAddress: job.employerAddress,
      type: NotificationType.NEW_APPLICATION,
      title: "New Application Received",
      message: `You have a new application for "${job.title}"`,
      jobId: job.id,
      read: false,
      createdAt: Date.now(),
    };

    await db.saveNotification(notification);

    console.log(`✅ Application submitted successfully!`);
    console.log(`\n📋 Application Details:`);
    console.log(`   ID:       ${application.id}`);
    console.log(`   Job:      ${job.title}`);
    console.log(`   Budget:   ${job.budget} USDM`);
    console.log(`   Timeline: ${application.proposedTimeline} days`);
    console.log(`   Status:   ${application.status}`);

    console.log(`\n✨ The employer will review your application!\n`);

    return application;

  } catch (error) {
    console.error("\n❌ Error applying to job:", error);
    throw error;
  }
}

/**
 * List all applications for a freelancer
 */
async function listMyApplications(): Promise<Application[]> {
  try {
    // Initialize Lucid
    const lucid = await Lucid(
      new Blockfrost(BLOCKFROST_API_URL, BLOCKFROST_API_KEY),
      NETWORK
    );

    lucid.selectWallet.fromSeed(FREELANCER_MNEMONIC);
    const freelancerAddress = await lucid.wallet().address();

    // Get all jobs
    const allJobs = await db.listJobs();

    // Get applications for each job
    const allApplications: Application[] = [];

    for (const job of allJobs) {
      const applications = await db.listApplications(job.id);
      const myApps = applications.filter(
        (app) => app.freelancerAddress === freelancerAddress
      );
      allApplications.push(...myApps);
    }

    console.log(`\n📋 Your Applications (${allApplications.length}):\n`);

    for (const app of allApplications) {
      const job = await db.getJob(app.jobId);
      console.log(`╔═══════════════════════════════════════════════════╗`);
      console.log(`║ Application ${app.id.slice(-8)}                        `);
      console.log(`╚═══════════════════════════════════════════════════╝`);
      console.log(`   Job:      ${job?.title || 'Unknown'}`);
      console.log(`   Status:   ${app.status}`);
      console.log(`   Applied:  ${new Date(app.appliedAt).toLocaleDateString()}`);
      console.log();
    }

    return allApplications;

  } catch (error) {
    console.error("\n❌ Error listing applications:", error);
    throw error;
  }
}

/**
 * Example: Apply to first open job
 */
async function applySampleJob() {
  // Get first open job
  const openJobs = await db.listJobs({ status: JobStatus.OPEN });

  if (openJobs.length === 0) {
    console.log("No open jobs available. Post a job first!");
    return;
  }

  const job = openJobs[0];

  const application = await applyToJob({
    jobId: job.id,
    proposal: `
Dear Hiring Manager,

I am excited to apply for the "${job.title}" position. With over 5 years of
experience in blockchain development and specifically 3 years working with
Cardano, I am confident I can deliver exceptional results for this project.

Key Qualifications:
• Extensive experience with Plutus smart contract development
• Proficient in React, TypeScript, and modern web technologies
• Deep understanding of Cardano's eUTxO model and Lucid library
• Portfolio of successful DeFi projects on Cardano

I have carefully reviewed your requirements and milestones. I can deliver
high-quality work within your proposed timeline. My approach would be:

1. Start with comprehensive planning and mockups
2. Develop MVP with core features
3. Iterate based on feedback
4. Deliver fully tested, documented solution

I look forward to discussing this opportunity further.

Best regards,
Blockchain Developer
    `.trim(),
    proposedTimeline: 90, // 90 days
    portfolioLinks: [
      "https://github.com/developer/cardano-projects",
      "https://portfolio.example.com",
    ],
  });

  return application;
}

// Parse command line arguments
const args = process.argv.slice(2);
const jobId = args[0];

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (jobId) {
    // Apply to specific job
    applyToJob({
      jobId,
      proposal: "I am interested in this job and would like to discuss further.",
      proposedTimeline: 60,
    }).catch(console.error);
  } else {
    // Apply to sample job or list applications
    applySampleJob().catch(console.error);
  }
}

export { applyToJob, listMyApplications };
