import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { BrowserWallet } from '@meshsdk/core'

interface WalletContextType {
  wallet: BrowserWallet | null
  connected: boolean
  connecting: boolean
  address: string | null
  balance: string | null
  did: string | null
  role: 'employer' | 'freelancer' | null
  walletType: 'browser' | 'test' | null
  // KYC Status
  kycStatus: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED'
  kycSubmittedAt: Date | null
  // Reputation
  reputation: number
  trustScore: number
  totalJobs: number
  completedJobs: number
  // Methods
  connectWallet: (walletName: string) => Promise<void>
  disconnectWallet: () => void
  setUserRole: (role: 'employer' | 'freelancer') => void
  createUserProfile: (walletAddress: string, selectedRole: 'employer' | 'freelancer') => Promise<void>
  updateKYCStatus: (status: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED') => Promise<void>
  refreshReputation: () => Promise<void>
  initializeAccount: () => Promise<void>
  submitBid: (jobId: string, amount: string) => Promise<string>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<BrowserWallet | null>(null)
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [did, setDid] = useState<string | null>(null)
  const [role, setRole] = useState<'employer' | 'freelancer' | null>(null)
  const [walletType, setWalletType] = useState<'browser' | 'test' | null>(null)
  
  // KYC Status
  const [kycStatus, setKYCStatus] = useState<'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED'>('NOT_SUBMITTED')
  const [kycSubmittedAt, setKYCSubmittedAt] = useState<Date | null>(null)
  
  // Reputation
  const [reputation, setReputation] = useState<number>(0)
  const [trustScore, setTrustScore] = useState<number>(0)
  const [totalJobs, setTotalJobs] = useState<number>(0)
  const [completedJobs, setCompletedJobs] = useState<number>(0)

  const connectWallet = async (walletName: string) => {
    setConnecting(true)
    try {
      const browserWallet = await BrowserWallet.enable(walletName)
      setWallet(browserWallet)
      
      const walletAddress = await browserWallet.getChangeAddress()
      setAddress(walletAddress)
      
      const walletBalance = await browserWallet.getBalance()
      const lovelace = walletBalance.find((asset: any) => asset.unit === 'lovelace')
      setBalance(lovelace ? (parseInt(lovelace.quantity) / 1_000_000).toFixed(2) : '0')
      
      setConnected(true)
      setWalletType('browser')
      localStorage.setItem('connectedWallet', walletName)
      
      // Fetch user profile from backend
      const userExists = await fetchUserProfile(walletAddress)
      
      // If user doesn't exist, they need to select a role
      if (!userExists) {
        console.log('New user detected - redirecting to role selection')
        // Navigate will happen in the component that checks role
      }
      
      console.log('✅ Wallet connected:', walletAddress)
    } catch (error) {
      console.error('❌ Failed to connect wallet:', error)
      alert('Failed to connect wallet. Please make sure the wallet extension is installed.')
    } finally {
      setConnecting(false)
    }
  }

  const fetchUserProfile = async (walletAddress: string) => {
    try {
      const response = await fetch(`${API_URL}/users/profile/${walletAddress}`)
      
      if (response.ok) {
        const userData = await response.json()
        setKYCStatus(userData.kycStatus)
        setKYCSubmittedAt(userData.kycSubmittedAt ? new Date(userData.kycSubmittedAt) : null)
        setReputation(userData.reputation)
        setTrustScore(userData.trustScore)
        setTotalJobs(userData.totalJobs)
        setCompletedJobs(userData.completedJobs)
        if (userData.role) {
          const userRole = userData.role.toLowerCase() as 'employer' | 'freelancer'
          setRole(userRole)
          localStorage.setItem('userRole', userRole)
        }
        return true // User exists
      } else if (response.status === 404) {
        // User doesn't exist - need role selection
        return false
      } else {
        console.error('Error response:', response.status)
        return false
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return false
    }
  }

  const createUserProfile = async (walletAddress: string, selectedRole: 'employer' | 'freelancer') => {
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          role: selectedRole.toUpperCase()
        })
      })
      
      if (response.ok) {
        const userData = await response.json()
        setKYCStatus(userData.kycStatus)
        setReputation(userData.reputation)
        setTrustScore(userData.trustScore)
        setTotalJobs(userData.totalJobs)
        setCompletedJobs(userData.completedJobs)
        setRole(selectedRole)
        localStorage.setItem('userRole', selectedRole)
        
        // Initialize reputation on blockchain
        await initializeAccount()
      }
    } catch (error) {
      console.error('Error creating user profile:', error)
      throw error
    }
  }

  const initializeAccount = async () => {
    if (!address) throw new Error('Wallet not connected')
    
    try {
      // Initialize reputation on blockchain
      const { cardanoService } = await import('../services/cardano.service')
      await cardanoService.initializeReputation({ walletAddress: address })
      
      // Refresh reputation from chain
      await refreshReputation()
    } catch (error) {
      console.error('Error initializing account:', error)
      throw error
    }
  }

  const refreshReputation = async () => {
    if (!address) return
    
    try {
      const response = await fetch(`${API_URL}/users/profile/${address}/reputation`)
      
      if (response.ok) {
        const reputationData = await response.json()
        setReputation(reputationData.reputation)
        setTrustScore(reputationData.trustScore)
        setTotalJobs(reputationData.totalJobs)
        setCompletedJobs(reputationData.completedJobs)
      }
    } catch (error) {
      console.error('Error refreshing reputation:', error)
    }
  }

  const updateKYCStatus = async (status: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED') => {
    if (!address) throw new Error('Wallet not connected')
    
    try {
      const response = await fetch(`${API_URL}/users/profile/${address}/kyc`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kycStatus: status })
      })
      
      if (response.ok) {
        const userData = await response.json()
        setKYCStatus(userData.kycStatus)
        setKYCSubmittedAt(userData.kycSubmittedAt ? new Date(userData.kycSubmittedAt) : null)
      }
    } catch (error) {
      console.error('Error updating KYC status:', error)
      throw error
    }
  }

  const setUserRole = (userRole: 'employer' | 'freelancer') => {
    setRole(userRole)
    localStorage.setItem('userRole', userRole)
    console.log('✅ User role set:', userRole)
  }

  const submitBid = async (jobId: string, amount: string): Promise<string> => {
    if (!wallet || !address) {
      throw new Error('Wallet not connected')
    }

    try {
      // For now, return a mock transaction hash
      // In production, this would create a real blockchain transaction
      const mockTxHash = `bid_${jobId}_${Date.now()}_${Math.random().toString(36).substring(7)}`
      console.log('✅ Bid submitted:', mockTxHash)
      return mockTxHash
    } catch (error) {
      console.error('Error submitting bid:', error)
      throw error
    }
  }

  const disconnectWallet = () => {
    setWallet(null)
    setConnected(false)
    setAddress(null)
    setBalance(null)
    setDid(null)
    setRole(null)
    setWalletType(null)
    setKYCStatus('NOT_SUBMITTED')
    setKYCSubmittedAt(null)
    setReputation(0)
    setTrustScore(0)
    setTotalJobs(0)
    setCompletedJobs(0)
    localStorage.removeItem('userRole')
    localStorage.removeItem('connectedWallet')
    console.log('👋 Wallet disconnected')
  }

  // Auto-reconnect on page load
  useEffect(() => {
    const savedWallet = localStorage.getItem('connectedWallet')
    if (savedWallet) {
      console.log('Attempting to reconnect wallet:', savedWallet)
      connectWallet(savedWallet).catch((error) => {
        console.error('Auto-reconnect failed:', error)
        localStorage.removeItem('connectedWallet')
      })
    }
  }, [])

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connected,
        connecting,
        address,
        submitBid,
        balance,
        did,
        role,
        walletType,
        kycStatus,
        kycSubmittedAt,
        reputation,
        trustScore,
        totalJobs,
        completedJobs,
        connectWallet,
        setUserRole,
        disconnectWallet,
        updateKYCStatus,
        refreshReputation,
        initializeAccount,
        createUserProfile,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
