import { Button } from "./ui/button";
import { Sparkles, Sun, Moon } from "lucide-react"; // Import Sun and Moon
import { motion } from "framer-motion";
import React from "react";

interface AppHeaderProps {
  onGetStarted: () => void;
  onShowProfile: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void; // New prop for theme toggle
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onGetStarted, onShowProfile, isDarkMode, onToggleTheme }) => (
  <motion.header
    className={`border-b backdrop-blur-sm transition-colors sticky top-0 z-10 ${
      isDarkMode ? 'border-white/10 bg-[#0a0a0a]/80' : 'border-gray-200 bg-white/80'
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
          <h1 className={`text-xl font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            TrustFlow
          </h1>
        </div>

        <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={onToggleTheme} 
                className={`transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-200'}`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            <Button
                onClick={onGetStarted}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity font-semibold"
            >
                Connect Wallet
            </Button>
        </div>
      </div>
    </div>
  </motion.header>
);