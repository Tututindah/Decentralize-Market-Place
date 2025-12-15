import React, { useState, useEffect, useRef } from 'react'
import { useChat } from '../contexts/ChatContext'
import { useWallet } from '../contexts/WalletContext'
import { X, Send, Minimize2 } from 'lucide-react'
import './ChatWindow.css'

interface ChatWindowProps {
  roomId: string
  onClose: () => void
  onMinimize: () => void
}

export default function ChatWindow({ roomId, onClose, onMinimize }: ChatWindowProps) {
  const { rooms, sendMessage, markAsRead } = useChat()
  const { address } = useWallet()
  const [messageText, setMessageText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const room = rooms.get(roomId)

  useEffect(() => {
    markAsRead(roomId)
    scrollToBottom()
  }, [roomId, room?.messages.length])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim()) return

    sendMessage(roomId, messageText.trim())
    setMessageText('')
  }

  if (!room) return null

  const otherParticipant = room.participants.find(p => p !== address)
  const participantName = otherParticipant ? room.participantNames.get(otherParticipant) || 'Unknown' : 'Unknown'

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="participant-avatar">
            {participantName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="participant-name">{participantName}</h3>
            <p className="participant-address">{otherParticipant?.slice(0, 12)}...</p>
          </div>
        </div>
        <div className="chat-header-actions">
          <button onClick={onMinimize} className="chat-action-btn" title="Minimize">
            <Minimize2 size={18} />
          </button>
          <button onClick={onClose} className="chat-action-btn" title="Close">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {room.messages.length === 0 ? (
          <div className="chat-empty">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          room.messages.map((message) => (
            <div
              key={message.id}
              className={`chat-message ${message.senderId === address ? 'own-message' : 'other-message'}`}
            >
              <div className="message-bubble">
                {message.type === 'system' ? (
                  <p className="system-message">{message.text}</p>
                ) : (
                  <>
                    <p className="message-text">{message.text}</p>
                    <span className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-container" onSubmit={handleSend}>
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button 
          type="submit" 
          className="chat-send-btn"
          disabled={!messageText.trim()}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  )
}
