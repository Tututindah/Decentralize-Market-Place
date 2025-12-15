import { BrowserWallet, Transaction, AssetMetadata } from '@meshsdk/core'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type User = Database['public']['Tables']['users']['Row']
type ReputationUpdate = Database['public']['Tables']['reputation_updates']['Insert']

/**
 * Reputation NFT Service - Creates and updates reputation as updatable NFTs on Cardano
 */
export const reputationService = {
  /**
   * Mint initial reputation NFT for a user
   */
  async mintReputationNFT(
    wallet: BrowserWallet,
    userId: string,
    walletAddress: string
  ): Promise<{ txHash: string; policyId: string; assetName: string }> {
    try {
      // Get user data
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (!user) throw new Error('User not found')

      // Create policy ID (in production, use proper minting policy)
      const policyId = await wallet.getChangeAddress() // Simplified
      const assetName = `REPUTATION_${walletAddress.slice(0, 8)}`

      // Build minting transaction
      const tx = new Transaction({ initiator: wallet })
      
      // Mint NFT with metadata
      const metadata: AssetMetadata = {
        name: `DecentGigs Reputation - ${user.username || 'User'}`,
        image: 'ipfs://QmReputation',
        mediaType: 'image/png',
        description: 'Reputation NFT for DecentGigs platform',
        attributes: {
          score: user.reputation_score.toString(),
          trust_score: user.trust_score.toString(),
          total_jobs: user.total_jobs.toString(),
          completed_jobs: user.completed_jobs.toString(),
          level: user.kyc_level.toString()
        }
      }

      tx.mintAsset(policyId, assetName, 1, metadata)

      const unsignedTx = await tx.build()
      const signedTx = await wallet.signTx(unsignedTx)
      const txHash = await wallet.submitTx(signedTx)

      // Update user with NFT info
      await supabase
        .from('users')
        .update({
          reputation_nft_policy_id: policyId,
          reputation_nft_asset_name: assetName,
          reputation_nft_tx_hash: txHash
        })
        .eq('id', userId)

      return { txHash, policyId, assetName }
    } catch (error) {
      console.error('Error minting reputation NFT:', error)
      throw error
    }
  },

  /**
   * Update reputation NFT metadata (burn old and mint new with updated data)
   */
  async updateReputationNFT(
    wallet: BrowserWallet,
    userId: string,
    newScore: number,
    jobId?: string,
    rating?: number
  ): Promise<{ txHash: string }> {
    try {
      // Get user with current NFT data
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !user) throw new Error('User not found')

      const previousScore = user.reputation_score

      // Update database first
      await supabase
        .from('users')
        .update({
          reputation_score: newScore,
          total_jobs: user.total_jobs + 1,
          completed_jobs: user.completed_jobs + 1
        })
        .eq('id', userId)

      // Build update transaction (burn old + mint new)
      const tx = new Transaction({ initiator: wallet })

      if (user.reputation_nft_policy_id && user.reputation_nft_asset_name) {
        // Burn old NFT
        tx.burnAsset(
          user.reputation_nft_policy_id,
          user.reputation_nft_asset_name,
          1
        )
      }

      // Mint new NFT with updated metadata
      const metadata: AssetMetadata = {
        name: `DecentGigs Reputation - ${user.username || 'User'}`,
        image: 'ipfs://QmReputation',
        mediaType: 'image/png',
        description: 'Updated Reputation NFT',
        attributes: {
          score: newScore.toString(),
          trust_score: user.trust_score.toString(),
          total_jobs: (user.total_jobs + 1).toString(),
          completed_jobs: (user.completed_jobs + 1).toString(),
          last_updated: new Date().toISOString()
        }
      }

      tx.mintAsset(
        user.reputation_nft_policy_id || '',
        user.reputation_nft_asset_name || '',
        1,
        metadata
      )

      const unsignedTx = await tx.build()
      const signedTx = await wallet.signTx(unsignedTx)
      const txHash = await wallet.submitTx(signedTx)

      // Record reputation update
      await supabase
        .from('reputation_updates')
        .insert({
          user_id: userId,
          tx_hash: txHash,
          job_id: jobId,
          rating,
          previous_score: previousScore,
          new_score: newScore,
          completed: true
        })

      // Update user's NFT tx hash
      await supabase
        .from('users')
        .update({
          reputation_nft_tx_hash: txHash
        })
        .eq('id', userId)

      return { txHash }
    } catch (error) {
      console.error('Error updating reputation NFT:', error)
      throw error
    }
  },

  /**
   * Calculate new reputation score based on job completion
   */
  calculateNewScore(
    currentScore: number,
    rating: number,
    jobAmount: number
  ): number {
    // Simple formula: current + (rating/100 * 10) + (amount weight)
    const ratingBonus = (rating / 100) * 10
    const amountBonus = Math.min(jobAmount / 10000, 5) // Cap at 5 points
    return Math.min(currentScore + ratingBonus + amountBonus, 100)
  },

  /**
   * Get reputation history for a user
   */
  async getReputationHistory(userId: string) {
    const { data, error } = await supabase
      .from('reputation_updates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Get top users by reputation
   */
  async getTopUsers(limit: number = 10): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('reputation_score', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }
}
