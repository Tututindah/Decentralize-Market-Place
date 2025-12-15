import { NextRequest, NextResponse } from 'next/server'
import { chatService } from '@/app/src/services/chat.service';

// DELETE /api/chat/messages/[messageId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params
    await chatService.deleteMessage(messageId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting message:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete message' },
      { status: 500 }
    )
  }
}
