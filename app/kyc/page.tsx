'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/contexts/WalletContext'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import './KYCPage.css'

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
  const { connected, address, setUserRole } = useWallet()
  
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

  // Step 3: Mint initial reputation NFT
  const handleMintReputation = async () => {
    setLoading(true)
    try {
      toast.loading('Minting reputation NFT...', { duration: 2000 })
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mock NFT minting - in production, this would call Cardano transaction
      const mockNFT = {
        policyId: `policy_${Date.now()}`,
        assetName: `reputation_${address.slice(0, 10)}`,
        txHash: `tx_${Math.random().toString(36).substring(7)}`,
        utxoRef: `${Math.random().toString(36).substring(7)}#0`,
        initialScore: 0
      }
      
      setReputationNFT(mockNFT)

      // Update user profile with NFT info
      const response = await fetch(`/api/users/profile/${address}/reputation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyId: mockNFT.policyId,
          assetName: mockNFT.assetName,
          txHash: mockNFT.txHash,
          utxoRef: mockNFT.utxoRef
        })
      })

      if (response.ok) {
        toast.success('🎉 Reputation NFT minted!')
        setCurrentStep('complete')
      } else {
        throw new Error('Failed to record NFT')
      }
    } catch (error) {
      console.error('Error minting NFT:', error)
      toast.error('Failed to mint reputation NFT')
    } finally {
      setLoading(false)
    }
  }

  if (!connected) {
    return (
      <div className="kyc-page">
        <div className="card">
          <h1>🆔 Account Setup</h1>
          <p>Please connect your wallet to create your account</p>
        </div>
      </div>
    )
  }

  return (
    <div className="kyc-page">
      <h1>🚀 Account Setup & Verification</h1>
      
      {/* Progress Steps */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div className={currentStep === 'role' ? 'step-active' : 'step-complete'}>
            <div className="step-number">1</div>
            <div className="step-title">Select Role</div>
          </div>
          <div className="step-line"></div>
          <div className={currentStep === 'kyc' ? 'step-active' : currentStep === 'role' ? 'step-pending' : 'step-complete'}>
            <div className="step-number">2</div>
            <div className="step-title">KYC & DID</div>
          </div>
          <div className="step-line"></div>
          <div className={currentStep === 'mint' ? 'step-active' : currentStep === 'complete' ? 'step-complete' : 'step-pending'}>
            <div className="step-number">3</div>
            <div className="step-title">Mint NFT</div>
          </div>
          <div className="step-line"></div>
          <div className={currentStep === 'complete' ? 'step-complete' : 'step-pending'}>
            <div className="step-number">4</div>
            <div className="step-title">Complete</div>
          </div>
        </div>
      </div>

      {/* Step 1: Role Selection */}
      {currentStep === 'role' && (
        <div className="grid grid-2">
          <div 
            className={`role-card ${selectedRole === 'FREELANCER' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('FREELANCER')}
          >
            <div className="role-icon">👨‍💻</div>
            <h2>Freelancer</h2>
            <p>Browse jobs, submit proposals, and earn crypto</p>
            <ul>
              <li>✅ Access to all job listings</li>
              <li>✅ Submit unlimited proposals</li>
              <li>✅ Build your reputation</li>
              <li>✅ Escrow protection</li>
            </ul>
          </div>
          
          <div 
            className={`role-card ${selectedRole === 'EMPLOYER' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('EMPLOYER')}
          >
            <div className="role-icon">💼</div>
            <h2>Employer</h2>
            <p>Post jobs, hire talent, and build your team</p>
            <ul>
              <li>✅ Post unlimited jobs</li>
              <li>✅ Review proposals & hire</li>
              <li>✅ Escrow payment system</li>
              <li>✅ Dispute resolution</li>
            </ul>
          </div>
        </div>
      )}

      {currentStep === 'role' && (
        <div className="card" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button 
            className="btn btn-primary"
            onClick={handleRoleSelection}
            disabled={!selectedRole || loading}
            style={{ minWidth: '200px' }}
          >
            {loading ? 'Creating Account...' : 'Continue to KYC'}
          </button>
        </div>
      )}

      {/* Step 2: KYC Verification */}
      {currentStep === 'kyc' && (
        <div className="grid grid-2">
          <div className="card">
            <h2>🆔 KYC Verification</h2>
            <p>Complete KYC verification to unlock all platform features</p>
            
            <div className="form-group">
              <label className="form-label">Verification Level</label>
              <select 
                className="form-select" 
                value={kycLevel} 
                onChange={(e) => setKycLevel(e.target.value as KYCLevel)}
              >
                <option value="basic">Basic - Trust Score 30</option>
                <option value="advanced">Advanced - Trust Score 70</option>
                <option value="full">Full - Trust Score 100</option>
              </select>
            </div>

            <div className="info-box">
              <h4>Mock DID Generation</h4>
              <p>We'll generate a decentralized identifier (DID) for your account using mock Atala PRISM</p>
            </div>

            <button 
              className="btn btn-primary"
              onClick={handleKYCVerification}
              disabled={loading}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              {loading ? 'Verifying...' : 'Verify KYC & Generate DID'}
            </button>
          </div>

          <div className="card">
            <h2>About Verification Levels</h2>
            
            <div className="level-info">
              <h4>📧 Basic (Trust Score: 30)</h4>
              <ul>
                <li>Email verification</li>
                <li>Access to small jobs</li>
              </ul>
            </div>

            <div className="level-info">
              <h4>🎯 Advanced (Trust Score: 70)</h4>
              <ul>
                <li>Email + Government ID</li>
                <li>Access to medium jobs</li>
                <li>Lower escrow fees</li>
              </ul>
            </div>

            <div className="level-info">
              <h4>🏆 Full (Trust Score: 100)</h4>
              <ul>
                <li>Complete verification</li>
                <li>Biometric + Address proof</li>
                <li>Access to all jobs</li>
                <li>Priority listings</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Mint Reputation NFT */}
      {currentStep === 'mint' && (
        <div className="card" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <h2>🎨 Mint Reputation NFT</h2>
          <p>Initialize your on-chain reputation by minting a reputation NFT</p>
          
          {mockDid && (
            <div className="did-box" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <strong>Your DID:</strong>
              <code style={{ fontSize: '0.8rem', wordBreak: 'break-all', display: 'block', marginTop: '0.5rem' }}>
                {mockDid}
              </code>
            </div>
          )}

          <div className="info-box" style={{ marginBottom: '1.5rem' }}>
            <h4>What is Reputation NFT?</h4>
            <p>Your reputation NFT is a unique token on the Cardano blockchain that tracks your:</p>
            <ul style={{ textAlign: 'left', marginTop: '1rem' }}>
              <li>✅ Job completion rate</li>
              <li>✅ Trust score</li>
              <li>✅ Client ratings</li>
              <li>✅ Dispute history</li>
            </ul>
          </div>

          <button 
            className="btn btn-primary"
            onClick={handleMintReputation}
            disabled={loading}
            style={{ minWidth: '250px' }}
          >
            {loading ? 'Minting NFT...' : '🎨 Mint Reputation NFT'}
          </button>
        </div>
      )}

      {/* Step 4: Complete */}
      {currentStep === 'complete' && (
        <div className="card" style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2>Account Setup Complete!</h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
            Welcome to DecentGigs, {selectedRole?.toLowerCase()}!
          </p>

          <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
            <div className="success-box">
              <h4>✅ Role</h4>
              <p>{selectedRole}</p>
            </div>
            <div className="success-box">
              <h4>✅ KYC Status</h4>
              <p>Verified - {kycLevel} level</p>
            </div>
          </div>

          {mockDid && (
            <div className="did-box" style={{ marginBottom: '1.5rem' }}>
              <strong>Your DID:</strong>
              <code style={{ fontSize: '0.75rem', wordBreak: 'break-all', display: 'block', marginTop: '0.5rem' }}>
                {mockDid}
              </code>
            </div>
          )}

          {reputationNFT && (
            <div className="nft-box" style={{ marginBottom: '2rem' }}>
              <h4>🎨 Reputation NFT Minted</h4>
              <p><strong>Policy ID:</strong> <code style={{ fontSize: '0.75rem' }}>{reputationNFT.policyId}</code></p>
              <p><strong>Asset Name:</strong> <code>{reputationNFT.assetName}</code></p>
              <p><strong>Initial Score:</strong> {reputationNFT.initialScore}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              className="btn btn-primary"
              onClick={() => router.push(selectedRole === 'FREELANCER' ? '/jobs' : '/create-job')}
            >
              {selectedRole === 'FREELANCER' ? '🔍 Browse Jobs' : '📝 Post a Job'}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => router.push('/profile')}
            >
              👤 View Profile
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
