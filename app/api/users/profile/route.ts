import { NextRequest, NextResponse } from 'next/server'
import { userService } from '@/services/user.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, role } = body

    if (!walletAddress || !role) {
      return NextResponse.json(
        { error: 'Wallet address and role are required' },
        { status: 400 }
      )
    }

    if (role !== 'EMPLOYER' && role !== 'FREELANCER') {
      return NextResponse.json(
        { error: 'Role must be either EMPLOYER or FREELANCER' },
        { status: 400 }
      )
    }

    const user = await userService.getOrCreateUser(walletAddress, role)

    return NextResponse.json({
      id: user.id,
      walletAddress: user.wallet_address,
      role: user.role,
      kycStatus: user.kyc_status,
      reputation: user.reputation_score,
      trustScore: user.trust_score,
      totalJobs: user.total_jobs,
      completedJobs: user.completed_jobs,
    })
  } catch (error: any) {
    console.error('Error creating user profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create user profile' },
      { status: 500 }
    )
  }
}
