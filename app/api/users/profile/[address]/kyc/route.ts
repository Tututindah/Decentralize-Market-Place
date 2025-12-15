import { NextRequest, NextResponse } from 'next/server'
import { userService } from '@/services/user.service'
import { kycService } from '@/services/kyc.service'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params
    const body = await request.json()
    const { kycStatus, did } = body

    if (!kycStatus) {
      return NextResponse.json(
        { error: 'KYC status is required' },
        { status: 400 }
      )
    }

    const validStatuses = ['NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED']
    if (!validStatuses.includes(kycStatus)) {
      return NextResponse.json(
        { error: 'Invalid KYC status' },
        { status: 400 }
      )
    }

    // Update KYC status in database
    const user = await userService.updateKYCStatus(
      address,
      kycStatus,
      did
    )

    // If KYC approved, mint reputation NFT on-chain
    if (kycStatus === 'APPROVED' && !user.reputation_nft_tx_hash) {
      try {
        const nftResult = await kycService.mintReputationNFT(
          address,
          user.id,
          did || ''
        )

        // Update user with NFT details
        await userService.updateReputationNFT(
          address,
          nftResult.policyId,
          nftResult.assetName,
          nftResult.txHash,
          nftResult.utxoRef
        )

        return NextResponse.json({
          kycStatus: user.kyc_status,
          kycSubmittedAt: user.kyc_submitted_at,
          kycApprovedAt: user.kyc_approved_at,
          did: user.did,
          reputationNft: nftResult,
        })
      } catch (nftError: any) {
        console.error('Error minting reputation NFT:', nftError)
        // Return success for KYC update even if NFT minting fails
        return NextResponse.json({
          kycStatus: user.kyc_status,
          kycSubmittedAt: user.kyc_submitted_at,
          kycApprovedAt: user.kyc_approved_at,
          did: user.did,
          nftError: nftError.message,
        })
      }
    }

    return NextResponse.json({
      kycStatus: user.kyc_status,
      kycSubmittedAt: user.kyc_submitted_at,
      kycApprovedAt: user.kyc_approved_at,
      did: user.did,
    })
  } catch (error: any) {
    console.error('Error updating KYC status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update KYC status' },
      { status: 500 }
    )
  }
}
