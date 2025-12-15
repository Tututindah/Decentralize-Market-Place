import { NextRequest, NextResponse } from 'next/server'
import { chatService } from '@/services/chat.service'

// GET /api/chat/rooms?userId=xxx
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

    const rooms = await chatService.getUserRooms(userId)
    return NextResponse.json({ rooms })
  } catch (error: any) {
    console.error('Error fetching chat rooms:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chat rooms' },
      { status: 500 }
    )
  }
}

// POST /api/chat/rooms - Create or get chat room
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user1Id, user2Id, jobId } = body

    if (!user1Id || !user2Id) {
      return NextResponse.json(
        { error: 'user1Id and user2Id are required' },
        { status: 400 }
      )
    }

    const room = await chatService.getOrCreateRoom(user1Id, user2Id, jobId)
    return NextResponse.json({ room })
  } catch (error: any) {
    console.error('Error creating chat room:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create chat room' },
      { status: 500 }
    )
  }
}
