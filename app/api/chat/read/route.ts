import { NextRequest, NextResponse } from 'next/server'
import { chatService } from '@/app/src/services/chat.service'

// POST /api/chat/read - Mark messages as read
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomId, userId } = body

    if (!roomId || !userId) {
      return NextResponse.json(
        { error: 'roomId and userId are required' },
        { status: 400 }
      )
    }

    await chatService.markMessagesAsRead(roomId, userId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error marking as read:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to mark as read' },
      { status: 500 }
    )
  }
}

