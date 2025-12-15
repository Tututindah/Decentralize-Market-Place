import { NextRequest, NextResponse } from 'next/server'
import { chatService } from '@/app/src/services/chat.service'

// GET /api/chat/messages?roomId=xxx&limit=50
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const roomId = searchParams.get('roomId')

    if (!roomId) {
      return NextResponse.json(
        { error: 'roomId is required' },
        { status: 400 }
      )
    }

    const messages = await chatService.getMessagesByRoom(roomId)
    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/chat/messages - Send message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomId, senderId, content } = body

    if (!roomId || !senderId || !content) {
      return NextResponse.json(
        { error: 'roomId, senderId, and content are required' },
        { status: 400 }
      )
    }

    const message = await chatService.sendMessage(
      roomId,
      senderId,
      content
    )

    return NextResponse.json({ message })
  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    )
  }
}

