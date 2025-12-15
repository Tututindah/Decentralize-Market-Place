'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/contexts/WalletContext'
import './Dashboard.css'

export default function FreelancerDashboard() {
  const { connected, role } = useWallet()
  const router = useRouter()

  useEffect(() => {
    if (!connected) {
      router.push('/connect-wallet')
    } else if (role !== 'freelancer') {
      router.push('/role-selection')
    }
  }, [connected, role, router])

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Freelancer Dashboard</h1>
        <p className="dashboard-subtitle">Manage your bids, jobs, and earnings</p>
      </div>
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card freelancer">
          <div className="stat-header">
            <span className="stat-label">Active Bids</span>
            <div className="stat-icon freelancer">📝</div>
          </div>
          <div className="stat-value">0</div>
          <div className="stat-change neutral">No active bids</div>
        </div>

        <div className="stat-card freelancer">
          <div className="stat-header">
            <span className="stat-label">Active Jobs</span>
            <div className="stat-icon freelancer">💼</div>
          </div>
          <div className="stat-value">0</div>
          <div className="stat-change neutral">No jobs in progress</div>
        </div>

        <div className="stat-card freelancer">
          <div className="stat-header">
            <span className="stat-label">Completed</span>
            <div className="stat-icon freelancer">✅</div>
          </div>
          <div className="stat-value">0</div>
          <div className="stat-change neutral">No completed jobs</div>
        </div>

        <div className="stat-card freelancer">
          <div className="stat-header">
            <span className="stat-label">Reputation</span>
            <div className="stat-icon freelancer">⭐</div>
          </div>
          <div className="stat-value">-</div>
          <div className="stat-change neutral">Not rated yet</div>
        </div>
      </div>

      {/* Empty State */}
      <div className="empty-state">
        <div className="empty-state-icon">🔍</div>
        <h3>No Active Bids or Jobs</h3>
        <p>Start browsing available jobs and submit your first bid to get started on your freelancing journey!</p>
        <button
          onClick={() => router.push('/jobs')}
          className="empty-state-button"
        >
          Browse Jobs
        </button>
      </div>
    </div>
  )
}
