import { BlockfrostProvider, deserializeAddress, resolveNativeScriptHash } from "@meshsdk/core";
import { getScript } from "./common-mesh.js";
import * as fs from "fs";
import cbor from "cbor";

const BLOCKFROST_API_KEY = "";
const USDM_POLICY_ID = "f96672ded25c90551d210e883099110f613e0e65012d5b88b68c51d0";
const USDM_ASSET_NAME = "4d4f434b5f5553444d";

function decodeCBORDatum(cborHex) {
    try {
        const buffer = Buffer.from(cborHex, 'hex');
        const decoded = cbor.decode(buffer);
        if (decoded && decoded.value && Array.isArray(decoded.value)) {
            return decoded.value;
        }
        return null;
    } catch (error) {
        return null;
    }
}

function decodeReputationDatum(cborHex) {
    try {
        const fields = decodeCBORDatum(cborHex);
        if (!fields) return null;
        
        return {
            user: fields[0] ? Buffer.from(fields[0]).toString('hex') : 'N/A',
            did: fields[1] ? Buffer.from(fields[1]).toString('hex') : 'N/A',
            didUtf8: fields[1] ? Buffer.from(fields[1]).toString('utf8') : 'N/A',
            total_jobs: Number(fields[2]) || 0,
            completed_jobs: Number(fields[3]) || 0,
            cancelled_jobs: Number(fields[4]) || 0,
            dispute_count: Number(fields[5]) || 0,
            total_earned: Number(fields[6]) || 0,
            total_paid: Number(fields[7]) || 0,
            average_rating: Number(fields[8]) || 0,
            last_updated: fields[9] ? new Date(Number(fields[9])).toISOString() : 'N/A'
        };
    } catch (error) {
        return null;
    }
}

function decodeJobCompletionDatum(cborHex) {
    try {
        const fields = decodeCBORDatum(cborHex);
        if (!fields) return null;
        
        return {
            job_id: fields[0] ? Buffer.from(fields[0]).toString('hex') : 'N/A',
            job_id_utf8: fields[0] ? Buffer.from(fields[0]).toString('utf8') : 'N/A',
            client: fields[1] ? Buffer.from(fields[1]).toString('hex') : 'N/A',
            freelancer: fields[2] ? Buffer.from(fields[2]).toString('hex') : 'N/A',
            amount: Number(fields[3]) || 0,
            completed_at: fields[4] ? new Date(Number(fields[4])).toISOString() : 'N/A'
        };
    } catch (error) {
        return null;
    }
}

function decodeEscrowDatum(cborHex) {
    try {
        const fields = decodeCBORDatum(cborHex);
        if (!fields) return null;
        
        return {
            client: fields[0] ? Buffer.from(fields[0]).toString('hex') : 'N/A',
            client_did: fields[1] ? Buffer.from(fields[1]).toString('hex') : 'N/A',
            freelancer: fields[2] ? Buffer.from(fields[2]).toString('hex') : 'N/A',
            freelancer_did: fields[3] ? Buffer.from(fields[3]).toString('hex') : 'N/A',
            arbiter: fields[4] ? Buffer.from(fields[4]).toString('hex') : 'N/A',
            usdm_policy: fields[5] ? Buffer.from(fields[5]).toString('hex') : 'N/A',
            usdm_name: fields[6] ? Buffer.from(fields[6]).toString('hex') : 'N/A',
            amount: Number(fields[7]) || 0,
            job_id: fields[8] ? Buffer.from(fields[8]).toString('hex') : 'N/A',
            job_id_utf8: fields[8] ? Buffer.from(fields[8]).toString('utf8') : 'N/A'
        };
    } catch (error) {
        return null;
    }
}

function decodeJobDatum(cborHex) {
    try {
        const fields = decodeCBORDatum(cborHex);
        if (!fields) return null;
        
        return {
            client: fields[0] ? Buffer.from(fields[0]).toString('hex') : 'N/A',
            client_did: fields[1] ? Buffer.from(fields[1]).toString('hex') : 'N/A',
            job_id: fields[2] ? Buffer.from(fields[2]).toString('hex') : 'N/A',
            job_id_utf8: fields[2] ? Buffer.from(fields[2]).toString('utf8') : 'N/A',
            title: fields[3] ? Buffer.from(fields[3]).toString('utf8') : 'N/A',
            description_hash: fields[4] ? Buffer.from(fields[4]).toString('hex') : 'N/A',
            budget_min: Number(fields[5]) || 0,
            budget_max: Number(fields[6]) || 0,
            deadline: fields[7] ? new Date(Number(fields[7])).toISOString() : 'N/A',
            is_active: fields[8],
            kyc_required: fields[9]
        };
    } catch (error) {
        return null;
    }
}

function decodeBidDatum(cborHex) {
    try {
        const fields = decodeCBORDatum(cborHex);
        if (!fields) return null;
        
        return {
            job_id: fields[0] ? Buffer.from(fields[0]).toString('hex') : 'N/A',
            job_id_utf8: fields[0] ? Buffer.from(fields[0]).toString('utf8') : 'N/A',
            client: fields[1] ? Buffer.from(fields[1]).toString('hex') : 'N/A',
            freelancer: fields[2] ? Buffer.from(fields[2]).toString('hex') : 'N/A',
            freelancer_did: fields[3] ? Buffer.from(fields[3]).toString('hex') : 'N/A',
            bid_amount: Number(fields[4]) || 0,
            proposal_hash: fields[5] ? Buffer.from(fields[5]).toString('hex') : 'N/A',
            timestamp: fields[6] ? new Date(Number(fields[6])).toISOString() : 'N/A',
            is_active: fields[7]
        };
    } catch (error) {
        return null;
    }
}


async function fetchScriptUtxos(scriptAddress) {
    try {
        const response = await fetch(
            `https://cardano-preprod.blockfrost.io/api/v0/addresses/${scriptAddress}/utxos`,
            { headers: { 'project_id': BLOCKFROST_API_KEY } }
        );
        if (!response.ok) return [];
        const data = await response.json();
        return data.map((utxo) => ({
            input: { txHash: utxo.tx_hash, outputIndex: utxo.output_index },
            output: {
                address: scriptAddress,
                amount: utxo.amount.map(a => ({ unit: a.unit, quantity: a.quantity })),
                inlineDatum: utxo.inline_datum,
                dataHash: utxo.data_hash
            }
        }));
    } catch (error) {
        return [];
    }
}


async function getContractAddresses() {
    const blueprint = JSON.parse(fs.readFileSync("./plutus.json", "utf-8"));
    
    const escrowValidator = blueprint.validators.find(v => v.title === "freelance_escrow.freelance_escrow.spend");
    const { scriptAddr: escrowAddr } = getScript(escrowValidator.compiledCode);
    
    const jobValidator = blueprint.validators.find(v => v.title === "job_listing.job_listing.spend");
    const { scriptAddr: jobAddr } = getScript(jobValidator.compiledCode);
    
    const bidValidator = blueprint.validators.find(v => v.title === "bid.bid.spend");
    const { scriptAddr: bidAddr } = getScript(bidValidator.compiledCode);
    
    const repValidator = blueprint.validators.find(v => v.title.includes("reputation_score") && v.title.endsWith(".spend"));
    const { scriptAddr: repAddr } = getScript(repValidator.compiledCode);
    
    const completionStoreValidator = blueprint.validators.find(v => v.title === "job_completion.job_completion_store.spend");
    const { scriptAddr: completionAddr } = getScript(completionStoreValidator.compiledCode);
    
    const completionMintValidator = blueprint.validators.find(v => v.title === "job_completion.job_completion.mint");
    const completionPolicyId = completionMintValidator.hash;
    
    return {
        escrow: escrowAddr,
        job: jobAddr,
        bid: bidAddr,
        reputation: repAddr,
        completion: completionAddr,
        completionPolicyId
    };
}

async function queryEscrowTVL() {
    console.log(`\n Querying Escrow TVL...`);
    
    const addresses = await getContractAddresses();
    const utxos = await fetchScriptUtxos(addresses.escrow);
    
    let totalAda = 0;
    let totalUsdm = 0;
    let activeEscrows = [];
    
    for (const utxo of utxos) {
        for (const asset of utxo.output.amount) {
            if (asset.unit === "lovelace") {
                totalAda += parseInt(asset.quantity);
            } else if (asset.unit === USDM_POLICY_ID + USDM_ASSET_NAME) {
                totalUsdm += parseInt(asset.quantity);
            }
        }
        
        if (utxo.output.inlineDatum) {
            const datum = decodeEscrowDatum(utxo.output.inlineDatum);
            if (datum) {
                activeEscrows.push({
                    jobId: datum.job_id_utf8,
                    amount: datum.amount,
                    client: datum.client.substring(0, 16) + '...',
                    freelancer: datum.freelancer.substring(0, 16) + '...'
                });
            }
        }
    }
    
    return {
        totalAda,
        totalAdaFormatted: (totalAda / 1_000_000).toFixed(6),
        totalUsdm,
        escrowCount: utxos.length,
        activeEscrows
    };
}

async function queryActiveJobs() {
    console.log(`\n Querying Active Jobs...`);
    
    const addresses = await getContractAddresses();
    const utxos = await fetchScriptUtxos(addresses.job);
    
    let totalAda = 0;
    let activeJobs = [];
    
    for (const utxo of utxos) {
        for (const asset of utxo.output.amount) {
            if (asset.unit === "lovelace") {
                totalAda += parseInt(asset.quantity);
            }
        }
        
        if (utxo.output.inlineDatum) {
            const datum = decodeJobDatum(utxo.output.inlineDatum);
            if (datum) {
                activeJobs.push({
                    jobId: datum.job_id_utf8,
                    title: datum.title,
                    budgetMin: datum.budget_min,
                    budgetMax: datum.budget_max,
                    client: datum.client.substring(0, 16) + '...'
                });
            }
        }
    }
    
    return {
        totalAda,
        totalAdaFormatted: (totalAda / 1_000_000).toFixed(6),
        jobCount: utxos.length,
        activeJobs
    };
}

async function queryActiveBids() {
    console.log(`\n Querying Active Bids...`);
    
    const addresses = await getContractAddresses();
    const utxos = await fetchScriptUtxos(addresses.bid);
    
    let totalAda = 0;
    let activeBids = [];
    
    for (const utxo of utxos) {
        for (const asset of utxo.output.amount) {
            if (asset.unit === "lovelace") {
                totalAda += parseInt(asset.quantity);
            }
        }
        
        if (utxo.output.inlineDatum) {
            const datum = decodeBidDatum(utxo.output.inlineDatum);
            if (datum) {
                activeBids.push({
                    jobId: datum.job_id_utf8,
                    bidAmount: datum.bid_amount,
                    freelancer: datum.freelancer.substring(0, 16) + '...'
                });
            }
        }
    }
    
    return {
        totalAda,
        totalAdaFormatted: (totalAda / 1_000_000).toFixed(6),
        bidCount: utxos.length,
        activeBids
    };
}

async function queryCompletedJobs() {
    console.log(`\n Querying Completed Jobs...`);
    
    const addresses = await getContractAddresses();
    const utxos = await fetchScriptUtxos(addresses.completion);
    
    let totalDistributed = 0;
    let completedJobs = [];
    
    for (const utxo of utxos) {
        const hasCompletionToken = utxo.output.amount.some(a => 
            a.unit.startsWith(addresses.completionPolicyId) && a.unit !== "lovelace"
        );
        
        if (hasCompletionToken && utxo.output.inlineDatum) {
            const datum = decodeJobCompletionDatum(utxo.output.inlineDatum);
            if (datum) {
                totalDistributed += datum.amount;
                completedJobs.push({
                    jobId: datum.job_id_utf8,
                    amount: datum.amount,
                    client: datum.client.substring(0, 16) + '...',
                    freelancer: datum.freelancer.substring(0, 16) + '...',
                    completedAt: datum.completed_at
                });
            }
        }
    }
    
    return {
        totalDistributed,
        completedCount: completedJobs.length,
        completedJobs
    };
}

async function queryAllReputations() {
    console.log(`\n Querying All Reputations...`);
    
    const addresses = await getContractAddresses();
    const utxos = await fetchScriptUtxos(addresses.reputation);
    
    let totalAda = 0;
    let reputations = [];
    let totalJobsCompleted = 0;
    let totalEarned = 0;
    let totalPaid = 0;
    
    for (const utxo of utxos) {
        for (const asset of utxo.output.amount) {
            if (asset.unit === "lovelace") {
                totalAda += parseInt(asset.quantity);
            }
        }
        
        if (utxo.output.inlineDatum) {
            const datum = decodeReputationDatum(utxo.output.inlineDatum);
            if (datum) {
                totalJobsCompleted += datum.completed_jobs;
                totalEarned += datum.total_earned;
                totalPaid += datum.total_paid;
                
                reputations.push({
                    user: datum.user.substring(0, 16) + '...',
                    totalJobs: datum.total_jobs,
                    completedJobs: datum.completed_jobs,
                    rating: datum.average_rating,
                    earned: datum.total_earned,
                    paid: datum.total_paid
                });
            }
        }
    }
    
    return {
        totalAda,
        totalAdaFormatted: (totalAda / 1_000_000).toFixed(6),
        userCount: reputations.length,
        totalJobsCompleted,
        totalEarned,
        totalPaid,
        reputations
    };
}


async function queryPlatformStatistics() {
    console.log("\n" + "═".repeat(80));
    console.log(" DECENTGIGS PLATFORM STATISTICS");
    console.log("═".repeat(80));
    
    const addresses = await getContractAddresses();
    
    const escrowStats = await queryEscrowTVL();
    const jobStats = await queryActiveJobs();
    const bidStats = await queryActiveBids();
    const completionStats = await queryCompletedJobs();
    const repStats = await queryAllReputations();
    
    const totalTVL_Ada = escrowStats.totalAda + jobStats.totalAda + bidStats.totalAda + repStats.totalAda;
    const totalTVL_Usdm = escrowStats.totalUsdm;
    
    console.log("TOTAL VALUE LOCKED (TVL)");
    console.log(`Total ADA Locked:      ${(totalTVL_Ada / 1_000_000).toFixed(6).padStart(20)} ADA`);
    console.log(`Total USDM Locked:     ${String(totalTVL_Usdm).padStart(20)} USDM`);
    
    console.log("ESCROW STATISTICS");

    console.log(`Active Escrows:        ${String(escrowStats.escrowCount).padStart(20)}`);
    console.log(`USDM in Escrow:        ${String(escrowStats.totalUsdm).padStart(20)} USDM`);
    console.log(`ADA in Escrow:         ${escrowStats.totalAdaFormatted.padStart(20)} ADA`);
    
    if (escrowStats.activeEscrows.length > 0) {
        console.log("\n   Active Escrows:");
        for (const escrow of escrowStats.activeEscrows.slice(0, 5)) {
            console.log(`   • ${escrow.jobId}: ${escrow.amount} USDM`);
        }
        if (escrowStats.activeEscrows.length > 5) {
            console.log(`   ... and ${escrowStats.activeEscrows.length - 5} more`);
        }
    }
    
    console.log("JOB STATISTICS");
    console.log(` Active Job Listings:   ${String(jobStats.jobCount).padStart(20)}`);
    console.log(`ADA in Jobs:           ${jobStats.totalAdaFormatted.padStart(20)} ADA`);
    
    if (jobStats.activeJobs.length > 0) {
        console.log("\n   Active Jobs:");
        for (const job of jobStats.activeJobs.slice(0, 5)) {
            console.log(`   • ${job.jobId}: "${job.title}" (${job.budgetMin}-${job.budgetMax} USDM)`);
        }
        if (jobStats.activeJobs.length > 5) {
            console.log(`   ... and ${jobStats.activeJobs.length - 5} more`);
        }
    }
    
    console.log("BID STATISTICS");
    console.log(`Active Bids:           ${String(bidStats.bidCount).padStart(20)}`);
    console.log(`ADA in Bids:           ${bidStats.totalAdaFormatted.padStart(20)} ADA`);
    
    if (bidStats.activeBids.length > 0) {
        console.log("\n   Active Bids:");
        for (const bid of bidStats.activeBids.slice(0, 5)) {
            console.log(`   • ${bid.jobId}: ${bid.bidAmount} USDM`);
        }
        if (bidStats.activeBids.length > 5) {
            console.log(`   ... and ${bidStats.activeBids.length - 5} more`);
        }
    }
    
    console.log("COMPLETION STATISTICS ");
    console.log(`Jobs Completed:        ${String(completionStats.completedCount).padStart(20)}`);
    console.log(`Total Distributed:     ${String(completionStats.totalDistributed).padStart(20)} USDM `);
    
    if (completionStats.completedJobs.length > 0) {
        console.log("\n   Completed Jobs:");
        for (const job of completionStats.completedJobs.slice(0, 5)) {
            console.log(`   • ${job.jobId}: ${job.amount} USDM (${job.completedAt.substring(0, 10)})`);
        }
        if (completionStats.completedJobs.length > 5) {
            console.log(`   ... and ${completionStats.completedJobs.length - 5} more`);
        }
    }
    
    console.log("USER STATISTICS");
    console.log(`Registered Users:      ${String(repStats.userCount).padStart(20)} `);
    console.log(`Total Jobs Completed:  ${String(repStats.totalJobsCompleted).padStart(20)}`);
    console.log(`Total Earned (all):    ${String(repStats.totalEarned).padStart(20)} USDM`);
    console.log(`Total Paid (all):      ${String(repStats.totalPaid).padStart(20)} USDM`);
    
    if (repStats.reputations.length > 0) {
        console.log("\n   User Reputations:");
        for (const rep of repStats.reputations) {
            console.log(`   • ${rep.user}: ${rep.completedJobs}/${rep.totalJobs} jobs, Stars ${rep.rating}/100, Earned ${rep.earned} earned, Paid ${rep.paid} paid`);
        }
    }
    
    console.log("CONTRACT ADDRESSES");
    console.log(`Escrow:     ${addresses.escrow}`);
    console.log(`Jobs:       ${addresses.job}`);
    console.log(`Bids:       ${addresses.bid}`);
    console.log(`Reputation: ${addresses.reputation}`);
    console.log(`Completion: ${addresses.completion} `);
    
    return {
        tvl: { ada: totalTVL_Ada, usdm: totalTVL_Usdm },
        escrow: escrowStats,
        jobs: jobStats,
        bids: bidStats,
        completions: completionStats,
        users: repStats,
        addresses
    };
}

async function main() {
    console.log("\ DECENTGIGS PLATFORM STATISTICS QUERY");
    console.log("═".repeat(80));
    
    try {
        const stats = await queryPlatformStatistics();
        
        console.log("\n SUMMARY JSON:");
        console.log(JSON.stringify({
            tvl_usdm: stats.tvl.usdm,
            active_escrows: stats.escrow.escrowCount,
            active_jobs: stats.jobs.jobCount,
            active_bids: stats.bids.bidCount,
            completed_jobs: stats.completions.completedCount,
            total_distributed: stats.completions.totalDistributed,
            registered_users: stats.users.userCount,
            total_earned: stats.users.totalEarned,
            total_paid: stats.users.totalPaid
        }, null, 2));
        
    } catch (error) {
        console.error("Error querying statistics:", error.message);
    }
}

main();

export {
    queryPlatformStatistics,
    queryEscrowTVL,
    queryActiveJobs,
    queryActiveBids,
    queryCompletedJobs,
    queryAllReputations,
    getContractAddresses
};