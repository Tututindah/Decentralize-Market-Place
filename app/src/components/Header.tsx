'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useWallet } from '@/app/src/contexts/WalletContext';
import { useTheme } from '@/app/src/components/ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export function Header() {
  const { connected, address, role, disconnectWallet, initializing } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
  };

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md transition-colors ${
      isDarkMode 
        ? 'bg-black/80 border-b border-white/10' 
        : 'bg-white/80 border-b border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center">
              <Image 
                src="/icon.png" 
                alt="DecentGigs" 
                width={32} 
                height={32} 
                className={`rounded-lg ${!isDarkMode ? 'brightness-0' : ''}`}
              />
            </div>
            <span className={`text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent`}>
              DecentGigs
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/jobs"
              className={`transition-all hover:scale-105 ${
                isDarkMode 
                  ? 'text-gray-300 hover:text-primary' 
                  : 'text-gray-700 hover:text-primary'
              }`}
            >
              Browse Jobs
            </Link>
            {connected && role === 'EMPLOYER' && (
              <>
                <Link
                  href="/create-job"
                  className={`transition-all hover:scale-105 ${
                    isDarkMode 
                      ? 'text-gray-300 hover:text-primary' 
                      : 'text-gray-700 hover:text-primary'
                  }`}
                >
                  Post Job
                </Link>
                <Link
                  href="/employer/dashboard"
                  className={`transition-all hover:scale-105 ${
                    isDarkMode 
                      ? 'text-gray-300 hover:text-primary' 
                      : 'text-gray-700 hover:text-primary'
                  }`}
                >
                  Dashboard
                </Link>
              </>
            )}
            {connected && role === 'FREELANCER' && (
              <Link
                href="/freelancer/dashboard"
                className={`transition-all hover:scale-105 ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-primary' 
                    : 'text-gray-700 hover:text-primary'
                }`}
              >
                Dashboard
              </Link>
            )}
            <Link
              href="/kyc"
              className={`transition-all hover:scale-105 ${
                isDarkMode 
                  ? 'text-gray-300 hover:text-primary' 
                  : 'text-gray-700 hover:text-primary'
              }`}
            >
              KYC
            </Link>
          </nav>

          {/* Theme Toggle & Wallet Connection */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all hover:scale-110 ${
                isDarkMode
                  ? 'bg-white/10 hover:bg-white/20 text-yellow-400'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {initializing ? (
              <div className={`px-4 py-2 rounded-lg backdrop-blur-sm ${
                isDarkMode
                  ? 'bg-white/10 border border-white/20'
                  : 'bg-gray-100 border border-gray-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Connecting...
                  </span>
                </div>
              </div>
            ) : connected && address ? (
              <>
                <div className="flex items-center space-x-2">
                  <div className={`px-4 py-2 rounded-lg backdrop-blur-sm transition-colors ${
                    isDarkMode
                      ? 'bg-white/10 border border-white/20'
                      : 'bg-gray-100 border border-gray-200'
                  }`}>
                    <span className={`text-sm font-mono ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      {formatAddress(address)}
                    </span>
                  </div>
                  {role && (
                    <div className={`px-3 py-2 rounded-lg backdrop-blur-sm transition-colors ${
                      isDarkMode
                        ? 'bg-primary/20 border border-primary/30'
                        : 'bg-primary/10 border border-primary/20'
                    }`}>
                      <span className={`text-sm font-semibold ${
                        isDarkMode ? 'text-primary' : 'text-primary'
                      }`}>
                        {role}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={disconnectWallet}
                  className={`px-4 py-2 rounded-lg transition-all hover:scale-105 ${
                    isDarkMode
                      ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                      : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                  }`}
                >
                  Disconnect
                </button>
              </>
            ) : (
              <Link
                href="/connect-wallet"
                className="px-6 py-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white rounded-lg transition-all transform hover:scale-105 font-semibold shadow-lg shadow-primary/20"
              >
                Connect Wallet
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// Also export as default for backwards compatibility
export default Header;
