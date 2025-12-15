'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/app/src/contexts/WalletContext'
import { Briefcase, DollarSign, Clock, Eye, CheckCircle, XCircle } from 'lucide-react'
import './ManageJobs.css'

export const dynamic = 'force-dynamic'

interface Job {
  id: string
  title: string
  description: string
  category: string
  skills: string[]
  budget: string
  deadline: string | null
  status: string
  createdAt: string
  txHash: string
  bids: Array<{
    id: string
    status: string
    freelancer: {
      username: string | null
      walletAddress: string
    }
  }>
}

const API_URL = '/api'

export default function ManageJobsPage() {
  const { connected, address, role } = useWallet()
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!connected) {
      router.push('/connect-wallet')
      return
    }

    if (role !== 'employer') {
      router.push('/freelancer/dashboard')
      return
    }

    fetchMyJobs()
  }, [connected, role, address])

  const fetchMyJobs = async () => {
    if (!address) return

    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/jobs?employerAddress=${address}`)
      
      if (response.ok) {
        const data = await response.json()
        setJobs(data)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateJobStatus = async (jobId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchMyJobs() // Refresh list
      }
    } catch (error) {
      console.error('Error updating job status:', error)
    }
  }

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true
    return job.status === filter
  })

  const formatBudget = (budget: string) => {
    const amount = parseFloat(budget) / 1_000_000
    return `₳${amount.toLocaleString()} ADA`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'status-open'
      case 'IN_PROGRESS': return 'status-progress'
      case 'COMPLETED': return 'status-completed'
      case 'CANCELLED': return 'status-cancelled'
      default: return ''
    }
  }

  const getActiveBidsCount = (job: Job) => {
    return job.bids?.filter(b => b.status === 'PENDING').length || 0
  }

  return (
    <div className="manage-jobs-page">
      <div className="manage-jobs-container">
        {/* Header */}
        <div className="manage-jobs-header">
          <div>
            <h1 className="manage-jobs-title">My Jobs</h1>
            <p className="manage-jobs-subtitle">
              Manage your job postings and review bids
            </p>
          </div>
          <Link href="/create-job" className="btn-primary">
            <Briefcase size={20} />
            Post New Job
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Jobs ({jobs.length})
          </button>
          <button 
            className={`filter-tab ${filter === 'OPEN' ? 'active' : ''}`}
            onClick={() => setFilter('OPEN')}
          >
            Open ({jobs.filter(j => j.status === 'OPEN').length})
          </button>
          <button 
            className={`filter-tab ${filter === 'IN_PROGRESS' ? 'active' : ''}`}
            onClick={() => setFilter('IN_PROGRESS')}
          >
            In Progress ({jobs.filter(j => j.status === 'IN_PROGRESS').length})
          </button>
          <button 
            className={`filter-tab ${filter === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setFilter('COMPLETED')}
          >
            Completed ({jobs.filter(j => j.status === 'COMPLETED').length})
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your jobs...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredJobs.length === 0 && (
          <div className="empty-state">
            <Briefcase size={64} />
            <h3>No jobs found</h3>
            <p>
              {filter === 'all' 
                ? "You haven't posted any jobs yet" 
                : `You don't have any ${filter.toLowerCase().replace('_', ' ')} jobs`
              }
            </p>
            <Link href="/create-job" className="btn-primary">
              Post Your First Job
            </Link>
          </div>
        )}

        {/* Jobs List */}
        {!loading && filteredJobs.length > 0 && (
          <div className="jobs-list">
            {filteredJobs.map(job => (
              <div key={job.id} className="job-item">
                <div className="job-item-header">
                  <div className="job-item-title-section">
                    <h3 className="job-item-title">{job.title}</h3>
                    <span className={`job-status ${getStatusColor(job.status)}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="job-item-budget">
                    <DollarSign size={16} />
                    {formatBudget(job.budget)}
                  </div>
                </div>

                <p className="job-item-description">
                  {job.description.length > 200 
                    ? `${job.description.substring(0, 200)}...` 
                    : job.description
                  }
                </p>

                <div className="job-item-meta">
                  <div className="job-item-info">
                    <span><Clock size={14} /> Posted {formatDate(job.createdAt)}</span>
                    <span className="job-category">{job.category}</span>
                    {job.deadline && (
                      <span>Deadline: {formatDate(job.deadline)}</span>
                    )}
                  </div>
                </div>

                <div className="job-item-footer">
                  <div className="job-item-stats">
                    <div className="stat-badge">
                      {getActiveBidsCount(job)} active bids
                    </div>
                    <div className="stat-badge">
                      {job.bids?.length || 0} total bids
                    </div>
                  </div>

                  <div className="job-item-actions">
                    <Link href={`/jobs/${job.id}`} className="btn-icon" title="View Details">
                      <Eye size={18} />
                    </Link>
                    
                    {job.status === 'OPEN' && (
                      <>
                        <button 
                          onClick={() => updateJobStatus(job.id, 'CANCELLED')}
                          className="btn-icon btn-danger"
                          title="Cancel Job"
                        >
                          <XCircle size={18} />
                        </button>
                      </>
                    )}

                    {job.status === 'IN_PROGRESS' && (
                      <button 
                        onClick={() => updateJobStatus(job.id, 'COMPLETED')}
                        className="btn-icon btn-success"
                        title="Mark as Completed"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="blockchain-info">
                  <a 
                    href={`https://preprod.cardanoscan.io/transaction/${job.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-link"
                  >
                    View on Cardano ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

