import { NextRequest, NextResponse } from 'next/server'
import { chatService } from '@/services/chat.service'

// GET /api/chat/messages?roomId=xxx&limit=50
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const roomId = searchParams.get('roomId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!roomId) {
      return NextResponse.json(
        { error: 'roomId is required' },
        { status: 400 }
      )
    }

    const messages = await chatService.getRoomMessages(roomId, limit)
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
    const { roomId, senderId, senderAddress, content, type = 'text' } = body

    if (!roomId || !senderId || !senderAddress || !content) {
      return NextResponse.json(
        { error: 'roomId, senderId, senderAddress, and content are required' },
        { status: 400 }
      )
    }

    const message = await chatService.sendMessage(
      roomId,
      senderId,
      senderAddress,
      content,
      type
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
