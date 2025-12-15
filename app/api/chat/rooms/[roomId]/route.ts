import { NextRequest, NextResponse } from 'next/server'
import { chatService } from '@/app/src/services/chat.service';

// GET /api/chat/rooms/[roomId] - Get room with participants
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params
    const room = await chatService.getRoomWithParticipants(roomId)
    
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ room })
  } catch (error: any) {
    console.error('Error fetching room:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch room' },
      { status: 500 }
    )
  }
}
