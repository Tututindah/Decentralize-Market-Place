import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import SimplePeer from 'simple-peer'
import { useWallet } from './WalletContext'

interface Message {
  id: string
  senderId: string
  senderName: string
  text: string
  timestamp: Date
  type: 'text' | 'system'
}

interface ChatRoom {
  id: string
  participants: string[]
  participantNames: Map<string, string>
  messages: Message[]
  lastMessage?: Message
  unreadCount: number
}

interface ChatContextType {
  socket: Socket | null
  connected: boolean
  rooms: Map<string, ChatRoom>
  activeRoomId: string | null
  setActiveRoom: (roomId: string) => void
  sendMessage: (roomId: string, text: string) => void
  createRoom: (participantAddress: string, participantName: string) => string
  getOrCreateRoom: (participantAddress: string, participantName: string) => string
  markAsRead: (roomId: string) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

export function ChatProvider({ children }: { children: ReactNode }) {
  const { address, connected: walletConnected } = useWallet()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [rooms, setRooms] = useState<Map<string, ChatRoom>>(new Map())
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const peersRef = useRef<Map<string, SimplePeer.Instance>>(new Map())

  // Initialize socket connection
  useEffect(() => {
    if (!address || !walletConnected) return

    console.log('🔌 Connecting to chat server...')
    const newSocket = io(SOCKET_URL, {
      query: { address },
      transports: ['websocket', 'polling'],
    })

    newSocket.on('connect', () => {
      console.log('✅ Connected to chat server')
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from chat server')
      setConnected(false)
    })

    // Handle incoming WebRTC signals
    newSocket.on('signal', ({ from, signal }: { from: string; signal: SimplePeer.SignalData }) => {
      console.log('📡 Received signal from:', from)
      handleSignal(from, signal)
    })

    // Handle new peer connection
    newSocket.on('user-joined', ({ userId }: { userId: string }) => {
      console.log('👋 User joined:', userId)
      createPeer(userId, true)
    })

    // Handle peer leaving
    newSocket.on('user-left', ({ userId }: { userId: string }) => {
      console.log('👋 User left:', userId)
      const peer = peersRef.current.get(userId)
      if (peer) {
        peer.destroy()
        peersRef.current.delete(userId)
      }
    })

    // Handle incoming messages through socket (fallback)
    newSocket.on('message', ({ roomId, message }: { roomId: string; message: Message }) => {
      handleIncomingMessage(roomId, message)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
      // Clean up all peer connections
      peersRef.current.forEach(peer => peer.destroy())
      peersRef.current.clear()
    }
  }, [address, walletConnected])

  const createPeer = (userId: string, initiator: boolean) => {
    if (!socket) return

    const peer = new SimplePeer({
      initiator,
      trickle: false,
    })

    peer.on('signal', (signal) => {
      socket.emit('signal', { to: userId, signal })
    })

    peer.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString())
        handleIncomingMessage(message.roomId, message)
      } catch (error) {
        console.error('Error parsing peer message:', error)
      }
    })

    peer.on('error', (err) => {
      console.error('Peer error:', err)
    })

    peersRef.current.set(userId, peer)
    return peer
  }

  const handleSignal = (from: string, signal: SimplePeer.SignalData) => {
    let peer = peersRef.current.get(from)
    
    if (!peer) {
      peer = createPeer(from, false)
    }

    if (peer) {
      peer.signal(signal)
    }
  }

  const handleIncomingMessage = (roomId: string, message: Message) => {
    setRooms((prevRooms) => {
      const newRooms = new Map(prevRooms)
      const room = newRooms.get(roomId)
      
      if (room) {
        room.messages.push(message)
        room.lastMessage = message
        if (activeRoomId !== roomId) {
          room.unreadCount++
        }
        newRooms.set(roomId, { ...room })
      }
      
      return newRooms
    })
  }

  const createRoom = (participantAddress: string, participantName: string): string => {
    const roomId = [address, participantAddress].sort().join('_')
    
    setRooms((prevRooms) => {
      if (prevRooms.has(roomId)) return prevRooms
      
      const newRooms = new Map(prevRooms)
      const participantNames = new Map<string, string>()
      participantNames.set(participantAddress, participantName)
      
      newRooms.set(roomId, {
        id: roomId,
        participants: [address!, participantAddress],
        participantNames,
        messages: [],
        unreadCount: 0,
      })
      
      return newRooms
    })
    
    return roomId
  }

  const getOrCreateRoom = (participantAddress: string, participantName: string): string => {
    const roomId = [address, participantAddress].sort().join('_')
    
    if (!rooms.has(roomId)) {
      return createRoom(participantAddress, participantName)
    }
    
    return roomId
  }

  const sendMessage = (roomId: string, text: string) => {
    if (!socket || !address) return

    const message: Message = {
      id: `${Date.now()}_${Math.random()}`,
      senderId: address,
      senderName: 'You',
      text,
      timestamp: new Date(),
      type: 'text',
    }

    // Try to send via WebRTC first
    const room = rooms.get(roomId)
    if (room) {
      const otherParticipant = room.participants.find(p => p !== address)
      const peer = otherParticipant ? peersRef.current.get(otherParticipant) : null
      
      if (peer && peer.connected) {
        peer.send(JSON.stringify({ roomId, ...message }))
      } else {
        // Fallback to socket
        socket.emit('message', { roomId, message })
      }
    }

    // Update local state
    handleIncomingMessage(roomId, message)
  }

  const markAsRead = (roomId: string) => {
    setRooms((prevRooms) => {
      const newRooms = new Map(prevRooms)
      const room = newRooms.get(roomId)
      
      if (room) {
        room.unreadCount = 0
        newRooms.set(roomId, { ...room })
      }
      
      return newRooms
    })
  }

  const setActiveRoom = (roomId: string) => {
    setActiveRoomId(roomId)
    markAsRead(roomId)
  }

  return (
    <ChatContext.Provider
      value={{
        socket,
        connected,
        rooms,
        activeRoomId,
        setActiveRoom,
        sendMessage,
        createRoom,
        getOrCreateRoom,
        markAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
