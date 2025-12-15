'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useWallet } from './WalletContext';

interface Message {
  id: string;
  roomId: string;
  content: string;
  senderAddress: string;
  senderName: string;
  timestamp: string;
}

interface ChatSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, message: string) => void;
  messages: Message[];
  currentRoom: string | null;
  typingUsers: Set<string>;
  startTyping: (roomId: string) => void;
  stopTyping: (roomId: string) => void;
}

const ChatSocketContext = createContext<ChatSocketContextType>({
  socket: null,
  isConnected: false,
  joinRoom: () => {},
  leaveRoom: () => {},
  sendMessage: () => {},
  messages: [],
  currentRoom: null,
  typingUsers: new Set(),
  startTyping: () => {},
  stopTyping: () => {},
});

export function ChatSocketProvider({ children }: { children: React.ReactNode }) {
  const { walletAddress, connected } = useWallet();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!connected || !walletAddress) return;

    // Connect to Socket.IO server
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket.IO connected');
      setIsConnected(true);

      // Register user
      newSocket.emit('user:join', {
        walletAddress,
        username: walletAddress.substring(0, 12) + '...',
      });
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
      setIsConnected(false);
    });

    // Listen for incoming messages
    newSocket.on('message:received', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for typing indicators
    newSocket.on('typing:user', ({ username, isTyping }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) {
          next.add(username);
        } else {
          next.delete(username);
        }
        return next;
      });
    });

    newSocket.on('room:user-joined', ({ user }) => {
      console.log(`👤 User joined: ${user.username}`);
    });

    newSocket.on('room:user-left', ({ user }) => {
      console.log(`👋 User left: ${user.username}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [connected, walletAddress]);

  const joinRoom = (roomId: string) => {
    if (!socket || !isConnected) return;

    socket.emit('room:join', {
      roomId,
      walletAddress,
      username: walletAddress?.substring(0, 12) + '...',
    });

    setCurrentRoom(roomId);
    setMessages([]); // Clear messages when switching rooms
  };

  const leaveRoom = (roomId: string) => {
    if (!socket || !isConnected) return;

    socket.emit('room:leave', { roomId });
    setCurrentRoom(null);
  };

  const sendMessage = (roomId: string, message: string) => {
    if (!socket || !isConnected || !walletAddress) return;

    socket.emit('message:send', {
      roomId,
      message,
      senderAddress: walletAddress,
      senderName: walletAddress.substring(0, 12) + '...',
    });
  };

  const startTyping = (roomId: string) => {
    if (!socket || !isConnected) return;
    socket.emit('typing:start', { roomId, username: walletAddress?.substring(0, 12) + '...' });
  };

  const stopTyping = (roomId: string) => {
    if (!socket || !isConnected) return;
    socket.emit('typing:stop', { roomId, username: walletAddress?.substring(0, 12) + '...' });
  };

  return (
    <ChatSocketContext.Provider
      value={{
        socket,
        isConnected,
        joinRoom,
        leaveRoom,
        sendMessage,
        messages,
        currentRoom,
        typingUsers,
        startTyping,
        stopTyping,
      }}
    >
      {children}
    </ChatSocketContext.Provider>
  );
}

export const useChatSocket = () => useContext(ChatSocketContext);
