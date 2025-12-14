import { useState } from 'react'
import { useCardano } from '../hooks/useCardano'
import { toast } from 'react-hot-toast'
import './EscrowManager.css'

interface Bid {
  id: string
  freelancerAddress: string
  freelancerDid: string
  freelancerName: string
  amount: number
  proposal: string
  deliveryTime: string
}

interface EscrowManagerProps {
  jobId: string
  jobTitle: string
  bids: Bid[]
  isEmployer: boolean
}

export default function EscrowManager({ jobId, jobTitle, bids, isEmployer }: EscrowManagerProps) {
  const { acceptBidAndCreateEscrow, releaseEscrow, loading } = useCardano()
  const [selectedBid, setSelectedBid] = useState<string | null>(null)
  const [escrowCreated, setEscrowCreated] = useState(false)
  const [escrowTxHash, setEscrowTxHash] = useState<string | null>(null)

  const handleAcceptBid = async (bid: Bid) => {
    if (!isEmployer) {
      toast.error('Only the employer can accept bids')
      return
    }

    const confirm = window.confirm(
      `Accept bid from ${bid.freelancerName} for ${bid.amount} USDM?\n\n` +
      `This will:\n` +
      `1. Create an escrow with ${bid.amount} USDM locked\n` +
      `2. Assign the job to ${bid.freelancerName}\n` +
      `3. Start the delivery countdown\n\n` +
      `Continue?`
    )

    if (!confirm) return

    try {
      setSelectedBid(bid.id)
      
      const result = await acceptBidAndCreateEscrow({
        jobId,
        freelancerAddress: bid.freelancerAddress,
        freelancerDid: bid.freelancerDid,
        amount: bid.amount,
        deadline: new Date(Date.now() + parseInt(bid.deliveryTime) * 24 * 60 * 60 * 1000),
      })

      setEscrowCreated(true)
      setEscrowTxHash(result.txHash)
      
      toast.success('Escrow created successfully! Job assigned.')
    } catch (error: any) {
      console.error('Escrow creation error:', error)
      toast.error(error.message || 'Failed to create escrow')
    } finally {
      setSelectedBid(null)
    }
  }

  const handleReleaseEscrow = async () => {
    const confirm = window.confirm(
      `Release escrow funds?\n\n` +
      `This requires multi-signature:\n` +
      `1. You (employer) will sign first\n` +
      `2. Freelancer must sign to complete\n` +
      `3. Funds will be released to freelancer\n\n` +
      `Continue?`
    )

    if (!confirm) return

    try {
      // This will handle the multi-sig process
      await releaseEscrow({
        jobId,
        escrowTxHash: escrowTxHash!,
      })

      toast.success('Escrow released successfully!')
    } catch (error: any) {
      console.error('Release error:', error)
      toast.error(error.message || 'Failed to release escrow')
    }
  }

  if (escrowCreated) {
    return (
      <div className="escrow-manager">
        <div className="card success-card">
          <h3>✅ Escrow Active</h3>
          <p>Job assigned with secure escrow protection</p>
          
          {escrowTxHash && (
            <div className="tx-info">
              <p><strong>Transaction Hash:</strong></p>
              <code>{escrowTxHash}</code>
              <a 
                href={`https://preprod.cardanoscan.io/transaction/${escrowTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-small"
              >
                View on Cardanoscan →
              </a>
            </div>
          )}

          <div className="escrow-actions">
            <button 
              className="btn btn-success"
              onClick={handleReleaseEscrow}
              disabled={loading}
            >
              {loading ? '⏳ Processing...' : '🔓 Release Escrow (Multi-Sig)'}
            </button>
            
            <div className="info-box">
              <p>
                <strong>ℹ️ Multi-Signature Required:</strong><br />
                Both you (employer) and the freelancer must sign to release funds.
                This ensures secure, trustless payment processing.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="escrow-manager">
      <h3>📋 Bids ({bids.length})</h3>

      {bids.length === 0 ? (
        <div className="card empty-state">
          <p>No bids yet. Share this job to attract freelancers!</p>
        </div>
      ) : (
        <div className="bids-list">
          {bids.map(bid => (
            <div key={bid.id} className="card bid-card">
              <div className="bid-header">
                <div>
                  <h4>{bid.freelancerName}</h4>
                  <p className="address">{bid.freelancerAddress.slice(0, 20)}...</p>
                  <span className="badge">✓ KYC Verified</span>
                </div>
                <div className="bid-amount">
                  <span className="amount">{bid.amount.toLocaleString()} USDM</span>
                  <span className="delivery">{bid.deliveryTime} days</span>
                </div>
              </div>

              <div className="bid-proposal">
                <p><strong>Proposal:</strong></p>
                <p>{bid.proposal}</p>
              </div>

              {isEmployer && (
                <div className="bid-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleAcceptBid(bid)}
                    disabled={loading || selectedBid !== null}
                  >
                    {selectedBid === bid.id ? '⏳ Creating Escrow...' : '✓ Accept & Create Escrow'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="info-box">
        <h4>ℹ️ How Escrow Works</h4>
        <ol>
          <li><strong>Accept Bid:</strong> When you accept, funds are locked in smart contract</li>
          <li><strong>Work Starts:</strong> Freelancer completes the work</li>
          <li><strong>Review:</strong> You review the deliverables</li>
          <li><strong>Multi-Sig Release:</strong> Both parties sign to release funds securely</li>
          <li><strong>Protection:</strong> Arbiter can help resolve disputes if needed</li>
        </ol>
      </div>
    </div>
  )
}
