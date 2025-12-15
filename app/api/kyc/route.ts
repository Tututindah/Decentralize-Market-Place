import { NextRequest, NextResponse } from 'next/server'
import { kycService } from '@/services/kyc.service'

// POST /api/kyc/submit - Submit mock KYC
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress } = body

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress is required' },
        { status: 400 }
      )
    }

    const user = await kycService.submitMockKYC(walletAddress)
    return NextResponse.json({ user })
  } catch (error: any) {
    console.error('Error submitting KYC:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit KYC' },
      { status: 500 }
    )
  }
}

// GET /api/kyc/status?walletAddress=xxx
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const walletAddress = searchParams.get('walletAddress')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress is required' },
        { status: 400 }
      )
    }

    const status = await kycService.getKYCStatus(walletAddress)
    return NextResponse.json(status)
  } catch (error: any) {
    console.error('Error fetching KYC status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch KYC status' },
      { status: 500 }
    )
  }
}
