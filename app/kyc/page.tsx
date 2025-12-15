'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/app/src/contexts/WalletContext'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/app/src/components/ThemeProvider'
import Header from '@/app/src/components/Header'
import { Footer } from '@/app/src/components/Footer'
import { toast } from 'react-hot-toast'
import { CheckCircle, Shield, Award, Sparkles, User, Building } from 'lucide-react'
import { CardanoService } from '@/app/src/services/cardano.service'

export const dynamic = 'force-dynamic'

type Role = 'EMPLOYER' | 'FREELANCER'
type KYCLevel = 'basic' | 'advanced' | 'full'

interface UserProfile {
  id: string
  walletAddress: string
  role: Role
  kycStatus: string
  reputation: number
  trustScore: number
}

export default function KYCPage() {
  const router = useRouter()
  const { connected, address, setUserRole, wallet, initializing } = useWallet()
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark'
  
  // Step state
  const [currentStep, setCurrentStep] = useState<'role' | 'kyc' | 'mint' | 'complete'>('role')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [kycLevel, setKycLevel] = useState<KYCLevel>('basic')
  
  // Process state
  const [loading, setLoading] = useState(false)
  const [_userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [mockDid, setMockDid] = useState<string>('')
  const [reputationNFT, setReputationNFT] = useState<any>(null)
  
  // Check if user already has profile
  useEffect(() => {
    if (connected && address) {
      checkUserProfile()
    }
  }, [connected, address])

  const checkUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/profile/${address}`)
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data)
        
        // If user exists and has KYC, skip to complete
        if (data.kycStatus === 'APPROVED') {
          setCurrentStep('complete')
        } else if (data.role) {
          // Has role but no KYC
          setSelectedRole(data.role)
          setCurrentStep('kyc')
        }
      }
    } catch (error) {
      console.error('Error checking profile:', error)
    }
  }

  // Step 1: Create account with role selection
  const handleRoleSelection = async () => {
    if (!selectedRole) {
      toast.error('Please select a role')
      return
    }

    setLoading(true)
    try {
      // Create or update user profile with role
      const response = await fetch('/api/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          role: selectedRole
        })
      })

      if (response.ok) {
        const data = await response.json()
        setUserProfile(data)
        setUserRole(selectedRole.toLowerCase() as 'employer' | 'freelancer')
        localStorage.setItem('userRole', selectedRole.toLowerCase())
        toast.success(`Account created as ${selectedRole}`)
        setCurrentStep('kyc')
      } else {
        throw new Error('Failed to create account')
      }
    } catch (error) {
      console.error('Error creating account:', error)
      toast.error('Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Generate Mock DID and submit KYC
  const handleKYCVerification = async () => {
    if (!connected || !address) {
      toast.error('Please connect your wallet')
      return
    }

    setLoading(true)
    try {
      // Generate mock DID
      const generatedDid = `did:prism:${address.slice(0, 20)}:${Date.now()}`
      setMockDid(generatedDid)
      
      toast.loading('Verifying KYC...', { duration: 1500 })
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Submit KYC to backend
      const response = await fetch(`/api/users/profile/${address}/kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          did: generatedDid,
          kycLevel,
          kycStatus: 'APPROVED'
        })
      })

      if (response.ok) {
        toast.success('KYC verified successfully!')
        setCurrentStep('mint')
      } else {
        throw new Error('KYC submission failed')
      }
    } catch (error) {
      console.error('Error in KYC:', error)
      toast.error('KYC verification failed')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Mint initial reputation NFT on-chain
  const handleMintReputation = async () => {
    setLoading(true)
    try {
      if (!address || !wallet) {
        toast.error('Please connect your wallet first')
        return
      }

      toast.loading('Initializing on-chain badge...', { duration: 3000 })
      
      // Real NFT minting using Cardano blockchain (static import to avoid cache issues)
      const cardanoService = new CardanoService(wallet)

      // Prepare NFT metadata
      const metadata = {
        name: `DecentGigs Reputation Badge`,
        description: `Initial reputation badge for ${address.slice(0, 10)}... on DecentGigs platform`,
        image: 'ipfs://QmYourImageHash', // Replace with actual IPFS hash
        attributes: {
          role: selectedRole || 'freelancer',
          kycLevel: 'verified',
          initialScore: 0,
          platform: 'DecentGigs',
          mintedAt: new Date().toISOString()
        }
      }

      // Mint real NFT on Cardano blockchain
      console.log('Initiating NFT minting...')
      console.log('Wallet instance:', wallet)
      console.log('CardanoService instance:', cardanoService)
      
      const nftResult = await cardanoService.mintReputationNFT(address, metadata)
      
      console.log('NFT minting returned:', nftResult)
      console.log('Type of result:', typeof nftResult)
      console.log('Has policyId?', nftResult?.policyId)
      console.log('Has assetName?', nftResult?.assetName)
      console.log('Has txHash?', nftResult?.txHash)
      
      // Validate result
      if (!nftResult || !nftResult.policyId || !nftResult.assetName || !nftResult.txHash) {
        console.error('Incomplete NFT result:', JSON.stringify(nftResult, null, 2))
        throw new Error('NFT minting returned incomplete data')
      }
      
      console.log('NFT minted successfully:', nftResult)

      setReputationNFT({
        ...nftResult,
        initialScore: 0
      })

      // Record NFT in database
      const response = await fetch(`/api/users/profile/${address}/reputation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyId: nftResult.policyId,
          assetName: nftResult.assetName,
          txHash: nftResult.txHash,
          utxoRef: nftResult.utxoRef || ''
        })
      })

      if (response.ok) {
        toast.success('🎉 On-Chain Badge Initialized!')
        setCurrentStep('complete')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to record NFT')
      }
    } catch (error: any) {
      console.error('=== NFT Minting Error ===')
      console.error('Error:', error)
      console.error('Message:', error.message)
      console.error('Stack:', error.stack)
      console.error('Context:', {
        walletConnected: !!wallet,
        address: address,
        role: selectedRole
      })
      
      // User-friendly error messages based on error type
      let errorMessage = 'Failed to initialize on-chain badge'
      
      if (error.message?.includes('No UTXOs available') || error.message?.includes('insufficient')) {
        errorMessage = '❌ Insufficient funds. Please add at least 5 ADA to your wallet for transaction fees.'
      } else if (error.message?.includes('rejected') || error.message?.includes('signing failed')) {
        errorMessage = '❌ Transaction cancelled. Please approve the transaction in your wallet.'
      } else if (error.message?.includes('Wallet not connected')) {
        errorMessage = '❌ Wallet disconnected. Please reconnect your wallet and try again.'
      } else if (error.message?.includes('build failed')) {
        errorMessage = '❌ Transaction build failed. Check console for details.'
      } else if (error.message?.includes('submission failed')) {
        errorMessage = '❌ Blockchain submission failed. Network may be congested, please try again.'
      } else if (error.message) {
        errorMessage = `❌ ${error.message}`
      }
      
      toast.error(errorMessage, { duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  if (!connected) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors ${
        isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
      }`}>
        <div className={`max-w-md w-full mx-4 p-8 rounded-2xl backdrop-blur-sm transition-colors ${
          isDarkMode 
            ? 'bg-white/5 border border-white/10' 
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <Shield className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Account Setup
          </h1>
          <p className={`text-center ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Please connect your wallet to create your account
          </p>
        </div>
      </div>
    )
  }

  // Show loading while wallet is initializing
  if (initializing) {
    return (
      <div className={`min-h-screen transition-colors ${
        isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
      }`}>
        <Header />
        <div className="py-12 px-4 flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Connecting to wallet...
            </p>
          </div>
        </div>
        <Footer isDarkMode={isDarkMode} />
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      <Header />
      <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Account Setup & Verification
        </h1>
        <p className={`text-center mb-12 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Complete your profile in 4 simple steps
        </p>
        
        {/* Progress Steps */}
        <div className={`p-6 rounded-2xl backdrop-blur-sm mb-8 transition-colors ${
          isDarkMode 
            ? 'bg-white/5 border border-white/10' 
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            {[{num: 1, title: 'Select Role', step: 'role'}, 
              {num: 2, title: 'KYC & DID', step: 'kyc'}, 
              {num: 3, title: 'Init Badge', step: 'mint'}, 
              {num: 4, title: 'Complete', step: 'complete'}].map((item, idx) => {
              const isActive = currentStep === item.step
              const isComplete = ['role', 'kyc', 'mint', 'complete'].indexOf(currentStep) > idx
              
              return (
                <div key={item.step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                      isComplete 
                        ? 'bg-gradient-to-r from-primary to-secondary text-white' 
                        : isActive
                        ? 'bg-primary/20 text-primary border-2 border-primary'
                        : isDarkMode
                        ? 'bg-white/5 text-gray-500 border border-white/10'
                        : 'bg-gray-100 text-gray-400 border border-gray-300'
                    }`}>
                      {isComplete ? <CheckCircle className="w-6 h-6" /> : item.num}
                    </div>
                    <span className={`text-xs mt-2 font-medium ${
                      isActive ? 'text-primary' : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {item.title}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                      isComplete 
                        ? 'bg-gradient-to-r from-primary to-secondary' 
                        : isDarkMode
                        ? 'bg-white/10'
                        : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step 1: Role Selection */}
        {currentStep === 'role' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              className={`p-8 rounded-2xl cursor-pointer transition-all backdrop-blur-sm border-2 ${
                selectedRole === 'FREELANCER'
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                  : isDarkMode
                  ? 'border-white/10 bg-white/5 hover:bg-white/10'
                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => setSelectedRole('FREELANCER')}
            >
              <User className="w-16 h-16 text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Freelancer
              </h2>
              <p className={`mb-4 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Browse jobs, submit proposals, and earn crypto
              </p>
              <ul className="space-y-2">
                {['Access to all job listings', 'Submit unlimited proposals', 'Build your reputation', 'Escrow protection'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div 
              className={`p-8 rounded-2xl cursor-pointer transition-all backdrop-blur-sm border-2 ${
                selectedRole === 'EMPLOYER'
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                  : isDarkMode
                  ? 'border-white/10 bg-white/5 hover:bg-white/10'
                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => setSelectedRole('EMPLOYER')}
            >
              <Building className="w-16 h-16 text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Employer
              </h2>
              <p className={`mb-4 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Post jobs, hire talent, and build your team
              </p>
              <ul className="space-y-2">
                {['Post unlimited jobs', 'Review proposals & hire', 'Escrow payment system', 'Dispute resolution'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {currentStep === 'role' && (
          <div className="text-center mt-8">
            <button 
              className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
              onClick={handleRoleSelection}
              disabled={!selectedRole || loading}
            >
              {loading ? 'Creating Account...' : 'Continue to KYC →'}
            </button>
          </div>
        )}

        {/* Step 2: KYC Verification */}
        {currentStep === 'kyc' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`p-8 rounded-2xl backdrop-blur-sm transition-colors ${
              isDarkMode 
                ? 'bg-white/5 border border-white/10' 
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-8 h-8 text-primary" />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  KYC Verification
                </h2>
              </div>
              <p className={`mb-6 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Complete KYC verification to unlock all platform features
              </p>
              
              <div className="mb-6">
                <label className={`block text-sm font-semibold mb-3 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Verification Level
                </label>
                <select 
                  className={`w-full px-4 py-3 rounded-xl transition-colors ${
                    isDarkMode
                      ? 'bg-white/5 border border-white/10 text-white'
                      : 'bg-white border border-gray-300 text-gray-900'
                  }`}
                  value={kycLevel} 
                  onChange={(e) => setKycLevel(e.target.value as KYCLevel)}
                >
                  <option value="basic" className="bg-gray-800 text-white">Basic - Trust Score 30</option>
                  <option value="advanced" className="bg-gray-800 text-white">Advanced - Trust Score 70</option>
                  <option value="full" className="bg-gray-800 text-white">Full - Trust Score 100</option>
                </select>
              </div>

              <div className={`p-4 rounded-xl mb-6 ${
                isDarkMode ? 'bg-primary/10 border border-primary/20' : 'bg-primary/5 border border-primary/20'
              }`}>
                <h4 className="font-semibold text-primary mb-2">Mock DID Generation</h4>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  We'll generate a decentralized identifier (DID) for your account using mock Atala PRISM
                </p>
              </div>

              <button 
                className="w-full px-6 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                onClick={handleKYCVerification}
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify KYC & Generate DID →'}
              </button>
            </div>

            <div className={`p-8 rounded-2xl backdrop-blur-sm transition-colors ${
              isDarkMode 
                ? 'bg-white/5 border border-white/10' 
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                About Verification Levels
              </h2>
              
              <div className="space-y-4">
                {[
                  { icon: Shield, title: 'Basic (Trust Score: 30)', items: ['Email verification', 'Access to small jobs'] },
                  { icon: Award, title: 'Advanced (Trust Score: 70)', items: ['Email + Government ID', 'Access to medium jobs', 'Lower escrow fees'] },
                  { icon: Sparkles, title: 'Full (Trust Score: 100)', items: ['Complete verification', 'Biometric + Address proof', 'Access to all jobs', 'Priority listings'] }
                ].map((level) => {
                  const Icon = level.icon
                  return (
                    <div key={level.title} className={`p-4 rounded-xl transition-colors ${
                      isDarkMode ? 'bg-white/5' : 'bg-white border border-gray-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold text-primary">{level.title}</h4>
                      </div>
                      <ul className="space-y-1">
                        {level.items.map((item) => (
                          <li key={item} className={`text-sm flex items-center gap-2 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Mint Reputation NFT */}
        {currentStep === 'mint' && (
          <div className={`max-w-2xl mx-auto p-8 rounded-2xl backdrop-blur-sm transition-colors ${
            isDarkMode 
              ? 'bg-white/5 border border-white/10' 
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="text-center">
              <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Initialize On-Chain Badge
              </h2>
              <p className={`mb-6 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Create your on-chain reputation badge to track your work history
              </p>
              
              {mockDid && (
                <div className={`p-4 rounded-xl mb-6 transition-colors ${
                  isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
                }`}>
                  <p className="font-semibold text-primary mb-2">Your DID:</p>
                  <code className={`text-xs break-all block ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {mockDid}
                  </code>
                </div>
              )}

              <div className={`p-6 rounded-xl mb-8 text-left ${
                isDarkMode ? 'bg-primary/10 border border-primary/20' : 'bg-primary/5 border border-primary/20'
              }`}>
                <h4 className="font-semibold text-primary mb-3">What is an On-Chain Badge?</h4>
                <p className={`mb-4 text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Your reputation badge is a unique on-chain token that tracks your:
                </p>
                <ul className="space-y-2">
                  {['Job completion rate', 'Trust score', 'Client ratings', 'Dispute history'].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                onClick={handleMintReputation}
                disabled={loading}
              >
                {loading ? 'Initializing...' : '🎨 Initialize Badge'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {currentStep === 'complete' && (
          <div className={`max-w-3xl mx-auto p-8 rounded-2xl backdrop-blur-sm transition-colors ${
            isDarkMode 
              ? 'bg-white/5 border border-white/10' 
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="text-center">
              <div className="text-7xl mb-6">🎉</div>
              <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Account Setup Complete!
              </h2>
              <p className={`text-xl mb-8 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Welcome to DecentGigs, {selectedRole?.toLowerCase()}!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className={`p-6 rounded-xl transition-colors ${
                  isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
                }`}>
                  <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h4 className="font-semibold text-primary mb-1">Role</h4>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{selectedRole}</p>
                </div>
                <div className={`p-6 rounded-xl transition-colors ${
                  isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
                }`}>
                  <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h4 className="font-semibold text-primary mb-1">KYC Status</h4>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Verified - {kycLevel} level</p>
                </div>
              </div>

              {mockDid && (
                <div className={`p-4 rounded-xl mb-6 text-left transition-colors ${
                  isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
                }`}>
                  <p className="font-semibold text-primary mb-2">Your DID:</p>
                  <code className={`text-xs break-all block ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {mockDid}
                  </code>
                </div>
              )}

              {reputationNFT && (
                <div className={`p-6 rounded-xl mb-8 text-left transition-colors ${
                  isDarkMode ? 'bg-primary/10 border border-primary/20' : 'bg-primary/5 border border-primary/20'
                }`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-6 h-6 text-primary" />
                    <h4 className="font-semibold text-primary">On-Chain Badge Initialized</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      <strong className="text-primary">Policy ID:</strong>{' '}
                      <code className="text-xs">{reputationNFT.policyId}</code>
                    </p>
                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      <strong className="text-primary">Asset Name:</strong>{' '}
                      <code>{reputationNFT.assetName}</code>
                    </p>
                    <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      <strong className="text-primary">Initial Score:</strong> {reputationNFT.initialScore}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-primary/20"
                  onClick={() => router.push(selectedRole === 'FREELANCER' ? '/jobs' : '/create-job')}
                >
                  {selectedRole === 'FREELANCER' ? '🔍 Browse Jobs' : '📝 Post a Job'}
                </button>
                <button 
                  className={`px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105 ${
                    isDarkMode
                      ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900 border border-gray-300'
                  }`}
                  onClick={() => router.push('/profile')}
                >
                  👤 View Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
      <Footer isDarkMode={isDarkMode} />
    </div>
  )
}

