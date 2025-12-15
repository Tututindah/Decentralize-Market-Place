import { NextRequest, NextResponse } from 'next/server'
import { reputationService } from '@/app/src/services/reputation.service'

// GET /api/reputation/leaderboard?limit=10
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')

    const topUsers = await reputationService.getLeaderboard(limit)
    return NextResponse.json({ topUsers })
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}

