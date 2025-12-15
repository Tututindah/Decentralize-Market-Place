import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { RealtimeChannel } from '@supabase/supabase-js'

type ChatRoom = Database['public']['Tables']['chat_rooms']['Row']
type Message = Database['public']['Tables']['messages']['Row']

/**
 * Chat Service using Supabase Realtime
 * No separate backend needed - all handled in Next.js
 */
export const chatService = {
  /**
   * Create or get existing chat room between two users
   */
  async getOrCreateRoom(
    user1Id: string,
    user2Id: string,
    jobId?: string
  ): Promise<ChatRoom> {
    // Generate consistent room ID
    const roomId = [user1Id, user2Id].sort().join('_')

    // Check if room exists
    const { data: existingRoom } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('room_id', roomId)
      .single()

    if (existingRoom) return existingRoom

    // Create new room
    const { data: newRoom, error } = await (supabase
      .from('chat_rooms') as any)
      .insert({
        room_id: roomId,
        participant1_id: user1Id,
        participant2_id: user2Id,
        job_id: jobId
      })
      .select()
      .single()

    if (error) throw error
    return newRoom!
  },

  /**
   * Get all chat rooms for a user
   */
  async getUserRooms(userId: string): Promise<ChatRoom[]> {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Get messages for a room
   */
  async getRoomMessages(roomId: string, limit: number = 50): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  /**
   * Send a message
   */
  async sendMessage(
    roomId: string,
    senderId: string,
    senderAddress: string,
    content: string,
    messageType: 'text' | 'system' | 'file' = 'text'
  ): Promise<Message> {
    const { data, error } = await (supabase
      .from('messages') as any)
      .insert({
        room_id: roomId,
        sender_id: senderId,
        sender_address: senderAddress,
        content,
        message_type: messageType
      })
      .select()
      .single()

    if (error) throw error

    // Update room's last_message_at
    await (supabase
      .from('chat_rooms') as any)
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', roomId)

    return data!
  },

  /**
   * Subscribe to real-time messages for a room
   */
  subscribeToRoom(
    roomId: string,
    onMessage: (message: Message) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          onMessage(payload.new as Message)
        }
      )
      .subscribe()

    return channel
  },

  /**
   * Unsubscribe from a room
   */
  unsubscribeFromRoom(channel: RealtimeChannel) {
    supabase.removeChannel(channel)
  },

  /**
   * Mark messages as read
   */
  async markAsRead(roomId: string, userId: string, isParticipant1: boolean) {
    const updateField = isParticipant1 ? 'read_by_participant1' : 'read_by_participant2'

    await (supabase
      .from('messages') as any)
      .update({ [updateField]: true })
      .eq('room_id', roomId)
      .neq('sender_id', userId)
      .eq(updateField, false)
  },

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    // Get all rooms for user
    const rooms = await this.getUserRooms(userId)
    
    let unreadCount = 0
    for (const room of rooms) {
      const isParticipant1 = room.participant1_id === userId
      const readField = isParticipant1 ? 'read_by_participant1' : 'read_by_participant2'

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id)
        .neq('sender_id', userId)
        .eq(readField, false)

      unreadCount += count || 0
    }

    return unreadCount
  },

  /**
   * Delete a message (soft delete by updating content)
   */
  async deleteMessage(messageId: string) {
    const { error } = await (supabase
      .from('messages') as any)
      .update({ content: '[Message deleted]' })
      .eq('id', messageId)

    if (error) throw error
  },

  /**
   * Get chat room with participant details
   */
  async getRoomWithParticipants(roomId: string) {
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (roomError) throw roomError
    if (!room) throw new Error('Room not found')

    // Get participant details
    const { data: participant1 } = await supabase
      .from('users')
      .select('id, wallet_address, username, avatar_url, reputation_score')
      .eq('id', (room as any).participant1_id)
      .single()

    const { data: participant2 } = await supabase
      .from('users')
      .select('id, wallet_address, username, avatar_url, reputation_score')
      .eq('id', (room as any).participant2_id)
      .single()

    return {
      ...(room as any),
      participant1,
      participant2
    }
  }
}
