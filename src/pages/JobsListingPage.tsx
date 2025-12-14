import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { Briefcase, DollarSign, Clock, MapPin, Search, Filter } from 'lucide-react'
import './JobsListing.css'

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
  employer: {
    id: string
    walletAddress: string
    username: string | null
    reputation: number
    trustScore: number
  }
  _count?: {
    bids: number
  }
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export default function JobsListingPage() {
  const { connected } = useWallet()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/jobs?status=OPEN`)
      
      if (response.ok) {
        const data = await response.json()
        setJobs(data)
      } else {
        console.error('Failed to fetch jobs')
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs
    .filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || job.category === categoryFilter
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      } else if (sortBy === 'budget-high') {
        return parseFloat(b.budget) - parseFloat(a.budget)
      } else if (sortBy === 'budget-low') {
        return parseFloat(a.budget) - parseFloat(b.budget)
      }
      return 0
    })

  const categories = ['all', ...Array.from(new Set(jobs.map(j => j.category)))]

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

  return (
    <div className="jobs-listing-page">
      <div className="jobs-listing-container">
        {/* Header */}
        <div className="jobs-header">
          <div>
            <h1 className="jobs-title">Browse Jobs</h1>
            <p className="jobs-subtitle">
              Find your next opportunity in our decentralized marketplace
            </p>
          </div>
          {connected && (
            <Link to="/create-job" className="btn-primary">
              <Briefcase size={20} />
              Post a Job
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="jobs-filters">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <Filter size={20} />
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <Clock size={20} />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="budget-high">Highest Budget</option>
              <option value="budget-low">Lowest Budget</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="jobs-stats">
          <span>{filteredJobs.length} jobs found</span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading jobs...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredJobs.length === 0 && (
          <div className="empty-state">
            <Briefcase size={64} />
            <h3>No jobs found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}

        {/* Jobs Grid */}
        {!loading && filteredJobs.length > 0 && (
          <div className="jobs-grid">
            {filteredJobs.map(job => (
              <Link to={`/jobs/${job.id}`} key={job.id} className="job-card">
                <div className="job-card-header">
                  <div>
                    <h3 className="job-title">{job.title}</h3>
                    <div className="job-meta">
                      <span className="job-category">{job.category}</span>
                      <span className="job-date">{formatDate(job.createdAt)}</span>
                    </div>
                  </div>
                  <div className="job-budget">
                    <DollarSign size={16} />
                    <span>{formatBudget(job.budget)}</span>
                  </div>
                </div>

                <p className="job-description">
                  {job.description.length > 150 
                    ? `${job.description.substring(0, 150)}...` 
                    : job.description
                  }
                </p>

                <div className="job-skills">
                  {job.skills.slice(0, 4).map((skill, idx) => (
                    <span key={idx} className="skill-tag">{skill}</span>
                  ))}
                  {job.skills.length > 4 && (
                    <span className="skill-tag">+{job.skills.length - 4} more</span>
                  )}
                </div>

                <div className="job-footer">
                  <div className="employer-info">
                    <div className="employer-avatar">
                      {job.employer.username?.charAt(0).toUpperCase() || job.employer.walletAddress.substring(0, 2)}
                    </div>
                    <div>
                      <div className="employer-name">
                        {job.employer.username || `${job.employer.walletAddress.substring(0, 8)}...`}
                      </div>
                      <div className="employer-reputation">
                        ⭐ {job.employer.reputation} ({job.employer.trustScore.toFixed(0)}% trust)
                      </div>
                    </div>
                  </div>

                  {job._count && (
                    <div className="job-bids">
                      {job._count.bids} {job._count.bids === 1 ? 'bid' : 'bids'}
                    </div>
                  )}
                </div>

                {job.deadline && (
                  <div className="job-deadline">
                    <Clock size={14} />
                    Deadline: {formatDate(job.deadline)}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
