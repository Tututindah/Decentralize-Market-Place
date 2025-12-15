

import {
  BlockfrostProvider,
  MeshTxBuilder,
  deserializeAddress,
  mConStr0,
  UTxO,
  serializePlutusScript,
} from '@meshsdk/core'
import { applyParamsToScript } from '@meshsdk/core-cst'
import plutusBlueprint from '@/plutus.json'

const BLOCKFROST_API_KEY = process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY || 'preprodHRP2qbfZXQbN1FOMOio2HzZ9VO0vZigh'
const NETWORK_ID = 0 
const USDM_POLICY_ID = 'f96672ded25c90551d210e883099110f613e0e65012d5b88b68c51d0'
const USDM_ASSET_NAME = '4d4f434b5f5553444d' // "MOCK_USDM" in hex

let _blockchainProvider: BlockfrostProvider | null = null

export function getBlockchainProvider(): BlockfrostProvider {
  if (!_blockchainProvider) {
    _blockchainProvider = new BlockfrostProvider(BLOCKFROST_API_KEY)
  }
  return _blockchainProvider
}
export function getScript(validatorTitle: string, params: string[] = [], version: 'V1' | 'V2' | 'V3' = 'V3') {
  const validator = plutusBlueprint.validators.find((v: any) => v.title === validatorTitle)
  if (!validator) {
    throw new Error(`Validator ${validatorTitle} not found in plutus.json`)
  }

  const scriptCbor = applyParamsToScript(validator.compiledCode, params)
  const scriptAddr = serializePlutusScript(
    { code: scriptCbor, version },
    undefined,
    NETWORK_ID
  ).address

  return { scriptCbor, scriptAddr, validator }
}

/**
 * Create transaction builder
 */
export function getTxBuilder() {
  const provider = getBlockchainProvider()
  return new MeshTxBuilder({
    fetcher: provider,
    submitter: provider,
  })
}

/**
 * Get UTxO by transaction hash
 */
export async function getUtxoByTxHash(txHash: string): Promise<UTxO> {
  const provider = getBlockchainProvider()
  const utxos = await provider.fetchUTxOs(txHash)
  if (utxos.length === 0) {
    throw new Error('UTxO not found')
  }
  return utxos[0]
}

/**
 * Get all UTxOs at a script address
 */
exconst provider = getBlockchainProvider()
  return await pcriptUtxos(scriptAddress: string): Promise<UTxO[]> {
  return await blockchainProvider.fetchAddressUTxOs(scriptAddress)
}

// ============================================
// JOB LISTING CONTRACTS
// ============================================

export interface JobListing {
  clientHash: string
  clientDid: string
  jobId: string
  title: string
  descriptionHash: string
  budgetMin: number
  budgetMax: number
  deadline: number
  isActive: boolean
  kycRequired: boolean
}

/**
 * Create a job listing on-chain
 */
export async function createJobListing(
  job: {
    title: string
    description: string
    budgetMin: number
    budgetMax: number
    deadline: Date
    kycRequired: boolean
  },
  walletAddress: string,
  walletUtxos: UTxO[],
  clientDid: string
): Promise<{ txHash: string; jobId: string; scriptAddr: string }> {
  const { scriptAddr } = getScript('job_listing.job_listing.spend')
  const clientHash = deserializeAddress(walletAddress).pubKeyHash

  const jobId = `JOB-${Date.now()}`
  const descriptionHash = await hashString(job.description)

  const datum = mConStr0([
    clientHash,
    stringToHex(clientDid),
    stringToHex(jobId),
    stringToHex(job.title),
    descriptionHash,
    job.budgetMin,
    job.budgetMax,
    job.deadline.getTime(),
    true, // is_active
    job.kycRequired,
  ])

  const txBuilder = getTxBuilder()
  await txBuilder
    .txOut(scriptAddr, [{ unit: 'lovelace', quantity: '2000000' }])
    .txOutInlineDatumValue(datum)
    .changeAddress(walletAddress)
    .selectUtxosFrom(walletUtxos)
    .complete()

  return { txHash: '', jobId, scriptAddr }
}

/**
 * Get all active job listings
 */
export async function getActiveJobs(): Promise<any[]> {
  const { scriptAddr } = getScript('job_listing.job_listing.spend')
  const utxos = await getScriptUtxos(scriptAddr)

  // Parse datum from each UTxO
  return utxos.map((utxo) => ({
    txHash: utxo.input.txHash,
    outputIndex: utxo.input.outputIndex,
    // TODO: Parse inline datum to extract job details
  }))
}

// ============================================
// ESCROW CONTRACTS
// ============================================

export interface EscrowData {
  clientHash: string
  clientDid: string
  freelancerHash: string
  freelancerDid: string
  arbiterHash: string
  usdmPolicy: string
  usdmName: string
  amount: number
  jobId: string
}

/**
 * Create escrow for a job
 */
export async function createEscrow(
  escrow: {
    clientAddress: string
    clientDid: string
    freelancerAddress: string
    freelancerDid: string
    arbiterAddress: string
    amount: number
    jobId: string
  },
  walletUtxos: UTxO[]
): Promise<{ txHash: string; scriptAddr: string }> {
  const { scriptAddr, scriptCbor } = getScript('freelance_escrow.freelance_escrow.spend')

  const clientHash = deserializeAddress(escrow.clientAddress).pubKeyHash
  const freelancerHash = deserializeAddress(escrow.freelancerAddress).pubKeyHash
  const arbiterHash = deserializeAddress(escrow.arbiterAddress).pubKeyHash

  const datum = mConStr0([
    clientHash,
    stringToHex(escrow.clientDid),
    freelancerHash,
    stringToHex(escrow.freelancerDid),
    arbiterHash,
    USDM_POLICY_ID,
    USDM_ASSET_NAME,
    escrow.amount,
    stringToHex(escrow.jobId),
  ])

  const assets = [
    { unit: 'lovelace', quantity: '5000000' },
    { unit: USDM_POLICY_ID + USDM_ASSET_NAME, quantity: escrow.amount.toString() },
  ]

  const txBuilder = getTxBuilder()
  await txBuilder
    .txOut(scriptAddr, assets)
    .txOutDatumHashValue(datum)
    .changeAddress(escrow.clientAddress)
    .selectUtxosFrom(walletUtxos)
    .complete()

  return { txHash: '', scriptAddr }
}

/**
 * Release escrow funds to freelancer (multi-sig)
 */
export async function releaseEscrow(
  escrowTxHash: string,
  escrowData: EscrowData,
  freelancerAddress: string,
  clientAddress: string,
  clientUtxos: UTxO[],
  clientCollateral: UTxO
): Promise<{ unsignedTx: string }> {
  const { scriptCbor } = getScript('freelance_escrow.freelance_escrow.spend')
  const scriptUtxo = await getUtxoByTxHash(escrowTxHash)

  const datum = mConStr0([
    escrowData.clientHash,
    stringToHex(escrowData.clientDid),
    escrowData.freelancerHash,
    stringToHex(escrowData.freelancerDid),
    escrowData.arbiterHash,
    escrowData.usdmPolicy,
    escrowData.usdmName,
    escrowData.amount,
    stringToHex(escrowData.jobId),
  ])

  const redeemer = mConStr0([]) // Release redeemer

  const txBuilder = getTxBuilder()
  await txBuilder
    .spendingPlutusScript('V3')
    .txIn(
      scriptUtxo.input.txHash,
      scriptUtxo.input.outputIndex,
      scriptUtxo.output.amount,
      scriptUtxo.output.address
    )
    .txInScript(scriptCbor)
    .txInRedeemerValue(redeemer)
    .txInDatumValue(datum)
    .requiredSignerHash(escrowData.clientHash)
    .requiredSignerHash(escrowData.freelancerHash)
    .txOut(freelancerAddress, scriptUtxo.output.amount)
    .changeAddress(clientAddress)
    .txInCollateral(
      clientCollateral.input.txHash,
      clientCollateral.input.outputIndex,
      clientCollateral.output.amount,
      clientCollateral.output.address
    )
    .selectUtxosFrom(clientUtxos)
    .complete()

  return { unsignedTx: txBuilder.txHex }
}

// ============================================
// REPUTATION CONTRACTS
// ============================================

export interface ReputationData {
  userHash: string
  did: string
  totalJobs: number
  completedJobs: number
  cancelledJobs: number
  disputeCount: number
  totalEarned: number
  totalPaid: number
  averageRating: number
  lastUpdated: number
}

/**
 * Mint initial reputation NFT for freelancer
 */
export async function mintReputation(
  freelancerAddress: string,
  freelancerDid: string,
  walletUtxos: UTxO[]
): Promise<{ txHash: string; scriptAddr: string }> {
  const { scriptAddr } = getScript('reputation_score.reputation_score.spend')
  const userHash = deserializeAddress(freelancerAddress).pubKeyHash

  const datum = mConStr0([
    userHash,
    stringToHex(freelancerDid),
    0, // total_jobs
    0, // completed_jobs
    0, // cancelled_jobs
    0, // dispute_count
    0, // total_earned
    0, // total_paid
    0, // average_rating
    Date.now(), // last_updated
  ])

  const txBuilder = getTxBuilder()
  await txBuilder
    .txOut(scriptAddr, [{ unit: 'lovelace', quantity: '2000000' }])
    .txOutInlineDatumValue(datum)
    .changeAddress(freelancerAddress)
    .selectUtxosFrom(walletUtxos)
    .complete()

  return { txHash: '', scriptAddr }
}

/**
 * Update reputation after job completion
 */
export async function updateReputation(
  reputationTxHash: string,
  currentReputation: ReputationData,
  update: {
    jobId: string
    rating: number
    amount: number
    completed: boolean
  },
  userAddress: string,
  userUtxos: UTxO[]
): Promise<{ unsignedTx: string }> {
  const { scriptCbor, scriptAddr } = getScript('reputation_score.reputation_score.spend')
  const scriptUtxo = await getUtxoByTxHash(reputationTxHash)

  const currentDatum = mConStr0([
    currentReputation.userHash,
    stringToHex(currentReputation.did),
    currentReputation.totalJobs,
    currentReputation.completedJobs,
    currentReputation.cancelledJobs,
    currentReputation.disputeCount,
    currentReputation.totalEarned,
    currentReputation.totalPaid,
    currentReputation.averageRating,
    currentReputation.lastUpdated,
  ])

  const updatedDatum = mConStr0([
    currentReputation.userHash,
    stringToHex(currentReputation.did),
    currentReputation.totalJobs + 1,
    update.completed ? currentReputation.completedJobs + 1 : currentReputation.completedJobs,
    !update.completed ? currentReputation.cancelledJobs + 1 : currentReputation.cancelledJobs,
    currentReputation.disputeCount,
    currentReputation.totalEarned + update.amount,
    currentReputation.totalPaid,
    update.rating, // New average (simplified)
    Date.now(),
  ])

  const redeemer = mConStr0([
    0, 
    [stringToHex(update.jobId), update.rating, update.amount, update.completed],
  ])

  const txBuilder = getTxBuilder()
  await txBuilder
    .spendingPlutusScript('V3')
    .txIn(
      scriptUtxo.input.txHash,
      scriptUtxo.input.outputIndex,
      scriptUtxo.output.amount,
      scriptUtxo.output.address
    )
    .txInScript(scriptCbor)
    .txInRedeemerValue(redeemer)
    .txInDatumValue(currentDatum)
    .txOut(scriptAddr, scriptUtxo.output.amount)
    .txOutInlineDatumValue(updatedDatum)
    .changeAddress(userAddress)
    .selectUtxosFrom(userUtxos)
    .complete()

  return { unsignedTx: txBuilder.txHex }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function stringToHex(str: string): string {
  return Buffer.from(str).toString('hex')
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function hexToString(hex: string): string {
  return Buffer.from(hex, 'hex').toString('utf8')
}
