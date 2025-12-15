import { supabase } from '@/app/src/lib/supabase';
import { Database } from '@/app/src/lib/database.types';

type ChatRoom = Database['public']['Tables']['chat_rooms']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];
type MessageUpdate = Database['public']['Tables']['messages']['Update'];

export class ChatService {
  async getOrCreateRoom(jobId: string, employerId: string, freelancerId: string): Promise<ChatRoom> {
    // Check if room exists
    const { data: existingRoom, error: findError } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (existingRoom) {
      return existingRoom;
    }

    // Create new room
    const { data: newRoom, error: createError } = await supabase
      .from('chat_rooms')
      .insert({
        job_id: jobId,
        employer_id: employerId,
        freelancer_id: freelancerId,
      } as any)
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create chat room: ${createError.message}`);
    }

    return newRoom!;
  }

  async getRoomById(roomId: string): Promise<ChatRoom | null> {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get room: ${error.message}`);
    }

    return data;
  }

  async getRoomsByUser(userId: string): Promise<ChatRoom[]> {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .or(`employer_id.eq.${userId},freelancer_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get rooms: ${error.message}`);
    }

    return data || [];
  }

  async sendMessage(roomId: string, senderId: string, content: string): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        sender_id: senderId,
        content,
        read: false,
      } as any)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }

    return data!;
  }

  async getMessagesByRoom(roomId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get messages: ${error.message}`);
    }

    return data || [];
  }

  async markMessagesAsRead(roomId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('room_id', roomId)
      .neq('sender_id', userId)
      .eq('read', false);

    if (error) {
      throw new Error(`Failed to mark messages as read: ${error.message}`);
    }
  }

  async getUnreadCount(roomId: string, userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .neq('sender_id', userId)
      .eq('read', false);

    if (error) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }

    return count || 0;
  }

  // Subscribe to new messages in a room
  subscribeToRoom(roomId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();
  }

  // Delete message
  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }

  // Get room with participants
  async getRoomWithParticipants(roomId: string): Promise<ChatRoom | null> {
    // Just return the room for now - participants can be fetched separately if needed
    return this.getRoomById(roomId);
  }
}

export const chatService = new ChatService();
