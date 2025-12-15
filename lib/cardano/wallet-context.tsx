'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import toast from 'react-hot-toast'

let BrowserWallet: any = null
if (typeof window !== 'undefined') {
  import('@meshsdk/core').then((mod) => {
    BrowserWallet = mod.BrowserWallet
  })
}

export interface WalletContextType {
  wallet: any | null
  connected: boolean
  connecting: boolean
  address: string | null
  network: number | null
  balance: string | null
  connect: (walletName: string) => Promise<void>
  disconnect: () => void
  getUtxos: () => Promise<any[]>
  getCollateral: () => Promise<any[]>
  signTx: (unsignedTx: string, partialSign?: boolean) => Promise<string>
  submitTx: (signedTx: string) => Promise<string>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<any | null>(null)
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [network, setNetwork] = useState<number | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return

    const savedWallet = localStorage.getItem('decentgigs_wallet')
    if (savedWallet && BrowserWallet) {
      connect(savedWallet)
    }
  }, [mounted])

  const connect = async (walletName: string) => {
    if (typeof window === 'undefined') {
      toast.error('Wallet connection only available in browser')
      return
    }

    if (!BrowserWallet) {
      const mod = await import('@meshsdk/core')
      BrowserWallet = mod.BrowserWallet
    }

    setConnecting(true)
    try {
      const browserWallet = await BrowserWallet.enable(walletName)

      const walletAddress = await browserWallet.getChangeAddress()
      const networkId = await browserWallet.getNetworkId()
      const lovelaceBalance = await browserWallet.getLovelace()

      setWallet(browserWallet)
      setAddress(walletAddress)
      setNetwork(networkId)
      setBalance((parseInt(lovelaceBalance) / 1_000_000).toFixed(2))
      setConnected(true)

      localStorage.setItem('decentgigs_wallet', walletName)
      toast.success(`Connected to ${walletName}`)
    } catch (error: any) {
      console.error('Wallet connection error:', error)
      toast.error(error?.message || 'Failed to connect wallet')
    } finally {
      setConnecting(false)
    }
  }

  const disconnect = () => {
    setWallet(null)
    setAddress(null)
    setNetwork(null)
    setBalance(null)
    setConnected(false)
    localStorage.removeItem('decentgigs_wallet')
    toast.success('Wallet disconnected')
  }

  const getUtxos = async () => {
    if (!wallet) throw new Error('Wallet not connected')
    return await wallet.getUtxos()
  }

  const getCollateral = async () => {
    if (!wallet) throw new Error('Wallet not connected')
    return await wallet.getCollateral()
  }

  const signTx = async (unsignedTx: string, partialSign: boolean = false) => {
    if (!wallet) throw new Error('Wallet not connected')
    return await wallet.signTx(unsignedTx, partialSign)
  }

  const submitTx = async (signedTx: string) => {
    if (!wallet) throw new Error('Wallet not connected')
    return await wallet.submitTx(signedTx)
  }

  const value: WalletContextType = {
    wallet,
    connected,
    connecting,
    address,
    network,
    balance,
    connect,
    disconnect,
    getUtxos,
    getCollateral,
    signTx,
    submitTx,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
