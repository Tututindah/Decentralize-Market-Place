import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Bid = Database['public']['Tables']['bids']['Row']
type BidInsert = Database['public']['Tables']['bids']['Insert']

export const proposalService = {
  // Submit a bid (proposal)
  async submitProposal(
    jobId: string,
    freelancerId: string,
    freelancerDid: string,
    proposalData: {
      amount: number
      proposal: string
      delivery_time: number
      milestones?: any
    }
  ): Promise<Bid> {
    const { data, error } = await supabase
      .from('bids')
      .insert({
        job_id: jobId,
        freelancer_id: freelancerId,
        freelancer_did: freelancerDid,
        amount: proposalData.amount,
        currency: 'USDM',
        proposal: proposalData.proposal,
        delivery_time: proposalData.delivery_time,
        milestones: proposalData.milestones,
        status: 'PENDING'
      })
      .select()
      .single()

    if (error) throw error
    return data!
  },

  // Update bid with blockchain tx hash
  async updateProposalBlockchainTx(bidId: string, txHash: string): Promise<Bid> {
    const { data, error } = await supabase
      .from('bids')
      .update({ tx_hash: txHash })
      .eq('id', bidId)
      .select()
      .single()

    if (error) throw error
    return data!
  },

  // Get bids for a job
  async getJobProposals(jobId: string): Promise<Bid[]> {
    const { data, error } = await supabase
      .from('bids')
      .select('*, users!bids_freelancer_id_fkey(wallet_address, username, reputation_score, avatar_url)')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as any[]
  },

  // Get freelancer's bids
  async getFreelancerProposals(freelancerId: string): Promise<Bid[]> {
    const { data, error } = await supabase
      .from('bids')
      .select('*, jobs(*)')
      .eq('freelancer_id', freelancerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as any[]
  },

  // Accept bid
  async acceptProposal(bidId: string): Promise<Bid> {
    const { data, error } = await supabase
      .from('bids')
      .update({ 
        status: 'ACCEPTED',
        accepted_at: new Date().toISOString()
      })
      .eq('id', bidId)
      .select()
      .single()

    if (error) throw error
    return data!
  },

  // Reject bid
  async rejectProposal(bidId: string): Promise<Bid> {
    const { data, error } = await supabase
      .from('bids')
      .update({ 
        status: 'REJECTED',
        rejected_at: new Date().toISOString()
      })
      .eq('id', bidId)
      .select()
      .single()

    if (error) throw error
    return data!
  },

  // Withdraw bid
  async withdrawProposal(bidId: string): Promise<Bid> {
    const { data, error } = await supabase
      .from('bids')
      .update({ status: 'WITHDRAWN' })
      .eq('id', bidId)
      .select()
      .single()

    if (error) throw error
    return data!
  },

  // Get bid by ID
  async getProposalById(bidId: string): Promise<Bid | null> {
    const { data, error } = await supabase
      .from('bids')
      .select('*, jobs(*), users!bids_freelancer_id_fkey(*)')
      .eq('id', bidId)
      .single()

    if (error) return null
    return data as any
  }
}
