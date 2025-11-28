import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Send, Hash, X } from 'lucide-react';
import { Input } from './ui/input';

// --- Type Definitions for Job and Ledger ---
// Note: Job interface is included here for self-containment, assuming it's imported in a real app.
export interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: 'open' | 'in-progress' | 'completed';
  employer: string;
  freelancer?: string;
  bids?: number;
}

interface MessageBlock {
  index: number;
  timestamp: string;
  senderId: string;
  recipientId: string;
  text: string;
  prevHash: string;
  hash: string;
}

interface P2PChatProps {
  job: Job;
  isDarkMode: boolean;
  onClose: () => void;
  // This is a modal-like component, so it doesn't need AppHeader/Footer
}

// --- Global Variables (Simulated Authentication/User IDs) ---
const APP_PREFIX = "FREELANCE_CHAT_LEDGER";
// Utility to get a consistent user ID for the browser instance
const generateUserId = (): string => {
  let id = localStorage.getItem('localUserId');
  if (!id) {
    id = `user_${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem('localUserId', id);
  }
  return id;
};

// Simulated Current User (For context of who is sending the message)
const CURRENT_USER_ID = generateUserId();

// Simulated Chat Ledger Storage
const loadLedger = (jobId: string): MessageBlock[] => {
  try {
    const data = localStorage.getItem(`${APP_PREFIX}_${jobId}`);
    return data ? JSON.parse(data) : [
      {
        index: 0,
        timestamp: new Date().toISOString(),
        senderId: 'SYSTEM',
        recipientId: CURRENT_USER_ID,
        text: `Chat ledger for job initialized. All messages are encrypted and logged on-chain.`,
        prevHash: '0',
        hash: 'genesis-block-00000000',
      }
    ];
  } catch (e) {
    console.error("Error loading ledger:", e);
    return [];
  }
};

const saveLedger = (jobId: string, ledger: MessageBlock[]) => {
  localStorage.setItem(`${APP_PREFIX}_${jobId}`, JSON.stringify(ledger));
};

// Utility to create a simple hash
const calculateHash = (block: Omit<MessageBlock, 'hash'>): string => {
  const data = JSON.stringify(block);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `hash-${Math.abs(hash).toString(16)}`;
};

export function P2PChat({ job, isDarkMode, onClose }: P2PChatProps) {
  const [ledger, setLedger] = useState<MessageBlock[]>(() => loadLedger(job.id));
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine the recipient (the other party in the contract)
  const recipientId = job.employer === CURRENT_USER_ID ? job.freelancer : job.employer;
  
  // Scroller effect
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [ledger]);

  // Handle message sending
  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !recipientId) return;

    const newBlock: Omit<MessageBlock, 'hash'> = {
      index: ledger.length,
      timestamp: new Date().toISOString(),
      senderId: CURRENT_USER_ID,
      recipientId: recipientId,
      text: messageInput.trim(),
      prevHash: ledger.length > 0 ? ledger[ledger.length - 1].hash : '0',
    };

    const blockWithHash: MessageBlock = {
      ...newBlock,
      hash: calculateHash(newBlock),
    };

    const newLedger = [...ledger, blockWithHash];
    setLedger(newLedger);
    saveLedger(job.id, newLedger);
    setMessageInput('');
  }, [messageInput, ledger, job.id, recipientId]);

  const rootClass = isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900';
  const cardClass = isDarkMode ? 'bg-white/5 border border-primary/30' : 'bg-white border border-gray-200';
  const inputClass = isDarkMode ? 'bg-white/10 border-white/30 text-white' : 'bg-gray-100 border-gray-300 text-gray-900';
  const textForegroundClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMutedClass = isDarkMode ? 'text-white/70' : 'text-gray-600';

  const formatAddress = (address: string) => address === CURRENT_USER_ID ? 'You' : `${address.slice(0, 8)}...`;
  
  return (
    // Modal-like overlay/component wrapper
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className={`w-full max-w-2xl h-[90vh] flex flex-col ${cardClass}`}>
        {/* Header */}
        <div className={`p-4 flex justify-between items-center border-b ${isDarkMode ? 'border-primary/20' : 'border-gray-200'}`}>
          <h3 className={`text-xl font-bold ${textForegroundClass}`}>
            <Hash className="w-5 h-5 inline mr-2 text-secondary" /> 
            Job Chat Ledger: <span className='font-normal text-sm'>{job.title}</span>
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} className={isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-200'}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Message Area */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {ledger.map((msg, index) => {
            const isSystem = msg.senderId === 'SYSTEM';
            const isMe = msg.senderId === CURRENT_USER_ID;
            const isOther = !isSystem && !isMe;

            return (
              <div 
                key={index} 
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isSystem ? 'text-center' : ''}`}
              >
                <div className={`${isSystem ? 'max-w-md italic text-sm ' + textMutedClass : ''}`}>
                  {!isSystem && (
                    <div className={`text-xs mb-1 ${isMe ? 'text-right text-primary/70' : 'text-left text-secondary/70'}`}>
                      {formatAddress(msg.senderId)}
                    </div>
                  )}
                  <div
                    className={`p-3 max-w-xs rounded-xl shadow-md ${
                      isSystem
                        ? 'bg-transparent'
                        : isMe
                        ? 'bg-primary text-white rounded-tr-none'
                        : isDarkMode
                        ? 'bg-white/10 text-white rounded-tl-none'
                        : 'bg-gray-100 text-gray-800 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div className='text-[8px] text-gray-400 mt-0.5 font-mono select-text'>
                    Block Hash: {msg.hash.slice(0, 10)}...
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`flex-shrink-0 p-4 border-t ${isDarkMode ? 'border-primary/20' : 'border-gray-200'}`}>
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              type="text"
              placeholder={`Send message to ${recipientId ? formatAddress(recipientId) : 'Contractor'}... (Logged on-chain)`}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className={`flex-grow h-10 ${inputClass}`}
              disabled={!job.freelancer} // Disable if no freelancer is assigned
            />
            <Button
              type="submit"
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-md disabled:bg-gray-500"
              disabled={!messageInput.trim() || !job.freelancer}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Block
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}