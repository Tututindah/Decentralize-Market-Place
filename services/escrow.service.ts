import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Escrow = Database['public']['Tables']['escrows']['Row']

export const escrowService = {
  // Create escrow
  async createEscrow(
    txHash: string,
    jobId: string,
    bidId: string,
    employerId: string,
    employerDid: string,
    freelancerId: string,
    freelancerDid: string,
    amount: number,
    policyId: string,
    assetName: string,
    arbiterAddress: string,
    jobRef: string
  ): Promise<Escrow> {
    const { data, error } = await (supabase
      .from('escrows') as any)
      .insert({
        tx_hash: txHash,
        job_id: jobId,
        bid_id: bidId,
        employer_id: employerId,
        employer_did: employerDid,
        freelancer_id: freelancerId,
        freelancer_did: freelancerDid,
        arbiter_address: arbiterAddress,
        amount,
        currency: 'USDM',
        job_ref: jobRef,
        policy_id: policyId,
        asset_name: assetName,
        status: 'CREATED',
        required_signatures: 2,
        employer_signed: false,
        freelancer_signed: false,
        arbiter_signed: false
      })
      .select()
      .single()

    if (error) throw error
    return data!
  },

  async lockEscrow(escrowId: string, utxoRef: string, scriptAddress: string): Promise<Escrow> {
    const { data, error } = await (supabase
      .from('escrows') as any)
      .update({
        status: 'LOCKED',
        utxo_ref: utxoRef,
        script_address: scriptAddress,
        locked_at: new Date().toISOString()
      })
      .eq('id', escrowId)
      .select()
      .single()

    if (error) throw error
    return data!
  },

  // Sign escrow release (multi-sig)
  async signEscrowRelease(
    escrowId: string,
    signerRole: 'employer' | 'freelancer' | 'arbiter'
  ): Promise<Escrow> {
    const signField = `${signerRole}_signed`

    const { data, error } = await (supabase
      .from('escrows') as any)
      .update({ [signField]: true })
      .eq('id', escrowId)
      .select()
      .single()

    if (error) throw error
    return data!
  },

  // Release escrow funds
  async releaseEscrow(escrowId: string, txHash: string): Promise<Escrow> {
    const { data, error } = await (supabase
      .from('escrows') as any)
      .update({
        status: 'RELEASED',
        release_tx_hash: txHash,
        released_at: new Date().toISOString()
      })
      .eq('id', escrowId)
      .select()
      .single()

    if (error) throw error
    return data!
  },

  // Refund escrow
  async refundEscrow(escrowId: string, txHash: string): Promise<Escrow> {
    const { data, error } = await (supabase
      .from('escrows') as any)
      .update({
        status: 'REFUNDED',
        refund_tx_hash: txHash
      })
      .eq('id', escrowId)
      .select()
      .single()

    if (error) throw error
    return data!
  },

  // Get escrow by job ID
  async getEscrowByJobId(jobId: string): Promise<Escrow | null> {
    const { data, error } = await supabase
      .from('escrows')
      .select('*, jobs(*)')
      .eq('job_id', jobId)
      .single()

    if (error) return null
    return data as any
  },

  // Get escrow by bid ID
  async getEscrowByBidId(bidId: string): Promise<Escrow | null> {
    const { data, error } = await supabase
      .from('escrows')
      .select('*, jobs(*)')
      .eq('bid_id', bidId)
      .single()

    if (error) return null
    return data as any
  },

  // Get user escrows
  async getUserEscrows(userId: string): Promise<Escrow[]> {
    const { data, error } = await supabase
      .from('escrows')
      .select('*, jobs(*)')
      .or(`employer_id.eq.${userId},freelancer_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as any[]
  },

  // Mark escrow as disputed
  async disputeEscrow(escrowId: string): Promise<Escrow> {
    const { data, error } = await (supabase
      .from('escrows') as any)
      .update({
        status: 'DISPUTED',
        disputed_at: new Date().toISOString()
      })
      .eq('id', escrowId)
      .select()
      .single()

    if (error) throw error
    return data!
  },

  // Check if escrow can be released (has enough signatures)
  async canReleaseEscrow(escrowId: string): Promise<boolean> {
    const { data } = await supabase
      .from('escrows')
      .select('employer_signed, freelancer_signed, arbiter_signed, required_signatures')
      .eq('id', escrowId)
      .single()

    if (!data) return false

    const escrowData = data as any
    const signatureCount = [
      escrowData.employer_signed,
      escrowData.freelancer_signed,
      escrowData.arbiter_signed
    ].filter(Boolean).length

    return signatureCount >= escrowData.required_signatures
  }
}
