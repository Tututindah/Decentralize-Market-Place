import { NextRequest, NextResponse } from 'next/server'
import { userService } from '@/services/user.service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params

    // Auto-create profile if user doesn't exist
    const user = await userService.getOrCreateUser(address, 'FREELANCER')

    return NextResponse.json({
      id: user.id,
      walletAddress: user.wallet_address,
      did: user.did,
      role: user.role,
      kycStatus: user.kyc_status,
      kycSubmittedAt: user.kyc_submitted_at,
      kycApprovedAt: user.kyc_approved_at,
      kycLevel: user.kyc_level,
      reputation: user.reputation_score,
      trustScore: user.trust_score,
      totalJobs: user.total_jobs,
      completedJobs: user.completed_jobs,
      cancelledJobs: user.cancelled_jobs,
      disputeCount: user.dispute_count,
      username: user.username,
      email: user.email,
      bio: user.bio,
      skills: user.skills,
      avatarUrl: user.avatar_url,
      reputationNft: {
        policyId: user.reputation_nft_policy_id,
        assetName: user.reputation_nft_asset_name,
        txHash: user.reputation_nft_tx_hash,
        utxoRef: user.reputation_utxo_ref,
      },
    })
  } catch (error: any) {
    console.error('Error fetching user profile:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: error?.message || error?.toString() || 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}
