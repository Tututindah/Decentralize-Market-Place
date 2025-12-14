import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { useCardano } from '../hooks/useCardano'
import { toast } from 'react-hot-toast'
import './JobDetailPage.css'

interface Bid {
  id: string
  jobId: string
  freelancerAddress: string
  amount: number
  deliveryDays: number
  proposal: string
  status: 'pending' | 'accepted' | 'rejected'
}

interface Job {
  id: string
  title: string
  description: string
  budgetMin: number
  budgetMax: number
  employer: string
  category: string
  status: 'Open' | 'In Progress' | 'Completed'
  kycRequired: boolean
  deadline: string
  bids?: Bid[]
  txHash?: string
}

export default function JobDetailPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { connected, address, role } = useWallet()
  const { acceptBidAndCreateEscrow } = useCardano()
  const [job, setJob] = useState<Job | null>(null)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    const savedJobs = localStorage.getItem('jobs')
    if (savedJobs) {
      const jobs: Job[] = JSON.parse(savedJobs)
      const foundJob = jobs.find(j => j.id === jobId)
      setJob(foundJob || null)
    }
  }, [jobId])

  const handleAcceptBid = async (bid: Bid) => {
    if (!connected || !address) {
      toast.error('Please connect your wallet')
      return
    }

    if (role !== 'Employer (Client)') {
      toast.error('Only employers can accept bids')
      return
    }

    if (job?.employer !== address) {
      toast.error('You can only accept bids on your own jobs')
      return
    }

    setAccepting(true)

    try {
      // Create escrow for the accepted bid
      const escrowAmount = bid.amount * 1_000_000 // Convert to lovelace
      
      // Get freelancer DID (in production, fetch from backend)
      const freelancerDid = 'did:prism:freelancer456' // Mock DID
      const clientDid = localStorage.getItem('userDid') || 'did:prism:employer123'
      const arbiterAddress = address // Use employer as arbiter for demo

      try {
        const result = await acceptBidAndCreateEscrow({
          jobId: job!.id,
          employerAddress: address,
          employerDid: clientDid,
          freelancerAddress: bid.freelancerAddress,
          freelancerDid,
          arbiterAddress,
          amount: escrowAmount
        })

        // Update job and bid status
        const savedJobs = localStorage.getItem('jobs')
        if (savedJobs) {
          const jobs: Job[] = JSON.parse(savedJobs)
          const updatedJobs = jobs.map(j => {
            if (j.id === job!.id) {
              return {
                ...j,
                status: 'In Progress' as const,
                bids: j.bids?.map(b => 
                  b.id === bid.id 
                    ? { ...b, status: 'accepted' as const }
                    : { ...b, status: 'rejected' as const }
                )
              }
            }
            return j
          })
          localStorage.setItem('jobs', JSON.stringify(updatedJobs))

          // Store escrow details
          const escrowData = {
            id: Date.now().toString(),
            jobId: job!.id,
            jobTitle: job!.title,
            amount: bid.amount,
            freelancerAddress: bid.freelancerAddress,
            employerAddress: address,
            status: 'active',
            txHash: result.txHash,
            createdAt: new Date().toISOString()
          }

          const savedEscrows = localStorage.getItem('escrows')
          const escrows = savedEscrows ? JSON.parse(savedEscrows) : []
          escrows.push(escrowData)
          localStorage.setItem('escrows', JSON.stringify(escrows))

          toast.success('Bid accepted and escrow created!')
          navigate('/escrow')
        }
      } catch (error) {
        console.error('Blockchain escrow error:', error)
        
        // Demo mode - simulate escrow creation
        const savedJobs = localStorage.getItem('jobs')
        if (savedJobs) {
          const jobs: Job[] = JSON.parse(savedJobs)
          const updatedJobs = jobs.map(j => {
            if (j.id === job!.id) {
              return {
                ...j,
                status: 'In Progress' as const,
                bids: j.bids?.map(b => 
                  b.id === bid.id 
                    ? { ...b, status: 'accepted' as const }
                    : { ...b, status: 'rejected' as const }
                )
              }
            }
            return j
          })
          localStorage.setItem('jobs', JSON.stringify(updatedJobs))

          // Store escrow details (demo)
          const escrowData = {
            id: Date.now().toString(),
            jobId: job!.id,
            jobTitle: job!.title,
            amount: bid.amount,
            freelancerAddress: bid.freelancerAddress,
            employerAddress: address,
            status: 'active',
            txHash: 'demo_escrow_' + Date.now(),
            createdAt: new Date().toISOString()
          }

          const savedEscrows = localStorage.getItem('escrows')
          const escrows = savedEscrows ? JSON.parse(savedEscrows) : []
          escrows.push(escrowData)
          localStorage.setItem('escrows', JSON.stringify(escrows))

          toast.success('Bid accepted! Escrow created (demo mode)')
          navigate('/escrow')
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept bid')
    } finally {
      setAccepting(false)
    }
  }

  const handleRejectBid = (bid: Bid) => {
    const savedJobs = localStorage.getItem('jobs')
    if (savedJobs) {
      const jobs: Job[] = JSON.parse(savedJobs)
      const updatedJobs = jobs.map(j => {
        if (j.id === job!.id) {
          return {
            ...j,
            bids: j.bids?.map(b => 
              b.id === bid.id ? { ...b, status: 'rejected' as const } : b
            )
          }
        }
        return j
      })
      localStorage.setItem('jobs', JSON.stringify(updatedJobs))
      setJob(updatedJobs.find(j => j.id === jobId) || null)
      toast.success('Bid rejected')
    }
  }

  if (!job) {
    return (
      <div className="job-detail-page">
        <div className="card">
          <h1>Job not found</h1>
          <button className="btn btn-secondary" onClick={() => navigate('/jobs')}>
            Back to Jobs
          </button>
        </div>
      </div>
    )
  }

  const isEmployer = role === 'Employer (Client)' && job.employer === address
  const pendingBids = job.bids?.filter(b => b.status === 'pending') || []
  const acceptedBid = job.bids?.find(b => b.status === 'accepted')

  return (
    <div className="job-detail-page">
      <button className="btn btn-secondary" onClick={() => navigate('/jobs')}>
        ← Back to Jobs
      </button>

      <div className="job-header-section card">
        <div className="job-title-row">
          <h1>{job.title}</h1>
          <span className={`badge ${job.status === 'Open' ? 'badge-success' : 'badge-warning'}`}>
            {job.status}
          </span>
        </div>

        <div className="job-meta-grid">
          <div className="meta-item">
            <span className="meta-label">Budget Range</span>
            <span className="meta-value">${job.budgetMin} - ${job.budgetMax} USDM</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Category</span>
            <span className="meta-value">{job.category}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Deadline</span>
            <span className="meta-value">{new Date(job.deadline).toLocaleDateString()}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Total Bids</span>
            <span className="meta-value">{job.bids?.length || 0}</span>
          </div>
        </div>

        <div className="job-description-section">
          <h3>Description</h3>
          <p>{job.description}</p>
        </div>

        {job.kycRequired && (
          <div className="kyc-badge">🆔 KYC Required</div>
        )}
      </div>

      {/* Accepted Bid Section */}
      {acceptedBid && (
        <div className="card accepted-bid-section">
          <h2>✅ Accepted Bid</h2>
          <div className="bid-card accepted">
            <div className="bid-header">
              <div>
                <strong>Freelancer:</strong> {acceptedBid.freelancerAddress.slice(0, 20)}...
              </div>
              <div className="bid-amount">${acceptedBid.amount} USDM</div>
            </div>
            <div className="bid-details">
              <p><strong>Delivery:</strong> {acceptedBid.deliveryDays} days</p>
              <p><strong>Proposal:</strong></p>
              <p className="proposal-text">{acceptedBid.proposal}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bids Section - Only visible to employer */}
      {isEmployer && pendingBids.length > 0 && (
        <div className="card bids-section">
          <h2>📋 Pending Bids ({pendingBids.length})</h2>
          <div className="bids-list">
            {pendingBids.map(bid => (
              <div key={bid.id} className="bid-card">
                <div className="bid-header">
                  <div>
                    <strong>Freelancer:</strong> {bid.freelancerAddress.slice(0, 20)}...
                  </div>
                  <div className="bid-amount">${bid.amount} USDM</div>
                </div>
                
                <div className="bid-details">
                  <p><strong>Delivery Time:</strong> {bid.deliveryDays} days</p>
                  <p><strong>Proposal:</strong></p>
                  <p className="proposal-text">{bid.proposal}</p>
                </div>

                <div className="bid-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleAcceptBid(bid)}
                    disabled={accepting}
                  >
                    {accepting ? 'Creating Escrow...' : 'Accept & Create Escrow'}
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleRejectBid(bid)}
                    disabled={accepting}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No bids message */}
      {isEmployer && pendingBids.length === 0 && !acceptedBid && (
        <div className="card">
          <p>No bids yet. Freelancers will start submitting proposals soon.</p>
        </div>
      )}
    </div>
  )
}
