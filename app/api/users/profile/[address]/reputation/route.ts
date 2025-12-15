import { NextRequest, NextResponse } from 'next/server'
import { userService } from '@/services/user.service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params

    const user = await userService.getUserByAddress(address)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      reputation: user.reputation_score,
      trustScore: user.trust_score,
      totalJobs: user.total_jobs,
      completedJobs: user.completed_jobs,
      cancelledJobs: user.cancelled_jobs,
      disputeCount: user.dispute_count,
      reputationNft: {
        policyId: user.reputation_nft_policy_id,
        assetName: user.reputation_nft_asset_name,
        txHash: user.reputation_nft_tx_hash,
        utxoRef: user.reputation_utxo_ref,
      },
    })
  } catch (error: any) {
    console.error('Error fetching reputation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reputation' },
      { status: 500 }
    )
  }
}
