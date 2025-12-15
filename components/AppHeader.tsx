'use client'

import { Button } from "./ui/button";
import { Sparkles, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import React from "react";
import { useWallet } from "../contexts/WalletContext";
import { useRouter } from "next/navigation";

interface AppHeaderProps {
  onGetStarted: () => void;
  onShowProfile: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onShowProfile, isDarkMode, onToggleTheme }) => {
  const { connected, address, disconnectWallet } = useWallet();
  const router = useRouter();

  return (
  <motion.header
    className={`border-b backdrop-blur-sm transition-colors sticky top-0 z-10 ${
      isDarkMode ? 'border-white/10 bg-black/80' : 'border-gray-200 bg-white/80'
    }`}
    initial={{ y: -40, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.7, ease: "easeOut" }}
  >
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center focus:outline-none"
            onClick={onShowProfile}
            title="View Profile"
            type="button"
          >
            <Sparkles className="w-5 h-5 text-white fill-white/50" />
          </button>
          <h1 className={`text-xl font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>
            DecentGigs
          </h1>
        </div>

        <div className="flex items-center gap-3">
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={onToggleTheme} 
                className={`transition-colors ${isDarkMode ? 'text-white hover:bg-zinc-800' : 'text-black hover:bg-gray-200'}`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {connected && address ? (
              <div className="flex items-center gap-2">
                <div className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-black/70'}`}>
                  {address.slice(0, 8)}...{address.slice(-6)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnectWallet}
                  className={isDarkMode ? 'border-white/20 text-white hover:bg-zinc-800' : ''}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => router.push('/connect-wallet')}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity font-semibold"
              >
                Connect Wallet
              </Button>
            )}
        </div>
      </div>
    </div>
  </motion.header>
  );
};
