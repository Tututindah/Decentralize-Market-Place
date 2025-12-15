import { NextRequest, NextResponse } from 'next/server'
import { chatService } from '@/services/chat.service'

// POST /api/chat/read - Mark messages as read
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomId, userId, isParticipant1 } = body

    if (!roomId || !userId || isParticipant1 === undefined) {
      return NextResponse.json(
        { error: 'roomId, userId, and isParticipant1 are required' },
        { status: 400 }
      )
    }

    await chatService.markAsRead(roomId, userId, isParticipant1)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error marking as read:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to mark as read' },
      { status: 500 }
    )
  }
}
