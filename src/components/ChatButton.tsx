import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { useChat } from '../contexts/ChatContext'
import ChatWindow from './ChatWindow'
import ChatList from './ChatList'
import './ChatButton.css'

interface ChatButtonProps {
  participantAddress?: string
  participantName?: string
}

export default function ChatButton({ participantAddress, participantName }: ChatButtonProps) {
  const { getOrCreateRoom, rooms } = useChat()
  const [showChat, setShowChat] = useState(false)
  const [showList, setShowList] = useState(false)
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)

  const totalUnread = Array.from(rooms.values()).reduce((sum, room) => sum + room.unreadCount, 0)

  const handleClick = () => {
    if (participantAddress && participantName) {
      // Open chat with specific participant
      const roomId = getOrCreateRoom(participantAddress, participantName)
      setActiveRoomId(roomId)
      setShowChat(true)
      setShowList(false)
    } else {
      // Show chat list
      setShowList(!showList)
      setShowChat(false)
    }
  }

  const handleSelectRoom = (roomId: string) => {
    setActiveRoomId(roomId)
    setShowChat(true)
    setShowList(false)
  }

  return (
    <>
      <button className="chat-fab" onClick={handleClick} title="Chat">
        <MessageCircle size={24} />
        {totalUnread > 0 && (
          <span className="chat-badge">{totalUnread > 9 ? '9+' : totalUnread}</span>
        )}
      </button>

      {showList && !showChat && (
        <ChatList onSelectRoom={handleSelectRoom} onClose={() => setShowList(false)} />
      )}

      {showChat && activeRoomId && (
        <ChatWindow
          roomId={activeRoomId}
          onClose={() => {
            setShowChat(false)
            setActiveRoomId(null)
          }}
          onMinimize={() => {
            setShowChat(false)
          }}
        />
      )}
    </>
  )
}
