import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']
type UserUpdate = Database['public']['Tables']['users']['Update']

export const userService = {
  // Get or create user by wallet address
  async getOrCreateUser(walletAddress: string, role: 'EMPLOYER' | 'FREELANCER' = 'FREELANCER'): Promise<User> {
    // Try to get existing user
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()

    // If user exists, return it
    if (existingUser) return existingUser

    // If error is not "no rows", throw it
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user:', fetchError)
      throw fetchError
    }

    // User doesn't exist, create new one
    const insertData: UserInsert = { 
      wallet_address: walletAddress, 
      role,
      kyc_status: 'NOT_SUBMITTED',
      kyc_level: 0,
      reputation_score: 0,
      trust_score: 0,
      total_jobs: 0,
      completed_jobs: 0,
      cancelled_jobs: 0,
      dispute_count: 0
    }

    const { data: newUser, error: createError } = await (supabase
      .from('users') as any)
      .insert(insertData)
      .select()
      .single()

    if (createError) {
      console.error('Error creating user:', createError)
      throw createError
    }
    return newUser!
  },

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) return null
    return data
  },

  // Get user by wallet address
  async getUserByAddress(walletAddress: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()

    if (error) return null
    return data
  },

  // Update user profile
  async updateProfile(userId: string, updates: UserUpdate): Promise<User> {
    const { data, error } = await (supabase
      .from('users') as any)
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data!
  },

  // Get users by role
  async getUsersByRole(role: 'EMPLOYER' | 'FREELANCER'): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .order('reputation_score', { ascending: false })

    if (error) throw error
    return data
  },

  // Get users with KYC approved
  async getKYCApprovedUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('kyc_status', 'APPROVED')

    if (error) throw error
    return data
  },

  // Update user stats after job completion
  async updateJobStats(userId: string, completed: boolean) {
    const { data: user } = await supabase
      .from('users')
      .select('total_jobs, completed_jobs, cancelled_jobs')
      .eq('id', userId)
      .single()

    if (user) {
      const userData = user as any
      await (supabase
        .from('users') as any)
        .update({
          total_jobs: userData.total_jobs + 1,
          completed_jobs: completed ? userData.completed_jobs + 1 : userData.completed_jobs,
          cancelled_jobs: !completed ? userData.cancelled_jobs + 1 : userData.cancelled_jobs
        })
        .eq('id', userId)
    }
  },

  // Update KYC status
  async updateKYCStatus(
    walletAddress: string,
    kycStatus: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED',
    did?: string
  ): Promise<User> {
    const updates: any = {
      kyc_status: kycStatus,
    }

    if (did) {
      updates.did = did
    }

    if (kycStatus === 'PENDING') {
      updates.kyc_submitted_at = new Date().toISOString()
    }

    if (kycStatus === 'APPROVED') {
      updates.kyc_approved_at = new Date().toISOString()
      updates.kyc_level = 1 // Basic KYC approved
    }

    const { data, error } = await (supabase
      .from('users') as any)
      .update(updates)
      .eq('wallet_address', walletAddress)
      .select()
      .single()

    if (error) throw error
    return data!
  },

  // Update reputation NFT details
  async updateReputationNFT(
    walletAddress: string,
    policyId: string,
    assetName: string,
    txHash: string,
    utxoRef: string
  ): Promise<User> {
    const { data, error } = await (supabase
      .from('users') as any)
      .update({
        reputation_nft_policy_id: policyId,
        reputation_nft_asset_name: assetName,
        reputation_nft_tx_hash: txHash,
        reputation_utxo_ref: utxoRef,
      })
      .eq('wallet_address', walletAddress)
      .select()
      .single()

    if (error) throw error
    return data!
  }
}
