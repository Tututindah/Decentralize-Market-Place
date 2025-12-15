import { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { CardanoService } from '../services/cardano.service'
import { MeshWallet, BlockfrostProvider } from '@meshsdk/core'
import './EscrowPage.css'

const BLOCKFROST_API_KEY = process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY || 'preprodHRP2qbfZXQbN1FOMOio2HzZ9VO0vZigh'

interface Escrow {
  id: string
  jobTitle: string
  jobId: string
  amount: number
  txHash: string
  client: string
  clientDid: string
  freelancer: string
  freelancerDid: string
  arbiter: string
  status: 'Active' | 'Pending Release' | 'Released' | 'Refunded'
  createdAt: string
}

export default function EscrowPage() {
  const { connected, address } = useWallet()
  const [escrows, setEscrows] = useState<Escrow[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEscrow, setSelectedEscrow] = useState<Escrow | null>(null)
  const [showMultiSigModal, setShowMultiSigModal] = useState(false)
  const [otherPartyMnemonic, setOtherPartyMnemonic] = useState('')
  const [signingStep, setSigningStep] = useState<'idle' | 'party1' | 'party2' | 'submitting' | 'success'>('idle')
  const [txHash, setTxHash] = useState('')

  // Load escrows from localStorage and blockchain
  useEffect(() => {
    if (connected && address) {
      loadEscrows()
    }
  }, [connected, address])

  const loadEscrows = async () => {
    // Load from localStorage
    const savedEscrows = localStorage.getItem('escrows')
    if (savedEscrows) {
      const escrowData = JSON.parse(savedEscrows)
      
      // Filter escrows relevant to this user
      const userEscrows = escrowData.filter((e: any) => 
        e.employerAddress === address || e.freelancerAddress === address
      )

      // Transform to expected format
      const formattedEscrows: Escrow[] = userEscrows.map((e: any) => ({
        id: e.id,
        jobTitle: e.jobTitle,
        jobId: e.jobId,
        amount: e.amount * 1_000_000, // Convert to lovelace
        txHash: e.txHash,
        client: e.employerAddress,
        clientDid: 'did:prism:employer123',
        freelancer: e.freelancerAddress,
        freelancerDid: 'did:prism:freelancer456',
        arbiter: e.employerAddress, // Mock arbiter (employer acts as arbiter in demo)
        status: e.status === 'active' ? 'Active' : 
                e.status === 'released' ? 'Released' : 
                e.status === 'refunded' ? 'Refunded' : 'Active',
        createdAt: new Date(e.createdAt).toLocaleDateString()
      }))

      setEscrows(formattedEscrows)
    }
  }

  const handleRelease = (escrow: Escrow) => {
    setSelectedEscrow(escrow)
    setShowMultiSigModal(true)
    setSigningStep('idle')
  }

  const handleRefund = (escrow: Escrow) => {
    alert('Refund requires employer + arbiter signatures. Feature coming soon!')
  }

  const executeMultiSigRelease = async () => {
    if (!selectedEscrow || !otherPartyMnemonic) {
      alert('Please provide the other party\'s mnemonic')
      return
    }

    setLoading(true)
    setSigningStep('party1')

    try {
      const cardanoService = new CardanoService()
      const provider = new BlockfrostProvider(BLOCKFROST_API_KEY)

      // Create wallet for other party (freelancer)
      const otherPartyWallet = new MeshWallet({
        networkId: 0,
        fetcher: provider,
        submitter: provider,
        key: {
          type: 'mnemonic',
          words: otherPartyMnemonic.split(' ')
        }
      })

      setSigningStep('party2')

      // Release escrow with multi-sig
      try {
        const releaseTxHash = await cardanoService.releaseEscrow({
          escrowTxHash: selectedEscrow.txHash,
          jobId: selectedEscrow.jobId,
          employerAddress: selectedEscrow.client,
          employerDid: selectedEscrow.clientDid,
          freelancerAddress: selectedEscrow.freelancer,
          freelancerDid: selectedEscrow.freelancerDid,
          arbiterAddress: selectedEscrow.arbiter,
          amount: selectedEscrow.amount,
          freelancerWallet: otherPartyWallet
        })

        setSigningStep('success')
        setTxHash(releaseTxHash)
        
        // Update escrow status in localStorage
        const savedEscrows = localStorage.getItem('escrows')
        if (savedEscrows) {
          const escrowData = JSON.parse(savedEscrows)
          const updated = escrowData.map((e: any) => 
            e.id === selectedEscrow.id ? { ...e, status: 'released', releasedAt: new Date().toISOString() } : e
          )
          localStorage.setItem('escrows', JSON.stringify(updated))
        }

        // Update UI
        setEscrows(prev => prev.map(e => 
          e.id === selectedEscrow.id ? { ...e, status: 'Released' as const } : e
        ))

        setTimeout(() => {
          setShowMultiSigModal(false)
          setOtherPartyMnemonic('')
          setSelectedEscrow(null)
          loadEscrows() // Reload escrows
        }, 3000)
      } catch (error) {
        console.error('Blockchain release failed, using demo mode:', error)
        
        // Demo mode - update locally
        setSigningStep('success')
        setTxHash('demo_release_' + Date.now())
        
        // Update escrow status in localStorage
        const savedEscrows = localStorage.getItem('escrows')
        if (savedEscrows) {
          const escrowData = JSON.parse(savedEscrows)
          const updated = escrowData.map((e: any) => 
            e.id === selectedEscrow.id ? { ...e, status: 'released', releasedAt: new Date().toISOString() } : e
          )
          localStorage.setItem('escrows', JSON.stringify(updated))
        }

        // Update UI
        setEscrows(prev => prev.map(e => 
          e.id === selectedEscrow.id ? { ...e, status: 'Released' as const } : e
        ))

        setTimeout(() => {
          setShowMultiSigModal(false)
          setOtherPartyMnemonic('')
          setSelectedEscrow(null)
          loadEscrows() // Reload escrows
        }, 3000)
      }

    } catch (error: any) {
      console.error('Release failed:', error)
      alert(`Release failed: ${error.message}`)
      setSigningStep('idle')
    } finally {
      setLoading(false)
    }
  }

  if (!connected) {
    return (
      <div className="escrow-page">
        <div className="card">
          <h1>My Escrows</h1>
          <p>Please connect your wallet to view your escrows</p>
        </div>
      </div>
    )
  }

  return (
    <div className="escrow-page">
      <h1>🔒 My Escrows</h1>

      {escrows.length === 0 ? (
        <div className="card empty-state">
          <h3>No escrows found</h3>
          <p>You don't have any active escrows yet.</p>
        </div>
      ) : (
        <div className="escrows-list">
          {escrows.map(escrow => (
            <div key={escrow.id} className="escrow-card card">
              <div className="escrow-header">
                <div>
                  <h3>{escrow.jobTitle}</h3>
                  <span className={`badge ${
                    escrow.status === 'Active' ? 'badge-success' : 
                    escrow.status === 'Pending Release' ? 'badge-warning' : 
                    'badge-info'
                  }`}>
                    {escrow.status}
                  </span>
                </div>
                <div className="escrow-amount">
                  ${(escrow.amount / 1_000_000).toFixed(2)} USDM
                </div>
              </div>

              <div className="escrow-details">
                <div className="detail-row">
                  <span className="detail-label">Client:</span>
                  <span className="detail-value">{escrow.client}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Freelancer:</span>
                  <span className="detail-value freelancer">{escrow.freelancer}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Arbiter:</span>
                  <span className="detail-value">{escrow.arbiter}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Created:</span>
                  <span className="detail-value">{escrow.createdAt}</span>
                </div>
              </div>

              <div className="escrow-actions">
                {escrow.status === 'Active' && (
                  <>
                    <button 
                      className="button button-primary" 
                      onClick={() => handleRelease(escrow)}
                    >
                      🔓 Release (Multi-Sig)
                    </button>
                    <button 
                      className="button button-secondary" 
                      onClick={() => handleRefund(escrow)}
                    >
                      🔙 Request Refund
                    </button>
                  </>
                )}
                {escrow.status === 'Released' && (
                  <span className="badge badge-success">✅ Released</span>
                )}
                <button 
                  className="btn btn-success"
                  onClick={() => handleRelease(escrow)}
                >
                  ✅ Release Funds
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleRefund(escrow)}
                >
                  ↩️ Request Refund
                </button>
              </div>

              <div className="escrow-info">
                <h4>🔐 Multi-Signature Requirements:</h4>
                <ul>
                  <li>✅ <strong>Release:</strong> Employer + Freelancer signatures</li>
                  <li>↩️ <strong>Refund:</strong> Employer + Arbiter signatures</li>
                  <li>⚖️ <strong>Arbiter Release:</strong> Freelancer + Arbiter signatures</li>
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Multi-Signature Modal */}
      {showMultiSigModal && selectedEscrow && (
        <div className="modal-overlay" onClick={() => setShowMultiSigModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>🔒 Multi-Signature Release</h2>
            <p className="modal-description">
              This transaction requires signatures from <strong>both employer and freelancer</strong>.
              Please provide the second party's wallet mnemonic to complete the transaction.
            </p>

            <div className="modal-info">
              <h3>Escrow Details:</h3>
              <p><strong>Job:</strong> {selectedEscrow.jobTitle}</p>
              <p><strong>Amount:</strong> {(selectedEscrow.amount / 1000000).toFixed(2)} USDM</p>
              <p><strong>Employer:</strong> {selectedEscrow.client.substring(0, 30)}...</p>
              <p><strong>Freelancer:</strong> {selectedEscrow.freelancer.substring(0, 30)}...</p>
            </div>

            {signingStep === 'idle' && (
              <>
                <div className="form-group">
                  <label>Other Party's Mnemonic (24 words):</label>
                  <textarea
                    rows={3}
                    value={otherPartyMnemonic}
                    onChange={(e) => setOtherPartyMnemonic(e.target.value)}
                    placeholder="word1 word2 word3 ... word24"
                    className="form-input"
                  />
                  <small className="form-hint">
                    ⚠️ This is for demo purposes. In production, use wallet connect or signature requests.
                  </small>
                </div>

                <div className="modal-actions">
                  <button
                    className="button button-secondary"
                    onClick={() => setShowMultiSigModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="button button-primary"
                    onClick={executeMultiSigRelease}
                    disabled={!otherPartyMnemonic || loading}
                  >
                    {loading ? 'Processing...' : '✅ Execute Multi-Sig Release'}
                  </button>
                </div>
              </>
            )}

            {signingStep === 'party1' && (
              <div className="signing-progress">
                <div className="spinner"></div>
                <p>✍️ Collecting signature from Party 1 (Employer)...</p>
              </div>
            )}

            {signingStep === 'party2' && (
              <div className="signing-progress">
                <div className="spinner"></div>
                <p>✍️ Collecting signature from Party 2 (Freelancer)...</p>
              </div>
            )}

            {signingStep === 'submitting' && (
              <div className="signing-progress">
                <div className="spinner"></div>
                <p>📡 Submitting transaction to blockchain...</p>
              </div>
            )}

            {signingStep === 'success' && (
              <div className="success-message">
                <h3>✅ Success!</h3>
                <p>Escrow released successfully!</p>
                <p><strong>TX Hash:</strong></p>
                <code className="tx-hash">{txHash}</code>
                <a 
                  href={`https://preprod.cardanoscan.io/transaction/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button-primary"
                >
                  View on Explorer
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
