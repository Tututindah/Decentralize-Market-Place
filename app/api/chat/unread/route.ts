import { NextRequest, NextResponse } from 'next/server'
import { chatService } from '@/app/src/services/chat.service'

// GET /api/chat/unread?roomId=xxx&userId=xxx
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const roomId = searchParams.get('roomId')
    const userId = searchParams.get('userId')

    if (!roomId || !userId) {
      return NextResponse.json(
        { error: 'roomId and userId are required' },
        { status: 400 }
      )
    }

    const unreadCount = await chatService.getUnreadCount(roomId, userId)
    return NextResponse.json({ unreadCount })
  } catch (error: any) {
    console.error('Error fetching unread count:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch unread count' },
      { status: 500 }
    )
  }
}

