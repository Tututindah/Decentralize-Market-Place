import { supabase } from '@/app/src/lib/supabase';
import { Database } from '@/app/src/lib/database.types';

type ReputationNFT = Database['public']['Tables']['reputation_nfts']['Row'];
type ReputationNFTInsert = Database['public']['Tables']['reputation_nfts']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

export interface ReputationScore {
  userId: string;
  totalScore: number;
  completedJobs: number;
  averageRating: number;
  onTimeDelivery: number;
}

export class ReputationService {
  // Mint initial reputation NFT
  async mintReputationNFT(userId: string, txHash?: string): Promise<ReputationNFT> {
    const nftData: any = {
      user_id: userId,
      policy_id: 'mock_policy_' + Date.now(),
      asset_name: 'TrustFlowReputation',
      metadata: {
        name: 'TrustFlow Reputation',
        description: 'Initial reputation NFT for TrustFlow platform',
        image: 'ipfs://QmTrustFlowLogo',
        attributes: {
          level: 1,
          score: 0,
          completedJobs: 0,
        },
      },
      mint_tx_hash: txHash || 'mock_tx_' + Date.now(),
    };

    const { data, error } = await supabase
      .from('reputation_nfts')
      .insert(nftData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mint reputation NFT: ${error.message}`);
    }

    return data!;
  }

  // Update reputation score
  async updateReputation(userId: string, scoreChange: number): Promise<void> {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('reputation_score')
      .eq('id', userId)
      .single();

    if (userError) {
      throw new Error(`Failed to get user: ${userError.message}`);
    }

    const currentScore = (user as any).reputation_score || 0;
    const newScore = Math.max(0, currentScore + scoreChange);

    const { error: updateError } = await supabase
      .from('users')
      .update({ reputation_score: newScore })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to update reputation: ${updateError.message}`);
    }
  }

  // Get reputation score and details
  async getReputation(userId: string): Promise<ReputationScore> {
    const { data: user, error } = await supabase
      .from('users')
      .select('reputation_score')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to get reputation: ${error.message}`);
    }

    // Get completed jobs count
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id', { count: 'exact' })
      .eq('freelancer_id', userId)
      .eq('status', 'completed');

    const completedJobs = jobs?.length || 0;

    return {
      userId,
      totalScore: user.reputation_score || 0,
      completedJobs,
      averageRating: 0, // TODO: Implement ratings table
      onTimeDelivery: 0, // TODO: Implement delivery tracking
    };
  }

  // Get leaderboard
  async getLeaderboard(limit: number = 10): Promise<any[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, wallet_address, name, reputation_score, role')
      .order('reputation_score', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get leaderboard: ${error.message}`);
    }

    return data || [];
  }

  // Award reputation for job completion
  async awardJobCompletion(userId: string, jobBudget: number): Promise<void> {
    // Award points based on job budget
    const points = Math.floor(jobBudget / 100); // 1 point per 100 ADA
    await this.updateReputation(userId, points);
  }

  // Penalize for disputes or poor performance
  async penalizeUser(userId: string, severity: 'minor' | 'moderate' | 'severe'): Promise<void> {
    const penalties = {
      minor: -5,
      moderate: -15,
      severe: -30,
    };
    await this.updateReputation(userId, penalties[severity]);
  }

  // Get reputation NFT for user
  async getReputationNFT(userId: string): Promise<ReputationNFT | null> {
    const { data, error } = await supabase
      .from('reputation_nfts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get reputation NFT: ${error.message}`);
    }

    return data;
  }
}

export const reputationService = new ReputationService();
