import { useChat } from '../contexts/ChatContext'
import { useWallet } from '../contexts/WalletContext'
import { X, MessageCircle } from 'lucide-react'
import './ChatList.css'

interface ChatListProps {
  onSelectRoom: (roomId: string) => void
  onClose: () => void
}

export default function ChatList({ onSelectRoom, onClose }: ChatListProps) {
  const { rooms } = useChat()
  const { address } = useWallet()

  const sortedRooms = Array.from(rooms.values()).sort((a, b) => {
    const aTime = a.lastMessage?.timestamp || new Date(0)
    const bTime = b.lastMessage?.timestamp || new Date(0)
    return bTime.getTime() - aTime.getTime()
  })

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h3>Messages</h3>
        <button onClick={onClose} className="chat-list-close">
          <X size={20} />
        </button>
      </div>

      <div className="chat-list-content">
        {sortedRooms.length === 0 ? (
          <div className="chat-list-empty">
            <MessageCircle size={48} />
            <p>No conversations yet</p>
            <span>Start chatting from job pages</span>
          </div>
        ) : (
          sortedRooms.map((room) => {
            const otherParticipant = room.participants.find(p => p !== address)
            const participantName = otherParticipant 
              ? room.participantNames.get(otherParticipant) || 'Unknown' 
              : 'Unknown'

            return (
              <div
                key={room.id}
                className="chat-list-item"
                onClick={() => onSelectRoom(room.id)}
              >
                <div className="chat-list-avatar">
                  {participantName.charAt(0).toUpperCase()}
                </div>
                <div className="chat-list-info">
                  <div className="chat-list-top">
                    <span className="chat-list-name">{participantName}</span>
                    {room.lastMessage && (
                      <span className="chat-list-time">
                        {new Date(room.lastMessage.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    )}
                  </div>
                  <div className="chat-list-bottom">
                    <p className="chat-list-message">
                      {room.lastMessage?.text || 'No messages yet'}
                    </p>
                    {room.unreadCount > 0 && (
                      <span className="chat-list-unread">{room.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
