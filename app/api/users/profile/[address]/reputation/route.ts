import { NextRequest, NextResponse } from 'next/server'
import { userService } from '@/app/src/services/user.service';
import { reputationService } from '@/app/src/services/reputation.service'

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
      trustScore: user.reputation_score, // Using reputation_score as trust score for now
      totalJobs: 0, // These fields need to be calculated from jobs table
      completedJobs: 0,
      cancelledJobs: 0,
      disputeCount: 0,
      reputationNft: user.reputation_nft_id ? {
        nftId: user.reputation_nft_id,
      } : null,
    })
  } catch (error: any) {
    console.error('Error fetching reputation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reputation' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params
    const body = await request.json()
    const { policyId, assetName, txHash, utxoRef } = body

    if (!policyId || !assetName || !txHash) {
      return NextResponse.json(
        { error: 'Missing required fields: policyId, assetName, txHash' },
        { status: 400 }
      )
    }

    // Get user by wallet address
    const user = await userService.getUserByAddress(address)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user with reputation NFT details
    const updatedUser = await userService.updateProfile(user.id, {
      reputation_nft_policy_id: policyId,
      reputation_nft_asset_name: assetName,
      reputation_nft_tx_hash: txHash,
      reputation_utxo_ref: utxoRef || null,
    })

    // Create reputation NFT record
    try {
      await reputationService.mintReputationNFT(user.id, txHash)
    } catch (nftError) {
      console.error('Error creating NFT record:', nftError)
      // Continue even if NFT record creation fails
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      nft: {
        policyId,
        assetName,
        txHash,
        utxoRef
      }
    })
  } catch (error: any) {
    console.error('Reputation NFT update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update reputation NFT' },
      { status: 500 }
    )
  }
}
