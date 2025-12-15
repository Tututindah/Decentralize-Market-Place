import { NextRequest, NextResponse } from 'next/server'
import { userService } from '@/app/src/services/user.service';
import { kycService } from '@/app/src/services/kyc.service';

export async function POST(
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
      kycStatus === 'APPROVED'
    )

    // If KYC approved, attempt to mint reputation NFT on-chain (optional)
    let nftResult = null
    if (kycStatus === 'APPROVED') {
      try {
        nftResult = await kycService.mintReputationNFT(
          user.id,
          did || user.wallet_address
        )

        // Update user with NFT ID
        if (nftResult && nftResult.nftId) {
          await userService.updateReputationNFT(user.id, nftResult.nftId)
        }
      } catch (nftError: any) {
        console.error('Error minting reputation NFT:', nftError)
        // Continue even if NFT minting fails
      }
    }

    return NextResponse.json({
      success: true,
      user,
      nft: nftResult
    })
  } catch (error: any) {
    console.error('KYC update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update KYC status' },
      { status: 500 }
    )
  }
}

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
      kycStatus === 'APPROVED'
    )

    // If KYC approved, attempt to mint reputation NFT on-chain (optional)
    let nftResult = null
    if (kycStatus === 'APPROVED') {
      try {
        nftResult = await kycService.mintReputationNFT(
          user.id,
          did || user.wallet_address
        )

        // Update user with NFT ID
        if (nftResult && nftResult.nftId) {
          await userService.updateReputationNFT(user.id, nftResult.nftId)
        }
      } catch (nftError: any) {
        console.error('Error minting reputation NFT:', nftError)
        // Continue even if NFT minting fails
      }
    }

    return NextResponse.json({
      success: true,
      kyc_verified: user.kyc_verified,
      user: {
        id: user.id,
        wallet_address: user.wallet_address,
        role: user.role,
        kyc_verified: user.kyc_verified,
      },
      reputationNft: nftResult,
    })
  } catch (error: any) {
    console.error('Error updating KYC status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update KYC status' },
      { status: 500 }
    )
  }
}
