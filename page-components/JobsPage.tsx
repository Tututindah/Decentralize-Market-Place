'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '../contexts/WalletContext'
import { toast } from 'react-hot-toast'
import './JobsPage.css'

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
}

export default function JobsPage() {
  const router = useRouter()
  const { connected, address, role } = useWallet()
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showBidModal, setShowBidModal] = useState(false)
  const [bidAmount, setBidAmount] = useState('')
  const [deliveryDays, setDeliveryDays] = useState('')
  const [proposal, setProposal] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Load jobs from localStorage
  useEffect(() => {
    const savedJobs = localStorage.getItem('jobs')
    if (savedJobs) {
      setJobs(JSON.parse(savedJobs))
    } else {
      // Initialize with mock data
      const mockJobs: Job[] = [
        {
          id: '1',
          title: 'Build DeFi Dashboard',
          description: 'Create a responsive dashboard for DeFi protocol with real-time charts',
          budgetMin: 5000,
          budgetMax: 8000,
          employer: 'addr1...xyz',
          category: 'Frontend',
          status: 'Open',
          kycRequired: true,
          deadline: '2024-03-01',
          bids: []
        },
        {
          id: '2',
          title: 'Smart Contract Audit',
          description: 'Security audit for NFT marketplace smart contracts',
          budgetMin: 8000,
          budgetMax: 12000,
          employer: 'addr1...abc',
          category: 'Security',
          status: 'Open',
          kycRequired: true,
          deadline: '2024-03-15',
          bids: []
        },
        {
          id: '3',
          title: 'Mobile Wallet App',
          description: 'Native mobile app for Cardano wallet with staking features',
          budgetMin: 10000,
          budgetMax: 15000,
          employer: 'addr1...def',
          category: 'Mobile',
          status: 'In Progress',
          kycRequired: false,
          deadline: '2024-04-01',
          bids: []
        }
      ]
      setJobs(mockJobs)
      localStorage.setItem('jobs', JSON.stringify(mockJobs))
    }
  }, [])

  const [filter, setFilter] = useState('all')

  const filteredJobs = filter === 'all' 
    ? jobs 
    : jobs.filter(job => job.status === filter || job.category === filter)

  const handleSubmitBid = async () => {
    if (!connected || !address) {
      toast.error('Please connect your wallet')
      return
    }

    if (role !== 'Freelancer') {
      toast.error('Only freelancers can submit bids')
      return
    }

    // Check KYC
    if (selectedJob?.kycRequired) {
      const kycStatus = localStorage.getItem(`kyc_${address}`)
      if (!kycStatus) {
        toast.error('This job requires KYC verification. Please complete KYC first.')
        return
      }
    }

    const amount = parseFloat(bidAmount)
    const days = parseInt(deliveryDays)

    if (!amount || amount < selectedJob!.budgetMin || amount > selectedJob!.budgetMax) {
      toast.error(`Bid amount must be between ${selectedJob!.budgetMin} and ${selectedJob!.budgetMax} USDM`)
      return
    }

    if (!days || days < 1) {
      toast.error('Please enter valid delivery days')
      return
    }

    if (!proposal.trim()) {
      toast.error('Please provide a proposal')
      return
    }

    setSubmitting(true)

    try {
      const newBid: Bid = {
        id: Date.now().toString(),
        jobId: selectedJob!.id,
        freelancerAddress: address,
        amount,
        deliveryDays: days,
        proposal,
        status: 'pending'
      }

      // Update job with new bid
      const updatedJobs = jobs.map(job => {
        if (job.id === selectedJob!.id) {
          return {
            ...job,
            bids: [...(job.bids || []), newBid]
          }
        }
        return job
      })

      setJobs(updatedJobs)
      localStorage.setItem('jobs', JSON.stringify(updatedJobs))

      toast.success('Bid submitted successfully!')
      setShowBidModal(false)
      setBidAmount('')
      setDeliveryDays('')
      setProposal('')
      setSelectedJob(null)
    } catch (error) {
      toast.error('Failed to submit bid')
    } finally {
      setSubmitting(false)
    }
  }

  const openBidModal = (job: Job) => {
    if (!connected) {
      toast.error('Please connect your wallet to submit a bid')
      router.push('/connect-wallet')
      return
    }
    if (!role) {
      toast.error('Please reconnect your wallet')
      return
    }
    setSelectedJob(job)
    setShowBidModal(true)
  }

  return (
    <div className="jobs-page">
      <div className="page-header">
        <h1>💼 Browse Jobs</h1>
        <div className="filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Jobs
          </button>
          <button 
            className={`filter-btn ${filter === 'Open' ? 'active' : ''}`}
            onClick={() => setFilter('Open')}
          >
            Open
          </button>
          <button 
            className={`filter-btn ${filter === 'Frontend' ? 'active' : ''}`}
            onClick={() => setFilter('Frontend')}
          >
            Frontend
          </button>
          <button 
            className={`filter-btn ${filter === 'Security' ? 'active' : ''}`}
            onClick={() => setFilter('Security')}
          >
            Security
          </button>
        </div>
      </div>

      <div className="jobs-grid">
        {filteredJobs.map(job => (
          <div key={job.id} className="job-card card">
            <div className="job-header">
              <h3>{job.title}</h3>
              <span className={`badge ${job.status === 'Open' ? 'badge-success' : 'badge-warning'}`}>
                {job.status}
              </span>
            </div>

            <p className="job-description">{job.description}</p>

            <div className="job-meta">
              <div className="meta-item">
                <span className="meta-label">Budget Range:</span>
                <span className="meta-value budget">${job.budgetMin} - ${job.budgetMax} USDM</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Category:</span>
                <span className="meta-value">{job.category}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Deadline:</span>
                <span className="meta-value">{new Date(job.deadline).toLocaleDateString()}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Bids:</span>
                <span className="meta-value">{job.bids?.length || 0}</span>
              </div>
            </div>

            {job.kycRequired && (
              <div className="kyc-badge">
                🆔 KYC Required
              </div>
            )}

            <div className="job-actions">
              {role === 'Freelancer' && job.status === 'Open' && (
                <>
                  <button className="btn btn-primary" onClick={() => openBidModal(job)}>
                    Submit Bid
                  </button>
                  <button className="btn btn-secondary" onClick={() => router.push(`/jobs/${job.id}`)}>
                    View Details
                  </button>
                </>
              )}
              {role === 'employer' && job.employer === address && (
                <>
                  <button className="btn btn-primary" onClick={() => router.push(`/jobs/${job.id}`)}>
                    View Bids ({job.bids?.length || 0})
                  </button>
                  <button className="btn btn-secondary" onClick={() => router.push(`/jobs/${job.id}`)}>
                    Details
                  </button>
                </>
              )}
              {!connected && (
                <button className="btn btn-secondary" onClick={() => router.push(`/jobs/${job.id}`)}>
                  View Details
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bid Submission Modal */}
      {showBidModal && selectedJob && (
        <div className="modal-overlay" onClick={() => setShowBidModal(false)}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
            <h2>Submit Bid for: {selectedJob.title}</h2>
            
            <div className="form-group">
              <label className="form-label">Bid Amount (USDM) *</label>
              <input
                type="number"
                className="form-input"
                placeholder={`Between ${selectedJob.budgetMin} - ${selectedJob.budgetMax}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                min={selectedJob.budgetMin}
                max={selectedJob.budgetMax}
                step="0.01"
              />
              <small>Budget range: ${selectedJob.budgetMin} - ${selectedJob.budgetMax} USDM</small>
            </div>

            <div className="form-group">
              <label className="form-label">Delivery Time (days) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 14"
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value)}
                min="1"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Proposal *</label>
              <textarea
                className="form-textarea"
                rows={5}
                placeholder="Explain your approach, relevant experience, and why you're the best fit..."
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowBidModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSubmitBid}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Bid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
