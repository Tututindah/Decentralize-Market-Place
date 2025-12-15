'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '../contexts/WalletContext'
import { Card } from '../components/ui/card'
import { toast } from 'react-hot-toast'

interface InstalledWallet {
  name: string
  icon: string
  version: string
}

export default function WalletConnectPage() {
  const router = useRouter()
  const { connectWallet, connecting } = useWallet()
  const [installedWallets, setInstalledWallets] = useState<InstalledWallet[]>([])
  const [detecting, setDetecting] = useState(true)

  // Detect installed wallets
  useEffect(() => {
    const detectWallets = async () => {
      setDetecting(true)
      try {
        // Dynamic import to avoid SSR issues
        const { BrowserWallet } = await import('@meshsdk/core')
        const wallets = await BrowserWallet.getInstalledWallets()
        setInstalledWallets(wallets)
      } catch (error) {
        console.error('Error detecting wallets:', error)
      } finally {
        setDetecting(false)
      }
    }

    detectWallets()
  }, [])

  const handleConnectWallet = async (walletName: string) => {
    try {
      await connectWallet(walletName)
      toast.success(`Connected to ${walletName}!`)
      setTimeout(() => router.push('/jobs'), 500)
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect wallet')
    }
  }

  const handleSkip = () => {
    router.push('/jobs')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gradient">
            Connect Your Wallet
          </h1>
          <p className="text-muted-foreground text-lg mb-6">
            Connect your Cardano wallet to post jobs and submit bids
          </p>
          <button
            onClick={handleSkip}
            className="text-sm text-primary hover:underline"
          >
            Skip for now (browse only) →
          </button>
        </div>

        {/* Installed Wallets */}
        <div className="space-y-4">
          {detecting ? (
            <Card className="p-8 text-center">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p className="text-muted-foreground">Detecting installed wallets...</p>
            </Card>
          ) : installedWallets.length > 0 ? (
            <>
              <h2 className="text-xl font-semibold text-center">Available Wallets</h2>
              <div className="grid gap-4">
                {installedWallets.map((wallet) => (
                  <Card
                    key={wallet.name}
                    className="p-6 hover:border-primary transition-all cursor-pointer"
                    onClick={() => handleConnectWallet(wallet.name)}
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={wallet.icon}
                        alt={wallet.name}
                        className="w-12 h-12 rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"%3E%3Cpath fill="%2307B1B3" d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/%3E%3C/svg%3E'
                        }}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{wallet.name}</h3>
                        <p className="text-sm text-muted-foreground">Version {wallet.version}</p>
                      </div>
                      {connecting ? (
                        <div className="loading-spinner"></div>
                      ) : (
                        <span className="text-primary">Connect →</span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card className="p-8 text-center space-y-4">
              <div className="text-4xl mb-2">👛</div>
              <h3 className="text-xl font-semibold">No Wallets Found</h3>
              <p className="text-muted-foreground">
                Please install a Cardano wallet extension to connect:
              </p>
              <div className="grid gap-3 max-w-md mx-auto mt-4">
                <a
                  href="https://namiwallet.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary transition-all"
                >
                  <span className="text-2xl">🦎</span>
                  <div className="text-left flex-1">
                    <div className="font-semibold">Nami Wallet</div>
                    <div className="text-xs text-muted-foreground">Popular & easy to use</div>
                  </div>
                  <span className="text-primary">Install →</span>
                </a>
                <a
                  href="https://eternl.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary transition-all"
                >
                  <span className="text-2xl">♾️</span>
                  <div className="text-left flex-1">
                    <div className="font-semibold">Eternl</div>
                    <div className="text-xs text-muted-foreground">Advanced features</div>
                  </div>
                  <span className="text-primary">Install →</span>
                </a>
                <a
                  href="https://flint-wallet.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary transition-all"
                >
                  <span className="text-2xl">🔥</span>
                  <div className="text-left flex-1">
                    <div className="font-semibold">Flint Wallet</div>
                    <div className="text-xs text-muted-foreground">Fast & secure</div>
                  </div>
                  <span className="text-primary">Install →</span>
                </a>
              </div>
              <button
                onClick={handleSkip}
                className="mt-6 btn btn-secondary"
              >
                Continue without wallet
              </button>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
