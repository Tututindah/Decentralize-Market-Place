import { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import './ProfilePage.css'

export default function ProfilePage() {
  const { connected, address } = useWallet()
  const [reputation, setReputation] = useState({
    totalJobs: 15,
    completedJobs: 13,
    cancelledJobs: 2,
    disputeCount: 0,
    averageRating: 92,
    totalEarned: 15400,
    trustScore: 88
  })

  if (!connected) {
    return (
      <div className="profile-page">
        <div className="card">
          <h1>Profile</h1>
          <p>Please connect your wallet to view your profile</p>
        </div>
      </div>
    )
  }

  const completionRate = ((reputation.completedJobs / reputation.totalJobs) * 100).toFixed(1)
  const badge = reputation.trustScore >= 90 ? '🏆 Elite' 
    : reputation.trustScore >= 80 ? '⭐ Expert'
    : reputation.trustScore >= 70 ? '✅ Trusted'
    : reputation.trustScore >= 60 ? '👍 Good'
    : '🆕 New'

  return (
    <div className="profile-page">
      <h1>👤 Your Profile</h1>

      <div className="grid grid-2">
        <div className="card profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {address?.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2>Freelancer</h2>
              <div className="badge badge-success">{badge}</div>
            </div>
          </div>

          <div className="profile-info">
            <div className="info-row">
              <span className="info-label">Wallet:</span>
              <span className="info-value">
                {address?.substring(0, 20)}...
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Trust Score:</span>
              <span className="info-value trust-score">
                {reputation.trustScore}/100
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Member Since:</span>
              <span className="info-value">Dec 2024</span>
            </div>
          </div>
        </div>

        <div className="card stats-card">
          <h3>📊 Statistics</h3>
          
          <div className="stat-row">
            <span className="stat-label">Total Jobs:</span>
            <span className="stat-value">{reputation.totalJobs}</span>
          </div>
          
          <div className="stat-row">
            <span className="stat-label">Completed:</span>
            <span className="stat-value success">{reputation.completedJobs}</span>
          </div>
          
          <div className="stat-row">
            <span className="stat-label">Cancelled:</span>
            <span className="stat-value danger">{reputation.cancelledJobs}</span>
          </div>
          
          <div className="stat-row">
            <span className="stat-label">Disputes:</span>
            <span className="stat-value">{reputation.disputeCount}</span>
          </div>
          
          <div className="stat-row">
            <span className="stat-label">Completion Rate:</span>
            <span className="stat-value success">{completionRate}%</span>
          </div>
          
          <div className="stat-row">
            <span className="stat-label">Average Rating:</span>
            <span className="stat-value">⭐ {reputation.averageRating}/100</span>
          </div>
          
          <div className="stat-row highlight">
            <span className="stat-label">Total Earned:</span>
            <span className="stat-value">${reputation.totalEarned.toLocaleString()} USDM</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>🏆 Achievements</h3>
        <div className="achievements">
          <div className="achievement">
            <div className="achievement-icon">🎯</div>
            <div className="achievement-name">First Job</div>
          </div>
          <div className="achievement">
            <div className="achievement-icon">⭐</div>
            <div className="achievement-name">10 Completed</div>
          </div>
          <div className="achievement">
            <div className="achievement-icon">💎</div>
            <div className="achievement-name">$10K Earned</div>
          </div>
          <div className="achievement">
            <div className="achievement-icon">✅</div>
            <div className="achievement-name">KYC Verified</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>📈 Reputation Timeline</h3>
        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-date">Dec 10, 2024</div>
            <div className="timeline-content">
              ✅ Completed "Web3 Landing Page" - Rating: 95/100
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-date">Dec 5, 2024</div>
            <div className="timeline-content">
              ✅ Completed "Smart Contract Audit" - Rating: 98/100
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-date">Nov 28, 2024</div>
            <div className="timeline-content">
              🆔 KYC Verification Completed - Advanced Level
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
