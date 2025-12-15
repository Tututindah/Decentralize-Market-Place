import { NextRequest, NextResponse } from 'next/server'
import { reputationService } from '@/services/reputation.service'

// GET /api/reputation?userId=xxx
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

    const history = await reputationService.getReputationHistory(userId)
    return NextResponse.json({ history })
  } catch (error: any) {
    console.error('Error fetching reputation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reputation' },
      { status: 500 }
    )
  }
}
