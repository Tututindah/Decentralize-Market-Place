import { NextRequest, NextResponse } from 'next/server'
import { userService } from '@/app/src/services/user.service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params

    // Auto-create profile if user doesn't exist
    const user = await userService.getOrCreateUser(address, 'freelancer')

    return NextResponse.json({
      id: user.id,
      walletAddress: user.wallet_address,
      role: user.role,
      reputation: user.reputation_score,
      email: user.email,
      bio: user.bio,
      skills: user.skills,
      name: user.name,
      kycVerified: user.kyc_verified,
      kycDid: user.kyc_did,
      reputationNftId: user.reputation_nft_id,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
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
