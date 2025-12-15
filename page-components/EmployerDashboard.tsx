'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '../contexts/WalletContext'
import './Dashboard.css'

export default function EmployerDashboard() {
  const { connected, role } = useWallet()
  const router = useRouter()

  useEffect(() => {
    if (!connected) {
      router.push('/connect-wallet')
    } else if (role !== 'employer') {
      router.push('/role-selection')
    }
  }, [connected, role, navigate])

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Employer Dashboard</h1>
        <p className="dashboard-subtitle">Manage your jobs, bids, and hires</p>
      </div>
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card employer">
          <div className="stat-header">
            <span className="stat-label">Active Jobs</span>
            <div className="stat-icon employer">📋</div>
          </div>
          <div className="stat-value">0</div>
          <div className="stat-change neutral">No active jobs</div>
        </div>

        <div className="stat-card employer">
          <div className="stat-header">
            <span className="stat-label">Total Bids</span>
            <div className="stat-icon employer">💬</div>
          </div>
          <div className="stat-value">0</div>
          <div className="stat-change neutral">No bids received</div>
        </div>

        <div className="stat-card employer">
          <div className="stat-header">
            <span className="stat-label">In Progress</span>
            <div className="stat-icon employer">⏳</div>
          </div>
          <div className="stat-value">0</div>
          <div className="stat-change neutral">No jobs in progress</div>
        </div>

        <div className="stat-card employer">
          <div className="stat-header">
            <span className="stat-label">Completed</span>
            <div className="stat-icon employer">✅</div>
          </div>
          <div className="stat-value">0</div>
          <div className="stat-change neutral">No completed jobs</div>
        </div>
      </div>

      {/* Empty State */}
      <div className="empty-state">
        <div className="empty-state-icon">🚀</div>
        <h3>No Jobs Posted Yet</h3>
        <p>Get started by posting your first job and connect with talented freelancers ready to bring your project to life!</p>
        <button
          onClick={() => router.push('/create-job')}
          className="empty-state-button"
        >
          Post Your First Job
        </button>
      </div>
    </div>
  )
}
