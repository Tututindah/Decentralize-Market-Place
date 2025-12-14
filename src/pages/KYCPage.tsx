import { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { toast } from 'react-hot-toast'
import './KYCPage.css'

export default function KYCPage() {
  const { connected, address, did: walletDid, role } = useWallet()
  const [kycLevel, setKycLevel] = useState<'basic' | 'advanced' | 'full'>('basic')
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [kycData, setKycData] = useState<any>(null)

  // Load existing KYC status
  useEffect(() => {
    if (connected && address) {
      const savedKyc = localStorage.getItem(`kyc_${address}`)
      if (savedKyc) {
        const data = JSON.parse(savedKyc)
        setKycData(data)
        setVerified(true)
        setKycLevel(data.level)
      }
    }
  }, [connected, address])

  const handleKYC = async () => {
    if (!connected || !walletDid) {
      toast.error('Please connect your wallet first')
      return
    }

    setVerifying(true)

    try {
      // Simulate KYC process with mock verification
      await new Promise(resolve => setTimeout(resolve, 2000))

      const kycRecord = {
        did: walletDid,
        address,
        role,
        level: kycLevel,
        verifiedAt: new Date().toISOString(),
        credentials: {
          email: kycLevel === 'basic' || kycLevel === 'advanced' || kycLevel === 'full',
          identity: kycLevel === 'advanced' || kycLevel === 'full',
          proofOfAddress: kycLevel === 'full',
          biometric: kycLevel === 'full'
        }
      }

      // Store KYC status
      localStorage.setItem(`kyc_${address}`, JSON.stringify(kycRecord))
      localStorage.setItem('userDid', walletDid)
      
      setKycData(kycRecord)
      setVerified(true)
      
      toast.success(`✅ ${kycLevel} KYC verified successfully!`)
      console.log('✅ KYC verified!')
      console.log('DID:', walletDid)
    } catch (error) {
      toast.error('KYC verification failed')
    } finally {
      setVerifying(false)
    }
  }

  if (!connected) {
    return (
      <div className="kyc-page">
        <div className="card">
          <h1>KYC Verification</h1>
          <p>Please connect your wallet to start KYC verification</p>
        </div>
      </div>
    )
  }

  return (
    <div className="kyc-page">
      <h1>🆔 KYC Verification with Atala PRISM</h1>

      <div className="grid grid-2">
        <div className="card">
          <h2>Your Identity Status</h2>
          
          {!verified ? (
            <>
              <div className="status-badge badge-warning">
                ⚠️ Not Verified
              </div>
              <p>Complete KYC to increase trust and access more opportunities</p>
              {walletDid && (
                <div className="did-box" style={{ marginTop: '1rem' }}>
                  <strong>Your DID (from wallet):</strong>
                  <code style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{walletDid}</code>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="status-badge badge-success">
                ✅ Verified - {kycLevel} Level
              </div>
              <div className="did-box">
                <strong>Your DID:</strong>
                <code style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{kycData?.did}</code>
              </div>
              <div className="kyc-info" style={{ marginTop: '1rem' }}>
                <p><strong>Role:</strong> {kycData?.role}</p>
                <p><strong>Verified:</strong> {new Date(kycData?.verifiedAt).toLocaleDateString()}</p>
                <div style={{ marginTop: '0.5rem' }}>
                  <strong>Credentials:</strong>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                    {kycData?.credentials.email && <li>✅ Email Verified</li>}
                    {kycData?.credentials.identity && <li>✅ Identity Document</li>}
                    {kycData?.credentials.proofOfAddress && <li>✅ Proof of Address</li>}
                    {kycData?.credentials.biometric && <li>✅ Biometric Verification</li>}
                  </ul>
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Verification Level</label>
            <select 
              className="form-select" 
              value={kycLevel} 
              onChange={(e) => setKycLevel(e.target.value as any)}
              disabled={verified}
            >
              <option value="basic">Basic (Email only)</option>
              <option value="advanced">Advanced (Email + ID)</option>
              <option value="full">Full (Complete verification)</option>
            </select>
          </div>

          {!verified && (
            <button 
              className="btn btn-primary" 
              onClick={handleKYC}
              disabled={verifying}
              style={{ width: '100%' }}
            >
              {verifying ? 'Verifying...' : `Start ${kycLevel} Verification`}
            </button>
          )}
        </div>

        <div className="card">
          <h2>About Atala PRISM</h2>
          
          <div className="info-section">
            <h3>🔐 Self-Sovereign Identity</h3>
            <p>Your identity, your control. Store and manage credentials without central authority.</p>
          </div>

          <div className="info-section">
            <h3>🌐 Decentralized Identifiers (DIDs)</h3>
            <p>Unique identifiers stored on Cardano blockchain for verification.</p>
          </div>

          <div className="info-section">
            <h3>✅ Verifiable Credentials</h3>
            <p>Cryptographically signed credentials that prove your identity.</p>
          </div>

          <div className="info-section">
            <h3>🔒 Privacy-Preserving</h3>
            <p>Share only what's necessary. Zero-knowledge proofs protect your data.</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Verification Levels</h2>
        <div className="grid grid-3">
          <div className="level-card">
            <h3>📧 Basic</h3>
            <div className="badge badge-info">Trust Score: 30</div>
            <ul>
              <li>Email verification</li>
              <li>Basic profile</li>
              <li>Access to small jobs</li>
            </ul>
          </div>

          <div className="level-card">
            <h3>🎯 Advanced</h3>
            <div className="badge badge-success">Trust Score: 70</div>
            <ul>
              <li>Email + Phone</li>
              <li>Government ID</li>
              <li>Access to medium jobs</li>
              <li>Lower escrow requirements</li>
            </ul>
          </div>

          <div className="level-card">
            <h3>🏆 Full</h3>
            <div className="badge badge-success">Trust Score: 100</div>
            <ul>
              <li>Complete verification</li>
              <li>Biometric data</li>
              <li>Address proof</li>
              <li>Access to all jobs</li>
              <li>Priority listings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
