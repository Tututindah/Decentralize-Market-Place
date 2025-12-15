'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/app/src/contexts/WalletContext'
import { useTheme } from '@/app/src/components/ThemeProvider'
import Header from '@/app/src/components/Header'
import { Footer } from '@/app/src/components/Footer'
import { Wallet, Loader2, CheckCircle, Download, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export const dynamic = 'force-dynamic'

interface WalletInfo {
  name: string
  icon: string
  version: string
}

const WALLET_ICONS: Record<string, string> = {
  nami: 'https://namiwallet.io/icon-128.png',
  eternl: 'https://ccvault.io/images/icon.svg',
  yoroi: 'https://yoroi-wallet.com/favicon.png',
  flint: 'https://flint-wallet.com/logo.png',
  gerowallet: 'https://gerowallet.io/assets/icon.png',
  lace: 'https://www.lace.io/images/favicon.png',
  typhon: 'https://typhonwallet.io/assets/typhon-logo.svg',
  begin: 'https://begin.is/images/favicon.png',
}

export default function ConnectWalletPage() {
  const router = useRouter()
  const { connectWallet, connecting, connected, address } = useWallet()
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark'
  const [installedWallets, setInstalledWallets] = useState<WalletInfo[]>([])

  useEffect(() => {
    if (connected && address) {
      router.push('/role-selection')
    }
  }, [connected, address, router])

  useEffect(() => {
    const checkWallets = async () => {
      try {
        const { BrowserWallet } = await import('@meshsdk/core')
        const wallets = BrowserWallet.getInstalledWallets()
        setInstalledWallets(wallets)
      } catch (error) {
        console.error('Failed to detect wallets:', error)
        setInstalledWallets([])
      }
    }
    checkWallets()
  }, [])

  const handleConnect = async (walletName: string) => {
    try {
      await connectWallet(walletName)
    } catch (error: any) {
      console.error('Connection error:', error)
      toast.error(error?.message || 'Failed to connect wallet')
    }
  }

  const getWalletIcon = (walletName: string): string => {
    const normalized = walletName.toLowerCase()
    return WALLET_ICONS[normalized] || '💼'
  }

  return (
    <div className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      <Header />
      
      <div className="flex items-center justify-center py-12 px-4 min-h-[80vh]">
        <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/30 hover:scale-110 transition-transform">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Connect Your Wallet
          </h1>
          <p className={`text-lg ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Choose a Cardano wallet to get started
          </p>
        </div>

        {/* Wallets Container */}
        <div className={`p-6 rounded-2xl backdrop-blur-sm transition-colors mb-6 ${
          isDarkMode 
            ? 'bg-white/5 border border-white/10' 
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="space-y-3">
            {installedWallets.length > 0 ? (
              installedWallets.map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => handleConnect(wallet.name)}
                  disabled={connecting}
                  className={`w-full p-4 rounded-xl transition-all flex items-center justify-between hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDarkMode
                      ? 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary'
                      : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-primary'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <img 
                      src={getWalletIcon(wallet.name)} 
                      alt={wallet.name}
                      className="w-8 h-8 rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>'
                      }}
                    />
                    <div className="text-left">
                      <p className={`font-semibold capitalize ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {wallet.name}
                      </p>
                      <p className={`text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {wallet.version}
                      </p>
                    </div>
                  </span>
                  <div className="flex items-center gap-2">
                    {connecting ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className={`p-6 rounded-xl transition-colors ${
                isDarkMode 
                  ? 'bg-amber-500/10 border border-amber-500/30' 
                  : 'bg-amber-50 border border-amber-200'
              }`}>
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className={`font-semibold mb-1 ${
                      isDarkMode ? 'text-amber-400' : 'text-amber-800'
                    }`}>
                      No Cardano Wallet Detected
                    </p>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-amber-300/80' : 'text-amber-700'
                    }`}>
                      Please install a wallet extension to continue
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Nami Wallet', url: 'https://namiwallet.io', icon: 'https://namiwallet.io/icon-128.png' },
                    { name: 'Eternl Wallet', url: 'https://eternl.io', icon: 'https://ccvault.io/images/icon.svg' },
                    { name: 'Lace Wallet', url: 'https://www.lace.io', icon: 'https://www.lace.io/images/favicon.png' }
                  ].map((wallet) => (
                    <a
                      key={wallet.name}
                      href={wallet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 p-3 rounded-lg transition-all hover:scale-105 ${
                        isDarkMode
                          ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                          : 'bg-white hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <img 
                        src={wallet.icon} 
                        alt={wallet.name}
                        className="w-6 h-6 rounded"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>'
                        }}
                      />
                      <span className={`flex-1 font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {wallet.name}
                      </span>
                      <Download className="w-4 h-4 text-primary" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className={`w-full p-4 rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2 ${
            isDarkMode
              ? 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300'
              : 'bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
        </div>
      </div>
      
      <Footer isDarkMode={isDarkMode} />
    </div>
  )
}

