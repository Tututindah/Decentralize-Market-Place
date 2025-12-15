import { NextRequest, NextResponse } from 'next/server'
import { kycService } from '@/app/src/services/kyc.service'

// POST /api/kyc/submit - Submit KYC
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, fullName, email, documentType, documentNumber } = body

    if (!userId || !fullName) {
      return NextResponse.json(
        { error: 'userId and fullName are required' },
        { status: 400 }
      )
    }

    const result = await kycService.submitKYC({
      userId,
      fullName,
      email,
      documentType,
      documentNumber,
      verificationMethod: 'mock'
    })
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error submitting KYC:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit KYC' },
      { status: 500 }
    )
  }
}

// GET /api/kyc/status?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const details = await kycService.getKYCDetails(userId)
    return NextResponse.json(details)
  } catch (error: any) {
    console.error('Error fetching KYC status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch KYC status' },
      { status: 500 }
    )
  }
}

