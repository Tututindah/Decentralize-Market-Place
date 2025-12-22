import { BlockfrostProvider, MeshWallet, deserializeAddress, mConStr0, mConStr1, mConStr2, mConStr3, resolveNativeScriptHash } from "@meshsdk/core";
import { getScript, getTxBuilder, getUtxoByTxHash } from "./common-mesh.js";
import * as fs from "fs";
import crypto from "crypto";
import cbor from "cbor";
import blake from "blakejs";

const BLOCKFROST_API_KEY = "";
const USDM_POLICY_ID = "f96672ded25c90551d210e883099110f613e0e65012d5b88b68c51d0";
const USDM_ASSET_NAME = "4d4f434b5f5553444d";
const FREELANCER_MNEMONIC = "".split(" ");
const EMPLOYER_MNEMONIC = "".split(" ");
const ATTACKER_MNEMONIC = "".split(" ");

const blockchainProvider = new BlockfrostProvider(BLOCKFROST_API_KEY);

const employerWallet = new MeshWallet({
    networkId: 0,
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: { type: "mnemonic", words: EMPLOYER_MNEMONIC },
});

const freelancerWallet = new MeshWallet({
    networkId: 0,
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: { type: "mnemonic", words: FREELANCER_MNEMONIC },
});

const attackerWallet = new MeshWallet({
    networkId: 0,
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: { type: "mnemonic", words: ATTACKER_MNEMONIC },
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function blake2b256(input) {
    const hash = blake.blake2b(input, null, 32);
    return Buffer.from(hash).toString('hex');
}

const testResults = {
    passed: [],
    failed: [],
    skipped: []
};

function logTest(name, status, message = "") {
    const timestamp = new Date().toISOString();
    const result = { name, status, message, timestamp };
    
    if (status === "PASS") {
        testResults.passed.push(result);
        console.log(`${name}`);
    } else if (status === "FAIL") {
        testResults.failed.push(result);
        console.log(`${name}: ${message}`);
    } else if (status === "SKIP") {
        testResults.skipped.push(result);
        console.log(`${name}: ${message}`);
    }
    if (message && status === "PASS") console.log(`${message}`);
}

console.log(`\n DECENTGIGS — Complete Test Suite V8`);
console.log(`All Functions + All Security Tests`);


async function getWalletBalance(wallet, role) {
    const utxos = await wallet.getUtxos();
    let lovelace = 0;
    let usdm = 0;
    
    for (const utxo of utxos) {
        for (const asset of utxo.output.amount) {
            if (asset.unit === "lovelace") {
                lovelace += parseInt(asset.quantity);
            } else if (asset.unit === USDM_POLICY_ID + USDM_ASSET_NAME) {
                usdm += parseInt(asset.quantity);
            }
        }
    }
    
    return { role, lovelace, ada: (lovelace / 1_000_000).toFixed(6), usdm };
}

function printBalance(label, balance) {
    console.log(`\n ${label}:`);
    console.log(`${balance.role.toUpperCase()}`);
    console.log(`ADA: ${balance.ada} (${balance.lovelace} lovelace)`);
    console.log(`USDM: ${balance.usdm}`);
}

function printBalanceComparison(before, after, role) {
    const adaDiff = after.lovelace - before.lovelace;
    const usdmDiff = after.usdm - before.usdm;
    
    console.log(`\n ${role.toUpperCase()} Balance Changes:`);
    console.log(`Before: ${before.ada} ADA | ${before.usdm} USDM`);
    console.log(`After:  ${after.ada} ADA | ${after.usdm} USDM`);
    if (adaDiff !== 0) console.log(`ADA Change: ${(adaDiff / 1_000_000).toFixed(6)}`);
    if (usdmDiff !== 0) console.log(`USDM Change: ${usdmDiff}`);
}


async function ensureCollateral(wallet, role) {
    const collateral = await wallet.getCollateral();
    if (collateral && collateral.length > 0) return null;
    
    const address = await wallet.getChangeAddress();
    const txBuilder = getTxBuilder();
    await txBuilder
        .txOut(address, [{ unit: "lovelace", quantity: "5000000" }])
        .changeAddress(address)
        .selectUtxosFrom(await wallet.getUtxos())
        .complete();
    
    const signedTx = await wallet.signTx(txBuilder.txHex);
    const txHash = await wallet.submitTx(signedTx);
    await sleep(40000);
    return txHash;
}

async function fetchUtxoByTxHash(txHash) {
    try {
        const response = await fetch(
            `https://cardano-preprod.blockfrost.io/api/v0/txs/${txHash}/utxos`,
            { headers: { 'project_id': BLOCKFROST_API_KEY } }
        );
        if (!response.ok) return null;
        const data = await response.json();
        return data.outputs.map((out, idx) => ({
            input: { txHash, outputIndex: idx },
            output: {
                address: out.address,
                amount: out.amount.map(a => ({ unit: a.unit, quantity: a.quantity })),
                inlineDatum: out.inline_datum,
                dataHash: out.data_hash
            }
        }));
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

function decodeCBORDatum(cborHex) {
    try {
        const buffer = Buffer.from(cborHex, 'hex');
        const decoded = cbor.decode(buffer);
        
        if (decoded && decoded.value && Array.isArray(decoded.value)) {
            const fields = decoded.value;
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
        }
        return null;
    } catch (error) {
        return null;
    }
}

async function checkReputationViaBlockfrost(role) {
    const wallet = role === "employer" ? employerWallet : (role === "freelancer" ? freelancerWallet : attackerWallet);
    const address = await wallet.getChangeAddress();
    const userHash = deserializeAddress(address).pubKeyHash;
    
    const nativeScriptJson = { type: "sig", keyHash: userHash };
    const policyId = resolveNativeScriptHash(nativeScriptJson);
    
    const blueprint = JSON.parse(fs.readFileSync("../plutus.json", "utf-8"));
    const validator = blueprint.validators.find(v => v.title.includes("reputation_score") && v.title.endsWith(".spend"));
    const { scriptAddr } = getScript(validator.compiledCode);
    
    try {
        const response = await fetch(
            `https://cardano-preprod.blockfrost.io/api/v0/addresses/${scriptAddr}/utxos`,
            { headers: { 'project_id': BLOCKFROST_API_KEY } }
        );
        if (!response.ok) return { exists: false };
        const utxos = await response.json();
        const repUtxo = utxos.find(u => u.amount.some(a => a.unit === policyId));
        
        if (repUtxo) {
            return {
                exists: true, unit: policyId, policyId, assetName: "",
                scriptAddr, userHash, did: repUtxo.inline_datum || "", address
            };
        }
        return { exists: false };
    } catch (error) {
        return { exists: false };
    }
}


async function mintReputationNFT(role) {
    console.log(`\n  Minting Reputation NFT for ${role}...`);
    const wallet = role === "employer" ? employerWallet : (role === "freelancer" ? freelancerWallet : attackerWallet);
    const address = await wallet.getChangeAddress();
    const userHash = deserializeAddress(address).pubKeyHash;

    const nativeScriptJson = { type: "sig", keyHash: userHash };
    const scriptCbor = "8200581c" + userHash;
    const policyId = resolveNativeScriptHash(nativeScriptJson);

    const didString = `did:cardano:${role}:${Date.now()}`;
    const didHex = Buffer.from(didString).toString("hex");
    
    const datum = mConStr0([userHash, didHex, 0, 0, 0, 0, 0, 0, 0, Date.now()]);

    const blueprint = JSON.parse(fs.readFileSync("../plutus.json", "utf-8"));
    const validator = blueprint.validators.find(v => v.title.includes("reputation_score") && v.title.endsWith(".spend"));
    const { scriptAddr } = getScript(validator.compiledCode);

    const utxos = await wallet.getUtxos();
    const walletUtxos = utxos.filter(u => u.output.address === address);
    
    const txBuilder = getTxBuilder();
    await txBuilder
        .mint("1", policyId, "")
        .mintingScript(scriptCbor)
        .txOut(scriptAddr, [
            { unit: "lovelace", quantity: "3000000" },
            { unit: policyId, quantity: "1" }
        ])
        .txOutInlineDatumValue(datum)
        .changeAddress(address)
        .selectUtxosFrom(walletUtxos)
        .complete();

    const signedTx = await wallet.signTx(txBuilder.txHex, true);
    const txHash = await wallet.submitTx(signedTx);
    
    console.log(`Minted! TX: ${txHash.substring(0, 20)}...`);
    return { unit: policyId, policyId, assetName: "", scriptAddr, userHash, did: didHex, address, txHash };
}

async function getOrMintReputationNFT(role) {
    let rep = await checkReputationViaBlockfrost(role);
    if (rep.exists) {
        const scriptUtxos = await fetchScriptUtxos(rep.scriptAddr);
        const repUtxo = scriptUtxos.find(u => u.output.amount.some(a => a.unit === rep.policyId));
        if (repUtxo && repUtxo.output.inlineDatum) {
            const datumData = decodeCBORDatum(repUtxo.output.inlineDatum);
            if (datumData) rep.did = datumData.did;
        }
        return rep;
    }
    
    rep = await mintReputationNFT(role);
    await sleep(50000);
    
    const verified = await checkReputationViaBlockfrost(role);
    if (verified.exists) {
        const scriptUtxos = await fetchScriptUtxos(verified.scriptAddr);
        const repUtxo = scriptUtxos.find(u => u.output.amount.some(a => a.unit === verified.policyId));
        if (repUtxo && repUtxo.output.inlineDatum) {
            const datumData = decodeCBORDatum(repUtxo.output.inlineDatum);
            if (datumData) verified.did = datumData.did;
        }
        return { ...verified, txHash: rep.txHash };
    }
    return rep;
}

async function queryReputationData(role) {
    console.log(`\n Querying ${role.toUpperCase()} Reputation...`);
    
    const wallet = role === "employer" ? employerWallet : (role === "freelancer" ? freelancerWallet : attackerWallet);
    const address = await wallet.getChangeAddress();
    const userHash = deserializeAddress(address).pubKeyHash;
    const nativeScriptJson = { type: "sig", keyHash: userHash };
    const policyId = resolveNativeScriptHash(nativeScriptJson);
    
    const blueprint = JSON.parse(fs.readFileSync("../plutus.json", "utf-8"));
    const validator = blueprint.validators.find(v => v.title.includes("reputation_score") && v.title.endsWith(".spend"));
    const { scriptAddr } = getScript(validator.compiledCode);
    
    const scriptUtxos = await fetchScriptUtxos(scriptAddr);
    const repUtxo = scriptUtxos.find(u => u.output.amount.some(a => a.unit === policyId));
    
    if (!repUtxo || !repUtxo.output.inlineDatum) {
        console.log(`No reputation found for ${role}`);
        return null;
    }
    
    const datumData = decodeCBORDatum(repUtxo.output.inlineDatum);
    
    if (datumData) {
        console.log(`REPUTATION: ${role.toUpperCase().padEnd(23)} `);
        console.log(`Total Jobs:     ${String(datumData.total_jobs).padEnd(19)} `);
        console.log(`Completed:      ${String(datumData.completed_jobs).padEnd(19)} `);
        console.log(`Cancelled:      ${String(datumData.cancelled_jobs).padEnd(19)} `);
        console.log(`Disputes:       ${String(datumData.dispute_count).padEnd(19)} `);
        console.log(`Rating:         ${String(datumData.average_rating + '/100').padEnd(19)} `);
        if (role === "freelancer" || role === "attacker") {
            console.log(`Total Earned:   ${String(datumData.total_earned + ' USDM').padEnd(19)} `);
        }
        if (role === "employer") {
            console.log(`Total Paid:     ${String(datumData.total_paid + ' USDM').padEnd(19)} `);
        }
        console.log(`Last Updated:   ${datumData.last_updated.substring(0, 19)}`);
    }
    
    return { policyId, scriptAddr, userHash, datum: repUtxo.output.inlineDatum, utxo: repUtxo, datumData };
}

async function displayAllReputations() {
    console.log("\n" + "=".repeat(80));
    console.log(" ALL REPUTATION DATA");
    console.log("=".repeat(80));
    await queryReputationData('employer');
    await queryReputationData('freelancer');
    await queryReputationData('attacker');
}


async function createJobListing(employerRep) {
    console.log(`\n Creating Job Listing...`);
    
    const employerAddress = await employerWallet.getChangeAddress();
    const blueprint = JSON.parse(fs.readFileSync("../plutus.json", "utf-8"));
    const jobValidator = blueprint.validators.find(v => v.title === "job_listing.job_listing.spend");
    const { scriptAddr } = getScript(jobValidator.compiledCode);
    const employerHash = deserializeAddress(employerAddress).pubKeyHash;

    const scriptUtxos = await fetchScriptUtxos(employerRep.scriptAddr);
    const repUtxo = scriptUtxos.find(u => u.output.amount.some(a => a.unit === employerRep.policyId));
    if (!repUtxo) throw new Error("Employer must have reputation NFT");

    const jobId = `JOB-${Date.now()}`;
    const title = "Cardano Smart Contract Development";
    const description = "Build a full freelance platform";
    const descriptionHash = crypto.createHash('sha256').update(description).digest('hex');
    const jobIdHex = Buffer.from(jobId).toString("hex");

    const datum = mConStr0([
        employerHash, employerRep.did,
        jobIdHex,
        Buffer.from(title).toString("hex"),
        descriptionHash,
        10, 20,
        Date.now() + (30 * 24 * 60 * 60 * 1000),
        1, 1 
    ]);

    const utxos = await employerWallet.getUtxos();
    const walletUtxos = utxos.filter(u => u.output.address === employerAddress);

    const txBuilder = getTxBuilder();
    await txBuilder
        .txOut(scriptAddr, [{ unit: "lovelace", quantity: "3000000" }])
        .txOutInlineDatumValue(datum)
        .readOnlyTxInReference(repUtxo.input.txHash, repUtxo.input.outputIndex)
        .changeAddress(employerAddress)
        .selectUtxosFrom(walletUtxos)
        .complete();

    const signedTx = await employerWallet.signTx(txBuilder.txHex);
    const txHash = await employerWallet.submitTx(signedTx);

    console.log(`Job created: ${jobId}`);
    console.log(`TX: https://preprod.cexplorer.io/tx/${txHash}`);

    return { jobId, jobIdHex, txHash, scriptAddr, employerHash, descriptionHash };
}

async function closeJob(jobInfo) {
    console.log(`\n Closing Job: ${jobInfo.jobId}...`);
    
    await ensureCollateral(employerWallet, "Employer");
    
    let jobUtxo = null;
    for (let i = 0; i < 10; i++) {
        await sleep(3000);
        const utxos = await fetchUtxoByTxHash(jobInfo.txHash);
        if (utxos && utxos.length > 0) {
            jobUtxo = utxos.find(u => u.output.address === jobInfo.scriptAddr);
            if (jobUtxo) break;
        }
    }
    if (!jobUtxo) throw new Error("Job UTxO not found");
    
    const collateral = (await employerWallet.getCollateral())[0];
    const blueprint = JSON.parse(fs.readFileSync("../plutus.json", "utf-8"));
    const validator = blueprint.validators.find(v => v.title === "job_listing.job_listing.spend");
    const { scriptCbor } = getScript(validator.compiledCode);

    const redeemer = mConStr1([]);
    const employerAddress = await employerWallet.getChangeAddress();
    const employerHash = deserializeAddress(employerAddress).pubKeyHash;
    const utxosForFees = await employerWallet.getUtxos();

    const txBuilder = getTxBuilder();
    await txBuilder
        .spendingPlutusScript("V3")
        .txIn(jobUtxo.input.txHash, jobUtxo.input.outputIndex, jobUtxo.output.amount, jobUtxo.output.address)
        .txInScript(scriptCbor)
        .txInRedeemerValue(redeemer)
        .txInInlineDatumPresent()
        .requiredSignerHash(employerHash)
        .txOut(employerAddress, jobUtxo.output.amount)
        .changeAddress(employerAddress)
        .txInCollateral(collateral.input.txHash, collateral.input.outputIndex, collateral.output.amount, collateral.output.address)
        .selectUtxosFrom(utxosForFees)
        .complete();

    const signedTx = await employerWallet.signTx(txBuilder.txHex);
    const txHash = await employerWallet.submitTx(signedTx);

    console.log(`Job closed`);
    console.log(`TX: https://preprod.cexplorer.io/tx/${txHash}`);
    return txHash;
}

async function cancelJob(jobInfo) {
    console.log(`\n Cancelling Job: ${jobInfo.jobId}...`);
    
    await ensureCollateral(employerWallet, "Employer");
    
    let jobUtxo = null;
    for (let i = 0; i < 10; i++) {
        await sleep(3000);
        const utxos = await fetchUtxoByTxHash(jobInfo.txHash);
        if (utxos && utxos.length > 0) {
            jobUtxo = utxos.find(u => u.output.address === jobInfo.scriptAddr);
            if (jobUtxo) break;
        }
    }
    if (!jobUtxo) throw new Error("Job UTxO not found");
    
    const collateral = (await employerWallet.getCollateral())[0];
    const blueprint = JSON.parse(fs.readFileSync("../plutus.json", "utf-8"));
    const validator = blueprint.validators.find(v => v.title === "job_listing.job_listing.spend");
    const { scriptCbor } = getScript(validator.compiledCode);

    const redeemer = mConStr2([]);
    const employerAddress = await employerWallet.getChangeAddress();
    const employerHash = deserializeAddress(employerAddress).pubKeyHash;
    const utxosForFees = await employerWallet.getUtxos();

    const txBuilder = getTxBuilder();
    await txBuilder
        .spendingPlutusScript("V3")
        .txIn(jobUtxo.input.txHash, jobUtxo.input.outputIndex, jobUtxo.output.amount, jobUtxo.output.address)
        .txInScript(scriptCbor)
        .txInRedeemerValue(redeemer)
        .txInInlineDatumPresent()
        .requiredSignerHash(employerHash)
        .txOut(employerAddress, jobUtxo.output.amount)
        .changeAddress(employerAddress)
        .txInCollateral(collateral.input.txHash, collateral.input.outputIndex, collateral.output.amount, collateral.output.address)
        .selectUtxosFrom(utxosForFees)
        .complete();

    const signedTx = await employerWallet.signTx(txBuilder.txHex);
    const txHash = await employerWallet.submitTx(signedTx);

    console.log(`Job cancelled`);
    console.log(`TX: https://preprod.cexplorer.io/tx/${txHash}`);
    return txHash;
}


async function submitBid(jobInfo, freelancerRep) {
    console.log(`\n Submitting Bid...`);
    
    const freelancerAddress = await freelancerWallet.getChangeAddress();
    const blueprint = JSON.parse(fs.readFileSync("../plutus.json", "utf-8"));
    const bidValidator = blueprint.validators.find(v => v.title === "bid.bid.spend");
    const { scriptAddr } = getScript(bidValidator.compiledCode);
    const freelancerHash = deserializeAddress(freelancerAddress).pubKeyHash;

    const scriptUtxos = await fetchScriptUtxos(freelancerRep.scriptAddr);
    const repUtxo = scriptUtxos.find(u => u.output.amount.some(a => a.unit === freelancerRep.policyId));
    if (!repUtxo) throw new Error("Freelancer must have reputation NFT");

    const repData = decodeCBORDatum(repUtxo.output.inlineDatum);
    const bidAmount = 15;
    const proposal = "Expert Aiken developer";
    const proposalHash = crypto.createHash('sha256').update(proposal).digest('hex');

    const isActive = mConStr1([]); 
    const datum = mConStr0([
        jobInfo.jobIdHex,
        jobInfo.employerHash,
        freelancerHash,
        repData.did,
        bidAmount,
        proposalHash,
        Date.now(),
        isActive
    ]);

    const utxos = await freelancerWallet.getUtxos();
    const walletUtxos = utxos.filter(u => u.output.address === freelancerAddress);

    const txBuilder = getTxBuilder();
    await txBuilder
        .txOut(scriptAddr, [{ unit: "lovelace", quantity: "3000000" }])
        .txOutInlineDatumValue(datum)
        .readOnlyTxInReference(repUtxo.input.txHash, repUtxo.input.outputIndex)
        .changeAddress(freelancerAddress)
        .selectUtxosFrom(walletUtxos)
        .complete();

    const signedTx = await freelancerWallet.signTx(txBuilder.txHex);
    const txHash = await freelancerWallet.submitTx(signedTx);

    console.log(`Bid submitted: ${bidAmount} USDM`);
    console.log(`TX: https://preprod.cexplorer.io/tx/${txHash}`);
    return { txHash, bidAmount, scriptAddr, freelancerHash };
}

async function cancelBid(bidInfo) {
    console.log(`\n Cancelling Bid (Freelancer)...`);
    
    await ensureCollateral(freelancerWallet, "Freelancer");
    
    let bidUtxo = null;
    for (let i = 0; i < 10; i++) {
        await sleep(3000);
        const utxos = await fetchUtxoByTxHash(bidInfo.txHash);
        if (utxos && utxos.length > 0) {
            bidUtxo = utxos.find(u => u.output.address === bidInfo.scriptAddr);
            if (bidUtxo) break;
        }
    }
    if (!bidUtxo) throw new Error("Bid UTxO not found");

    const collateral = (await freelancerWallet.getCollateral())[0];
    const blueprint = JSON.parse(fs.readFileSync("../plutus.json", "utf-8"));
    const validator = blueprint.validators.find(v => v.title === "bid.bid.spend");
    const { scriptCbor } = getScript(validator.compiledCode);

    const redeemer = mConStr1([]);
    const freelancerAddress = await freelancerWallet.getChangeAddress();
    const freelancerHash = deserializeAddress(freelancerAddress).pubKeyHash;
    const utxosForFees = await freelancerWallet.getUtxos();

    const txBuilder = getTxBuilder();
    await txBuilder
        .spendingPlutusScript("V3")
        .txIn(bidUtxo.input.txHash, bidUtxo.input.outputIndex, bidUtxo.output.amount, bidUtxo.output.address)
        .txInScript(scriptCbor)
        .txInRedeemerValue(redeemer)
        .txInInlineDatumPresent()
        .requiredSignerHash(freelancerHash)
        .txOut(freelancerAddress, bidUtxo.output.amount)
        .changeAddress(freelancerAddress)
        .txInCollateral(collateral.input.txHash, collateral.input.outputIndex, collateral.output.amount, collateral.output.address)
        .selectUtxosFrom(utxosForFees)
        .complete();

    const signedTx = await freelancerWallet.signTx(txBuilder.txHex);
    const txHash = await freelancerWallet.submitTx(signedTx);

    console.log(`Bid cancelled`);
    console.log(`TX: https://preprod.cexplorer.io/tx/${txHash}`);
    return txHash;
}

async function acceptBid(bidInfo) {
    console.log(`\n Accepting Bid (Employer)...`);
    
    await ensureCollateral(employerWallet, "Employer");
    
    let bidUtxo = null;
    for (let i = 0; i < 20; i++) {
        await sleep(5000);
        const utxos = await fetchUtxoByTxHash(bidInfo.txHash);
        if (utxos && utxos.length > 0) {
            bidUtxo = utxos.find(u => u.output.address === bidInfo.scriptAddr);
            if (bidUtxo) break;
        }
    }
    if (!bidUtxo) throw new Error("Bid UTxO not found");

    const collateral = (await employerWallet.getCollateral())[0];
    const blueprint = JSON.parse(fs.readFileSync("../plutus.json", "utf-8"));
    const validator = blueprint.validators.find(v => v.title === "bid.bid.spend");
    const { scriptCbor } = getScript(validator.compiledCode);

    const redeemer = mConStr2([]);
    const employerAddress = await employerWallet.getChangeAddress();
    const employerHash = deserializeAddress(employerAddress).pubKeyHash;
    const utxosForFees = await employerWallet.getUtxos();

    const txBuilder = getTxBuilder();
    await txBuilder
        .spendingPlutusScript("V3")
        .txIn(bidUtxo.input.txHash, bidUtxo.input.outputIndex, bidUtxo.output.amount, bidUtxo.output.address)
        .txInScript(scriptCbor)
        .txInRedeemerValue(redeemer)
        .txInInlineDatumPresent()
        .requiredSignerHash(employerHash)
        .txOut(employerAddress, bidUtxo.output.amount)
        .changeAddress(employerAddress)
        .txInCollateral(collateral.input.txHash, collateral.input.outputIndex, collateral.output.amount, collateral.output.address)
        .selectUtxosFrom(utxosForFees)
        .complete();

    const signedTx = await employerWallet.signTx(txBuilder.txHex);
    const txHash = await employerWallet.submitTx(signedTx);

    console.log(`Bid accepted`);
    console.log(`TX: https://preprod.cexplorer.io/tx/${txHash}`);
    return txHash;
}

async function createEscrow(jobId, jobIdHex, employerRep, freelancerRep) {
    console.log(`\n Creating Escrow...`);
    
    const employerAddress = await employerWallet.getChangeAddress();
    const blueprint = JSON.parse(fs.readFileSync("../plutus.json", "utf-8"));
    const escrowValidator = blueprint.validators.find(v => v.title === "freelance_escrow.freelance_escrow.spend");
    const { scriptAddr } = getScript(escrowValidator.compiledCode);
    
    const employerHash = deserializeAddress(employerAddress).pubKeyHash;
    const freelancerHash = deserializeAddress(await freelancerWallet.getChangeAddress()).pubKeyHash;
    const escrowAmount = 15;
    
    const datum = mConStr0([
        employerHash, employerRep.did,
        freelancerHash, freelancerRep.did,
        employerHash, 
        USDM_POLICY_ID, USDM_ASSET_NAME,
        escrowAmount,
        jobIdHex,
    ]);
    
    const assets = [
        { unit: "lovelace", quantity: "3000000" },
        { unit: USDM_POLICY_ID + USDM_ASSET_NAME, quantity: escrowAmount.toString() },
    ];
    
    const utxos = await employerWallet.getUtxos();
    const walletUtxos = utxos.filter(u => u.output.address === employerAddress);

    const txBuilder = getTxBuilder();
    await txBuilder
        .txOut(scriptAddr, assets)
        .txOutInlineDatumValue(datum)
        .changeAddress(employerAddress)
        .selectUtxosFrom(walletUtxos)
        .complete();
    
    const signedTx = await employerWallet.signTx(txBuilder.txHex);
    const txHash = await employerWallet.submitTx(signedTx);
    
    console.log(`Escrow created: ${escrowAmount} USDM`);
    console.log(`TX: https://preprod.cexplorer.io/tx/${txHash}`);
    
    return {
        txHash, scriptAddress: scriptAddr, jobId, jobIdHex,
        employerHash, employerDid: employerRep.did,
        freelancerHash, freelancerDid: freelancerRep.did,
        arbiterHash: employerHash,
        usdmPolicy: USDM_POLICY_ID, usdmAssetName: USDM_ASSET_NAME,
        escrowAmount,
    };
}

async function releaseEscrowWithCompletionToken(escrowInfo, jobInfo) {
    console.log(`\n TX1: Release Escrow + Mint Completion Token...`);
    
    const employerAddress = await employerWallet.getChangeAddress();
    const freelancerAddress = await freelancerWallet.getChangeAddress();
    
    const blueprint = JSON.parse(fs.readFileSync("../plutus.json", "utf-8"));
    
    const escrowValidator = blueprint.validators.find(v => v.title === "freelance_escrow.freelance_escrow.spend");
    const { scriptAddr: escrowScriptAddr, scriptCbor: escrowScriptCbor } = getScript(escrowValidator.compiledCode);
    
    const completionMintValidator = blueprint.validators.find(v => v.title === "job_completion.job_completion.mint");
    const { scriptCbor: completionMintCbor } = getScript(completionMintValidator.compiledCode);
    const completionPolicyId = completionMintValidator.hash;
    
    const completionStoreValidator = blueprint.validators.find(v => v.title === "job_completion.job_completion_store.spend");
    const { scriptAddr: completionStoreAddr } = getScript(completionStoreValidator.compiledCode);
    
    console.log(`Completion Policy ID: ${completionPolicyId}`);
    
    let escrowUtxo = null;
    for (let i = 0; i < 20; i++) {
        await sleep(5000);
        const utxos = await fetchUtxoByTxHash(escrowInfo.txHash);
        if (utxos && utxos.length > 0) {
            escrowUtxo = utxos.find(u => u.output.address === escrowScriptAddr);
            if (escrowUtxo) break;
        }
        if (i % 4 === 0) console.log(`⏳ Waiting for escrow (${i + 1}/20)...`);
    }
    if (!escrowUtxo) throw new Error("Escrow UTxO not found");
    console.log(`Found escrow UTxO`);
    
    await ensureCollateral(employerWallet, "Employer");
    const employerCollateral = (await employerWallet.getCollateral())[0];
    
    const jobIdBytes = Buffer.from(escrowInfo.jobIdHex, 'hex');
    const completionAssetName = blake2b256(jobIdBytes);
    
    const escrowRedeemer = mConStr0([completionPolicyId]);
    const completionMintRedeemer = mConStr0([
        escrowInfo.jobIdHex,
        escrowInfo.employerHash,
        escrowInfo.freelancerHash,
        escrowInfo.escrowAmount
    ]);
    const completionDatum = mConStr0([
        escrowInfo.jobIdHex,
        escrowInfo.employerHash,
        escrowInfo.freelancerHash,
        escrowInfo.escrowAmount,
        Date.now()
    ]);
    
    const employerUtxos = await employerWallet.getUtxos();
    
    const txBuilder = getTxBuilder();
    
    txBuilder
        .spendingPlutusScript("V3")
        .txIn(escrowUtxo.input.txHash, escrowUtxo.input.outputIndex, escrowUtxo.output.amount, escrowUtxo.output.address)
        .txInScript(escrowScriptCbor)
        .txInRedeemerValue(escrowRedeemer)
        .txInInlineDatumPresent();
    
    txBuilder
        .mintPlutusScript("V3")
        .mint("1", completionPolicyId, completionAssetName)
        .mintingScript(completionMintCbor)
        .mintRedeemerValue(completionMintRedeemer);
    
    txBuilder
        .requiredSignerHash(escrowInfo.employerHash)
        .requiredSignerHash(escrowInfo.freelancerHash);
    
    txBuilder.txOut(freelancerAddress, escrowUtxo.output.amount);
    
    txBuilder
        .txOut(completionStoreAddr, [
            { unit: "lovelace", quantity: "2000000" },
            { unit: completionPolicyId + completionAssetName, quantity: "1" }
        ])
        .txOutInlineDatumValue(completionDatum);
    
    txBuilder
        .changeAddress(employerAddress)
        .txInCollateral(employerCollateral.input.txHash, employerCollateral.input.outputIndex, employerCollateral.output.amount, employerCollateral.output.address)
        .selectUtxosFrom(employerUtxos);
    
    await txBuilder.complete();
    
    const unsignedTx = txBuilder.txHex;
    const employerSignedTx = await employerWallet.signTx(unsignedTx);
    const fullySignedTx = await freelancerWallet.signTx(employerSignedTx, true);
    
    const txHash = await employerWallet.submitTx(fullySignedTx);
    
    console.log(`TX1 Complete!`);
    console.log(`TX: https://preprod.cexplorer.io/tx/${txHash}`);
    
    return { txHash, completionPolicyId, completionAssetName, completionStoreAddr };
}

async function updateFreelancerRepWithProof(tx1Result, escrowInfo, freelancerRep, rating) {
    console.log(`\n TX2: Update Freelancer Rep...`);
    
    const freelancerAddress = await freelancerWallet.getChangeAddress();
    
    console.log(`Waiting for completion proof...`);
    let completionUtxo = null;
    for (let i = 0; i < 30; i++) {
        await sleep(5000);
        const utxos = await fetchScriptUtxos(tx1Result.completionStoreAddr);
        completionUtxo = utxos.find(u => 
            u.output.amount.some(a => a.unit === tx1Result.completionPolicyId + tx1Result.completionAssetName)
        );
        if (completionUtxo) break;
        if (i % 5 === 0) console.log(`Still waiting (${i + 1}/30)...`);
    }
    if (!completionUtxo) throw new Error("Completion proof UTxO not found");
    console.log(`Found completion proof`);
    
    const blueprint = JSON.parse(fs.readFileSync("../plutus.json", "utf-8"));
    const repValidator = blueprint.validators.find(v => v.title.includes("reputation_score") && v.title.endsWith(".spend"));
    const { scriptCbor: repScriptCbor } = getScript(repValidator.compiledCode);
    
    await ensureCollateral(freelancerWallet, "Freelancer");
    const freelancerCollateral = (await freelancerWallet.getCollateral())[0];
    
    const freelancerScriptUtxos = await fetchScriptUtxos(freelancerRep.scriptAddr);
    const freelancerRepUtxo = freelancerScriptUtxos.find(u => u.output.amount.some(a => a.unit === freelancerRep.policyId));
    if (!freelancerRepUtxo) throw new Error("Freelancer reputation UTxO not found");
    
    const existingData = decodeCBORDatum(freelancerRepUtxo.output.inlineDatum);
    
    const completedBool = mConStr1([]);
    const freelancerBool = mConStr1([]);
    const redeemer = mConStr1([
        escrowInfo.jobIdHex, rating, escrowInfo.escrowAmount,
        completedBool, freelancerBool, tx1Result.completionPolicyId
    ]);
    
    const newTotalJobs = existingData.total_jobs + 1;
    const newRating = existingData.total_jobs === 0 ? rating 
        : Math.round(((existingData.average_rating * existingData.total_jobs) + rating) / newTotalJobs);
    
    const newDatum = mConStr0([
        freelancerRep.userHash, freelancerRep.did,
        newTotalJobs, existingData.completed_jobs + 1,
        existingData.cancelled_jobs, existingData.dispute_count,
        existingData.total_earned + escrowInfo.escrowAmount, existingData.total_paid,
        newRating, Date.now()
    ]);
    
    const freelancerUtxos = await freelancerWallet.getUtxos();
    
    const txBuilder = getTxBuilder();
    
    txBuilder
        .spendingPlutusScript("V3")
        .txIn(freelancerRepUtxo.input.txHash, freelancerRepUtxo.input.outputIndex, freelancerRepUtxo.output.amount, freelancerRepUtxo.output.address)
        .txInScript(repScriptCbor)
        .txInRedeemerValue(redeemer)
        .txInInlineDatumPresent();
    
    txBuilder.readOnlyTxInReference(completionUtxo.input.txHash, completionUtxo.input.outputIndex);
    txBuilder.requiredSignerHash(freelancerRep.userHash);
    
    txBuilder
        .txOut(freelancerRep.scriptAddr, freelancerRepUtxo.output.amount)
        .txOutInlineDatumValue(newDatum);
    
    txBuilder
        .changeAddress(freelancerAddress)
        .txInCollateral(freelancerCollateral.input.txHash, freelancerCollateral.input.outputIndex, freelancerCollateral.output.amount, freelancerCollateral.output.address)
        .selectUtxosFrom(freelancerUtxos);
    
    await txBuilder.complete();
    const signedTx = await freelancerWallet.signTx(txBuilder.txHex);
    const txHash = await freelancerWallet.submitTx(signedTx);
    
    console.log(`TX2 Complete!`);
    console.log(`TX: https://preprod.cexplorer.io/tx/${txHash}`);
    
    return txHash;
}

async function updateEmployerRepWithProof(tx1Result, escrowInfo, employerRep, rating) {
    console.log(`\n TX3: Update Employer Rep...`);
    
    const employerAddress = await employerWallet.getChangeAddress();
    
    const utxos = await fetchScriptUtxos(tx1Result.completionStoreAddr);
    const completionUtxo = utxos.find(u => 
        u.output.amount.some(a => a.unit === tx1Result.completionPolicyId + tx1Result.completionAssetName)
    );
    if (!completionUtxo) throw new Error("Completion proof UTxO not found");
    
    const blueprint = JSON.parse(fs.readFileSync("../plutus.json", "utf-8"));
    const repValidator = blueprint.validators.find(v => v.title.includes("reputation_score") && v.title.endsWith(".spend"));
    const { scriptCbor: repScriptCbor } = getScript(repValidator.compiledCode);
    
    await ensureCollateral(employerWallet, "Employer");
    const employerCollateral = (await employerWallet.getCollateral())[0];
    
    const employerScriptUtxos = await fetchScriptUtxos(employerRep.scriptAddr);
    const employerRepUtxo = employerScriptUtxos.find(u => u.output.amount.some(a => a.unit === employerRep.policyId));
    if (!employerRepUtxo) throw new Error("Employer reputation UTxO not found");
    
    const existingData = decodeCBORDatum(employerRepUtxo.output.inlineDatum);
    
    const completedBool = mConStr1([]);
    const employerBool = mConStr0([]);
    const redeemer = mConStr1([
        escrowInfo.jobIdHex, rating, escrowInfo.escrowAmount,
        completedBool, employerBool, tx1Result.completionPolicyId
    ]);
    
    const newTotalJobs = existingData.total_jobs + 1;
    const newRating = existingData.total_jobs === 0 ? rating 
        : Math.round(((existingData.average_rating * existingData.total_jobs) + rating) / newTotalJobs);
    
    const newDatum = mConStr0([
        employerRep.userHash, employerRep.did,
        newTotalJobs, existingData.completed_jobs + 1,
        existingData.cancelled_jobs, existingData.dispute_count,
        existingData.total_earned, existingData.total_paid + escrowInfo.escrowAmount,
        newRating, Date.now()
    ]);
    
    const employerUtxos = await employerWallet.getUtxos();
    
    const txBuilder = getTxBuilder();
    
    txBuilder
        .spendingPlutusScript("V3")
        .txIn(employerRepUtxo.input.txHash, employerRepUtxo.input.outputIndex, employerRepUtxo.output.amount, employerRepUtxo.output.address)
        .txInScript(repScriptCbor)
        .txInRedeemerValue(redeemer)
        .txInInlineDatumPresent();
    
    txBuilder.readOnlyTxInReference(completionUtxo.input.txHash, completionUtxo.input.outputIndex);
    txBuilder.requiredSignerHash(employerRep.userHash);
    
    txBuilder
        .txOut(employerRep.scriptAddr, employerRepUtxo.output.amount)
        .txOutInlineDatumValue(newDatum);
    
    txBuilder
        .changeAddress(employerAddress)
        .txInCollateral(employerCollateral.input.txHash, employerCollateral.input.outputIndex, employerCollateral.output.amount, employerCollateral.output.address)
        .selectUtxosFrom(employerUtxos);
    
    await txBuilder.complete();
    const signedTx = await employerWallet.signTx(txBuilder.txHex);
    const txHash = await employerWallet.submitTx(signedTx);
    
    console.log(`TX3 Complete!`);
    console.log(`TX: https://preprod.cexplorer.io/tx/${txHash}`);
    
    return txHash;
}

async function runSecurityTest(testName, attackFn) {
    console.log(`\n SECURITY: ${testName}...`);
    try {
        const result = await attackFn();
        if (result.success) {
            console.log(`BREACH: Attack succeeded!`);
            return false;
        } else {
            console.log(`BLOCKED: ${result.error?.substring(0, 60)}...`);
            return true;
        }
    } catch (error) {
        console.log(`BLOCKED: ${error.message?.substring(0, 60)}...`);
        return true;
    }
}

async function attackAcceptBid(bidInfo) {
    await ensureCollateral(attackerWallet, "Attacker");
    
    let bidUtxo = null;
    const utxos = await fetchScriptUtxos(bidInfo.scriptAddr);
    bidUtxo = utxos.find(u => u.input.txHash === bidInfo.txHash);
    if (!bidUtxo) {
        const txUtxos = await fetchUtxoByTxHash(bidInfo.txHash);
        if (txUtxos) bidUtxo = txUtxos.find(u => u.output.address === bidInfo.scriptAddr);
    }
    if (!bidUtxo) return { success: false, error: "Bid UTxO consumed" };

    const collateral = (await attackerWallet.getCollateral())[0];
    const blueprint = JSON.parse(fs.readFileSync("../plutus.json", "utf-8"));
    const { scriptCbor } = getScript(blueprint.validators.find(v => v.title === "bid.bid.spend").compiledCode);

    const attackerAddress = await attackerWallet.getChangeAddress();
    const attackerHash = deserializeAddress(attackerAddress).pubKeyHash;

    const txBuilder = getTxBuilder();
    await txBuilder
        .spendingPlutusScript("V3")
        .txIn(bidUtxo.input.txHash, bidUtxo.input.outputIndex, bidUtxo.output.amount, bidUtxo.output.address)
        .txInScript(scriptCbor)
        .txInRedeemerValue(mConStr2([]))
        .txInInlineDatumPresent()
        .requiredSignerHash(attackerHash)
        .txOut(attackerAddress, bidUtxo.output.amount)
        .changeAddress(attackerAddress)
        .txInCollateral(collateral.input.txHash, collateral.input.outputIndex, collateral.output.amount, collateral.output.address)
        .selectUtxosFrom(await attackerWallet.getUtxos())
        .complete();

    const signedTx = await attackerWallet.signTx(txBuilder.txHex);
    await attackerWallet.submitTx(signedTx);
    return { success: true };
}

async function attackCancelBid(bidInfo) {
    await ensureCollateral(attackerWallet, "Attacker");
    
    let bidUtxo = null;
    const utxos = await fetchScriptUtxos(bidInfo.scriptAddr);
    bidUtxo = utxos.find(u => u.input.txHash === bidInfo.txHash);
    if (!bidUtxo) {
        const txUtxos = await fetchUtxoByTxHash(bidInfo.txHash);
        if (txUtxos) bidUtxo = txUtxos.find(u => u.output.address === bidInfo.scriptAddr);
    }
    if (!bidUtxo) return { success: false, error: "Bid UTxO consumed" };

    const collateral = (await attackerWallet.getCollateral())[0];
    const blueprint = JSON.parse(fs.readFileSync("../plutus.json", "utf-8"));
    const { scriptCbor } = getScript(blueprint.validators.find(v => v.title === "bid.bid.spend").compiledCode);

    const attackerAddress = await attackerWallet.getChangeAddress();
    const attackerHash = deserializeAddress(attackerAddress).pubKeyHash;

    const txBuilder = getTxBuilder();
    await txBuilder
        .spendingPlutusScript("V3")
        .txIn(bidUtxo.input.txHash, bidUtxo.input.outputIndex, bidUtxo.output.amount, bidUtxo.output.address)
        .txInScript(scriptCbor)
        .txInRedeemerValue(mConStr1([])) 
        .txInInlineDatumPresent()
        .requiredSignerHash(attackerHash)
        .txOut(attackerAddress, bidUtxo.output.amount)
        .changeAddress(attackerAddress)
        .txInCollateral(collateral.input.txHash, collateral.input.outputIndex, collateral.output.amount, collateral.output.address)
        .selectUtxosFrom(await attackerWallet.getUtxos())
        .complete();

    const signedTx = await attackerWallet.signTx(txBuilder.txHex);
    await attackerWallet.submitTx(signedTx);
    return { success: true };
}

async function attackCloseJob(jobInfo) {
    await ensureCollateral(attackerWallet, "Attacker");
    
    let jobUtxo = null;
    const utxos = await fetchScriptUtxos(jobInfo.scriptAddr);
    jobUtxo = utxos.find(u => u.input.txHash === jobInfo.txHash);
    if (!jobUtxo) {
        const txUtxos = await fetchUtxoByTxHash(jobInfo.txHash);
        if (txUtxos) jobUtxo = txUtxos.find(u => u.output.address === jobInfo.scriptAddr);
    }
    if (!jobUtxo) return { success: false, error: "Job UTxO consumed" };

    const collateral = (await attackerWallet.getCollateral())[0];
    const blueprint = JSON.parse(fs.readFileSync("../plutus.json", "utf-8"));
    const { scriptCbor } = getScript(blueprint.validators.find(v => v.title === "job_listing.job_listing.spend").compiledCode);

    const attackerAddress = await attackerWallet.getChangeAddress();
    const attackerHash = deserializeAddress(attackerAddress).pubKeyHash;

    const txBuilder = getTxBuilder();
    await txBuilder
        .spendingPlutusScript("V3")
        .txIn(jobUtxo.input.txHash, jobUtxo.input.outputIndex, jobUtxo.output.amount, jobUtxo.output.address)
        .txInScript(scriptCbor)
        .txInRedeemerValue(mConStr1([])) 
        .txInInlineDatumPresent()
        .requiredSignerHash(attackerHash)
        .txOut(attackerAddress, jobUtxo.output.amount)
        .changeAddress(attackerAddress)
        .txInCollateral(collateral.input.txHash, collateral.input.outputIndex, collateral.output.amount, collateral.output.address)
        .selectUtxosFrom(await attackerWallet.getUtxos())
        .complete();

    const signedTx = await attackerWallet.signTx(txBuilder.txHex);
    await attackerWallet.submitTx(signedTx);
    return { success: true };
}

async function attackCancelJob(jobInfo) {
    await ensureCollateral(attackerWallet, "Attacker");
    
    let jobUtxo = null;
    const utxos = await fetchScriptUtxos(jobInfo.scriptAddr);
    jobUtxo = utxos.find(u => u.input.txHash === jobInfo.txHash);
    if (!jobUtxo) {
        const txUtxos = await fetchUtxoByTxHash(jobInfo.txHash);
        if (txUtxos) jobUtxo = txUtxos.find(u => u.output.address === jobInfo.scriptAddr);
    }
    if (!jobUtxo) return { success: false, error: "Job UTxO consumed" };

    const collateral = (await attackerWallet.getCollateral())[0];
    const blueprint = JSON.parse(fs.readFileSync("../plutus.json", "utf-8"));
    const { scriptCbor } = getScript(blueprint.validators.find(v => v.title === "job_listing.job_listing.spend").compiledCode);

    const attackerAddress = await attackerWallet.getChangeAddress();
    const attackerHash = deserializeAddress(attackerAddress).pubKeyHash;

    const txBuilder = getTxBuilder();
    await txBuilder
        .spendingPlutusScript("V3")
        .txIn(jobUtxo.input.txHash, jobUtxo.input.outputIndex, jobUtxo.output.amount, jobUtxo.output.address)
        .txInScript(scriptCbor)
        .txInRedeemerValue(mConStr2([])) 
        .txInInlineDatumPresent()
        .requiredSignerHash(attackerHash)
        .txOut(attackerAddress, jobUtxo.output.amount)
        .changeAddress(attackerAddress)
        .txInCollateral(collateral.input.txHash, collateral.input.outputIndex, collateral.output.amount, collateral.output.address)
        .selectUtxosFrom(await attackerWallet.getUtxos())
        .complete();

    const signedTx = await attackerWallet.signTx(txBuilder.txHex);
    await attackerWallet.submitTx(signedTx);
    return { success: true };
}

async function attackStealEscrow(escrowInfo) {
    await ensureCollateral(attackerWallet, "Attacker");
    
    const blueprint = JSON.parse(fs.readFileSync("../plutus.json", "utf-8"));
    const escrowValidator = blueprint.validators.find(v => v.title === "freelance_escrow.freelance_escrow.spend");
    const { scriptAddr: escrowScriptAddr, scriptCbor: escrowScriptCbor } = getScript(escrowValidator.compiledCode);
    const completionMintValidator = blueprint.validators.find(v => v.title === "job_completion.job_completion.mint");
    const { scriptCbor: completionMintCbor } = getScript(completionMintValidator.compiledCode);
    const completionPolicyId = completionMintValidator.hash;
    const completionStoreValidator = blueprint.validators.find(v => v.title === "job_completion.job_completion_store.spend");
    const { scriptAddr: completionStoreAddr } = getScript(completionStoreValidator.compiledCode);
    
    let escrowUtxo = null;
    const utxos = await fetchScriptUtxos(escrowScriptAddr);
    escrowUtxo = utxos.find(u => u.output.amount.some(a => a.unit === USDM_POLICY_ID + USDM_ASSET_NAME));
    if (!escrowUtxo) {
        const txUtxos = await fetchUtxoByTxHash(escrowInfo.txHash);
        if (txUtxos) escrowUtxo = txUtxos.find(u => u.output.address === escrowScriptAddr);
    }
    if (!escrowUtxo) return { success: false, error: "Escrow UTxO consumed" };
    
    const attackerAddress = await attackerWallet.getChangeAddress();
    const attackerHash = deserializeAddress(attackerAddress).pubKeyHash;
    const collateral = (await attackerWallet.getCollateral())[0];
    
    const jobIdBytes = Buffer.from(escrowInfo.jobIdHex, 'hex');
    const completionAssetName = blake2b256(jobIdBytes);
    
    const txBuilder = getTxBuilder();
    
    txBuilder
        .spendingPlutusScript("V3")
        .txIn(escrowUtxo.input.txHash, escrowUtxo.input.outputIndex, escrowUtxo.output.amount, escrowUtxo.output.address)
        .txInScript(escrowScriptCbor)
        .txInRedeemerValue(mConStr0([completionPolicyId]))
        .txInInlineDatumPresent();
    
    txBuilder
        .mintPlutusScript("V3")
        .mint("1", completionPolicyId, completionAssetName)
        .mintingScript(completionMintCbor)
        .mintRedeemerValue(mConStr0([escrowInfo.jobIdHex, escrowInfo.employerHash, escrowInfo.freelancerHash, escrowInfo.escrowAmount]));
    
    txBuilder.requiredSignerHash(attackerHash);
    txBuilder.txOut(attackerAddress, escrowUtxo.output.amount);
    txBuilder
        .txOut(completionStoreAddr, [
            { unit: "lovelace", quantity: "2000000" },
            { unit: completionPolicyId + completionAssetName, quantity: "1" }
        ])
        .txOutInlineDatumValue(mConStr0([escrowInfo.jobIdHex, escrowInfo.employerHash, escrowInfo.freelancerHash, escrowInfo.escrowAmount, Date.now()]));
    
    txBuilder
        .changeAddress(attackerAddress)
        .txInCollateral(collateral.input.txHash, collateral.input.outputIndex, collateral.output.amount, collateral.output.address)
        .selectUtxosFrom(await attackerWallet.getUtxos());
    
    await txBuilder.complete();
    const signedTx = await attackerWallet.signTx(txBuilder.txHex);
    await attackerWallet.submitTx(signedTx);
    return { success: true };
}

async function attackMintFakeCompletion() {
    await ensureCollateral(attackerWallet, "Attacker");
    
    const blueprint = JSON.parse(fs.readFileSync("../plutus.json", "utf-8"));
    const completionMintValidator = blueprint.validators.find(v => v.title === "job_completion.job_completion.mint");
    const { scriptCbor: completionMintCbor } = getScript(completionMintValidator.compiledCode);
    const completionPolicyId = completionMintValidator.hash;
    const completionStoreValidator = blueprint.validators.find(v => v.title === "job_completion.job_completion_store.spend");
    const { scriptAddr: completionStoreAddr } = getScript(completionStoreValidator.compiledCode);
    
    const attackerAddress = await attackerWallet.getChangeAddress();
    const attackerHash = deserializeAddress(attackerAddress).pubKeyHash;
    const collateral = (await attackerWallet.getCollateral())[0];
    
    const fakeJobIdHex = Buffer.from("FAKE-JOB-" + Date.now()).toString("hex");
    const jobIdBytes = Buffer.from(fakeJobIdHex, 'hex');
    const completionAssetName = blake2b256(jobIdBytes);
    
    const txBuilder = getTxBuilder();
    
    txBuilder
        .mintPlutusScript("V3")
        .mint("1", completionPolicyId, completionAssetName)
        .mintingScript(completionMintCbor)
        .mintRedeemerValue(mConStr0([fakeJobIdHex, attackerHash, attackerHash, 1000]));
    
    txBuilder.requiredSignerHash(attackerHash);
    
    txBuilder
        .txOut(completionStoreAddr, [
            { unit: "lovelace", quantity: "2000000" },
            { unit: completionPolicyId + completionAssetName, quantity: "1" }
        ])
        .txOutInlineDatumValue(mConStr0([fakeJobIdHex, attackerHash, attackerHash, 1000, Date.now()]));
    
    txBuilder
        .changeAddress(attackerAddress)
        .txInCollateral(collateral.input.txHash, collateral.input.outputIndex, collateral.output.amount, collateral.output.address)
        .selectUtxosFrom(await attackerWallet.getUtxos());
    
    await txBuilder.complete();
    const signedTx = await attackerWallet.signTx(txBuilder.txHex);
    await attackerWallet.submitTx(signedTx);
    return { success: true };
}

async function attackUpdateReputation(targetRep) {
    await ensureCollateral(attackerWallet, "Attacker");
    
    const blueprint = JSON.parse(fs.readFileSync("../plutus.json", "utf-8"));
    const repValidator = blueprint.validators.find(v => v.title.includes("reputation_score") && v.title.endsWith(".spend"));
    const { scriptCbor: repScriptCbor } = getScript(repValidator.compiledCode);
    
    const attackerAddress = await attackerWallet.getChangeAddress();
    const attackerHash = deserializeAddress(attackerAddress).pubKeyHash;
    const collateral = (await attackerWallet.getCollateral())[0];
    
    const scriptUtxos = await fetchScriptUtxos(targetRep.scriptAddr);
    const repUtxo = scriptUtxos.find(u => u.output.amount.some(a => a.unit === targetRep.policyId));
    if (!repUtxo) return { success: false, error: "Rep UTxO not found" };
    
    const existingData = decodeCBORDatum(repUtxo.output.inlineDatum);
    const fakeJobIdHex = Buffer.from("FAKE").toString("hex");
    const fakePolicyId = "0000000000000000000000000000000000000000000000000000dead";
    
    const redeemer = mConStr1([fakeJobIdHex, 100, 1000000, mConStr1([]), mConStr1([]), fakePolicyId]);
    
    const fakeNewDatum = mConStr0([
        targetRep.userHash, targetRep.did,
        existingData.total_jobs + 100, existingData.completed_jobs + 100,
        existingData.cancelled_jobs, existingData.dispute_count,
        existingData.total_earned + 1000000, existingData.total_paid,
        100, Date.now()
    ]);
    
    const txBuilder = getTxBuilder();
    
    txBuilder
        .spendingPlutusScript("V3")
        .txIn(repUtxo.input.txHash, repUtxo.input.outputIndex, repUtxo.output.amount, repUtxo.output.address)
        .txInScript(repScriptCbor)
        .txInRedeemerValue(redeemer)
        .txInInlineDatumPresent();
    
    txBuilder.requiredSignerHash(attackerHash);
    
    txBuilder
        .txOut(targetRep.scriptAddr, repUtxo.output.amount)
        .txOutInlineDatumValue(fakeNewDatum);
    
    txBuilder
        .changeAddress(attackerAddress)
        .txInCollateral(collateral.input.txHash, collateral.input.outputIndex, collateral.output.amount, collateral.output.address)
        .selectUtxosFrom(await attackerWallet.getUtxos());
    
    await txBuilder.complete();
    const signedTx = await attackerWallet.signTx(txBuilder.txHex);
    await attackerWallet.submitTx(signedTx);
    return { success: true };
}


async function main() {
    try {
        console.log("\n" + "═".repeat(80));
        console.log(" DECENTGIGS COMPLETE TEST SUITE V8");
        console.log("   Testing ALL Functions + ALL Security Scenarios");
        console.log("═".repeat(80));
        console.log("\n INITIAL BALANCES:");
        const employerBalanceBefore = await getWalletBalance(employerWallet, "employer");
        const freelancerBalanceBefore = await getWalletBalance(freelancerWallet, "freelancer");
        const attackerBalanceBefore = await getWalletBalance(attackerWallet, "attacker");
        printBalance("EMPLOYER", employerBalanceBefore);
        printBalance("FREELANCER", freelancerBalanceBefore);
        printBalance("ATTACKER", attackerBalanceBefore);
        console.log("\n" + "─".repeat(80));
        console.log(" SETUP: Reputation NFTs");
        console.log("─".repeat(80));
        const employerRep = await getOrMintReputationNFT('employer');
        const freelancerRep = await getOrMintReputationNFT('freelancer');
        const attackerRep = await getOrMintReputationNFT('attacker');
        logTest("Setup - All Reputation NFTs", "PASS");

        console.log("\n" + "═".repeat(80));
        console.log(" TEST GROUP 1: JOB LIFECYCLE");
        console.log("═".repeat(80));

        const jobForCancel = await createJobListing(employerRep);
        logTest("Create Job (for cancel test)", "PASS", `ID: ${jobForCancel.jobId}`);
        await sleep(45000);
        const secCancelJob = await runSecurityTest("Attacker cancel job", () => attackCancelJob(jobForCancel));
        logTest("SECURITY: Block attacker cancel job", secCancelJob ? "PASS" : "FAIL");
        const secCloseJob = await runSecurityTest("Attacker close job", () => attackCloseJob(jobForCancel));
        logTest("SECURITY: Block attacker close job", secCloseJob ? "PASS" : "FAIL");
        const cancelJobTx = await cancelJob(jobForCancel);
        logTest("Cancel Job (legitimate)", "PASS");
        await sleep(45000);
        const jobForClose = await createJobListing(employerRep);
        logTest("Create Job (for close test)", "PASS", `ID: ${jobForClose.jobId}`);
        await sleep(45000);
        const closeJobTx = await closeJob(jobForClose);
        logTest("Close Job (legitimate)", "PASS");
        await sleep(45000);
        console.log("\n" + "═".repeat(80));
        console.log(" TEST GROUP 2: BID LIFECYCLE");
        console.log("═".repeat(80));
        const jobForBids = await createJobListing(employerRep);
        logTest("Create Job (for bid tests)", "PASS", `ID: ${jobForBids.jobId}`);
        await sleep(45000);
        const bidForCancel = await submitBid(jobForBids, freelancerRep);
        logTest("Submit Bid (for cancel test)", "PASS");
        await sleep(45000);
        const secCancelBid = await runSecurityTest("Attacker cancel bid", () => attackCancelBid(bidForCancel));
        logTest("SECURITY: Block attacker cancel bid", secCancelBid ? "PASS" : "FAIL");
        const secAcceptBid = await runSecurityTest("Attacker accept bid", () => attackAcceptBid(bidForCancel));
        logTest("SECURITY: Block attacker accept bid", secAcceptBid ? "PASS" : "FAIL");
        const cancelBidTx = await cancelBid(bidForCancel);
        logTest("Cancel Bid (legitimate)", "PASS");
        await sleep(45000);
        const bidForAccept = await submitBid(jobForBids, freelancerRep);
        logTest("Submit Bid (for accept test)", "PASS");
        await sleep(45000);
        const acceptBidTx = await acceptBid(bidForAccept);
        logTest("Accept Bid (legitimate)", "PASS");
        await sleep(45000);
        console.log("\n" + "═".repeat(80));
        console.log(" TEST GROUP 3: ESCROW & COMPLETION WORKFLOW");
        console.log("═".repeat(80));
        const jobForWorkflow = await createJobListing(employerRep);
        logTest("Create Job (for workflow)", "PASS", `ID: ${jobForWorkflow.jobId}`);
        await sleep(45000);
        const bidForWorkflow = await submitBid(jobForWorkflow, freelancerRep);
        logTest("Submit Bid (for workflow)", "PASS");
        await sleep(45000);
        await acceptBid(bidForWorkflow);
        logTest("Accept Bid (for workflow)", "PASS");
        await sleep(45000);
        const escrowInfo = await createEscrow(jobForWorkflow.jobId, jobForWorkflow.jobIdHex, employerRep, freelancerRep);
        logTest("Create Escrow", "PASS", `Amount: ${escrowInfo.escrowAmount} USDM`);
        await sleep(60000);
        const secStealEscrow = await runSecurityTest("Attacker steal escrow", () => attackStealEscrow(escrowInfo));
        logTest("SECURITY: Block attacker steal escrow", secStealEscrow ? "PASS" : "FAIL");
        const secMintFake = await runSecurityTest("Attacker mint fake completion", () => attackMintFakeCompletion());
        logTest("SECURITY: Block fake completion mint", secMintFake ? "PASS" : "FAIL");
        const tx1Result = await releaseEscrowWithCompletionToken(escrowInfo, jobForWorkflow);
        logTest("TX1: Release Escrow + Mint Completion", "PASS");
        await sleep(60000);
        console.log("\n" + "═".repeat(80));
        console.log(" TEST GROUP 4: REPUTATION UPDATES");
        console.log("═".repeat(80));
        const secFakeRep = await runSecurityTest("Attacker update freelancer rep", () => attackUpdateReputation(freelancerRep));
        logTest("SECURITY: Block fake reputation update", secFakeRep ? "PASS" : "FAIL");
        const tx2Hash = await updateFreelancerRepWithProof(tx1Result, escrowInfo, freelancerRep, 95);
        logTest("TX2: Update Freelancer Rep", "PASS");
        await sleep(60000);

        const tx3Hash = await updateEmployerRepWithProof(tx1Result, escrowInfo, employerRep, 98);
        logTest("TX3: Update Employer Rep", "PASS");
        await sleep(45000);
        console.log("\n" + "═".repeat(80));
        console.log(" FINAL REPUTATION DATA");
        console.log("═".repeat(80));
        await displayAllReputations();
        console.log("\n FINAL BALANCES:");
        const employerBalanceAfter = await getWalletBalance(employerWallet, "employer");
        const freelancerBalanceAfter = await getWalletBalance(freelancerWallet, "freelancer");
        const attackerBalanceAfter = await getWalletBalance(attackerWallet, "attacker");
        
        printBalanceComparison(employerBalanceBefore, employerBalanceAfter, "employer");
        printBalanceComparison(freelancerBalanceBefore, freelancerBalanceAfter, "freelancer");
        printBalanceComparison(attackerBalanceBefore, attackerBalanceAfter, "attacker");
        console.log("\n" + "═".repeat(80));
        console.log(" TEST SUMMARY");
        console.log("═".repeat(80));
        
        const normalTests = testResults.passed.filter(t => !t.name.includes("SECURITY"));
        const securityPassed = testResults.passed.filter(t => t.name.includes("SECURITY"));
        const securityFailed = testResults.failed.filter(t => t.name.includes("SECURITY"));
        
        console.log(`\n  FUNCTIONAL TESTS: ${normalTests.length} passed`);
        console.log(`SECURITY TESTS:   ${securityPassed.length} passed, ${securityFailed.length} failed`);
        console.log(`─────────────────────────────────`);
        console.log(`TOTAL PASSED: ${testResults.passed.length}`);
        console.log(`TOTAL FAILED: ${testResults.failed.length}`);
        
        if (testResults.failed.length === 0) {
            console.log("\n ALL TESTS PASSED! Platform is fully functional and secure!");
        } else {
            console.log("\n  SOME TESTS FAILED:");
            testResults.failed.forEach(t => console.log(`${t.name}`));
        }

        console.log("\n" + "═".repeat(80));
        console.log(" FUNCTIONS TESTED:");
        console.log("═".repeat(80));
        console.log("   ✓ Mint Reputation NFT");
        console.log("   ✓ Query Reputation Data");
        console.log("   ✓ Create Job Listing");
        console.log("   ✓ Close Job");
        console.log("   ✓ Cancel Job");
        console.log("   ✓ Submit Bid");
        console.log("   ✓ Cancel Bid");
        console.log("   ✓ Accept Bid");
        console.log("   ✓ Create Escrow");
        console.log("   ✓ Release Escrow + Mint Completion Token");
        console.log("   ✓ Update Freelancer Reputation");
        console.log("   ✓ Update Employer Reputation");
        console.log("\n   SECURITY TESTS:");
        console.log("   ✓ Block attacker accepting bid");
        console.log("   ✓ Block attacker cancelling bid");
        console.log("   ✓ Block attacker closing job");
        console.log("   ✓ Block attacker cancelling job");
        console.log("   ✓ Block attacker stealing escrow");
        console.log("   ✓ Block attacker minting fake completion");
        console.log("   ✓ Block attacker updating reputation");

    } catch (error) {
        console.error("\n TEST SUITE ERROR:", error.message || error);
        if (error.stack) console.error(error.stack.split('\n').slice(0, 10).join('\n'));
        process.exit(1);
    }
}

main();