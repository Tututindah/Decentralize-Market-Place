'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from '../contexts/WalletContext';
import './ManageBids.css';

interface Bid {
  id: string;
  jobId: string;
  jobTitle: string;
  employerAddress: string;
  employerName: string;
  amount: string;
  proposal: string;
  deliveryDays: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  blockchainTxHash: string;
  jobBudget: string;
  jobCategory: string;
}

const ManageBidsPage: React.FC = () => {
  const router = useRouter();
  const { address, role } = useWallet();

  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const API_URL = '/api';
  const CARDANOSCAN_URL = 'https://preprod.cardanoscan.io/transaction';

  useEffect(() => {
    // Redirect if not freelancer
    if (role && role !== 'freelancer') {
      router.push('/');
      return;
    }

    if (!address) {
      router.push('/');
      return;
    }

    fetchBids();
  }, [address, role]);

  const fetchBids = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/bids/freelancer/${address}`);

      if (response.ok) {
        const data = await response.json();
        setBids(data);
      } else {
        console.error('Failed to fetch bids');
      }
    } catch (error) {
      console.error('Error fetching bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const withdrawBid = async (bidId: string) => {
    if (!window.confirm('Are you sure you want to withdraw this bid?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/bids/${bidId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchBids(); // Refresh list
      } else {
        alert('Failed to withdraw bid');
      }
    } catch (error) {
      console.error('Error withdrawing bid:', error);
      alert('Error withdrawing bid');
    }
  };

  const filteredBids = bids.filter((bid) => {
    if (filterStatus === 'all') return true;
    return bid.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const statusCounts = {
    all: bids.length,
    pending: bids.filter((b) => b.status === 'PENDING').length,
    accepted: bids.filter((b) => b.status === 'ACCEPTED').length,
    rejected: bids.filter((b) => b.status === 'REJECTED').length,
  };

  if (loading) {
    return (
      <div className="manage-bids-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your bids...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-bids-page">
      <div className="manage-bids-container">
        <div className="manage-bids-header">
          <div>
            <h1 className="manage-bids-title">My Bids</h1>
            <p className="manage-bids-subtitle">Track and manage all your submitted proposals</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All ({statusCounts.all})
          </button>
          <button
            className={`filter-tab ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            Pending ({statusCounts.pending})
          </button>
          <button
            className={`filter-tab ${filterStatus === 'accepted' ? 'active' : ''}`}
            onClick={() => setFilterStatus('accepted')}
          >
            Accepted ({statusCounts.accepted})
          </button>
          <button
            className={`filter-tab ${filterStatus === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilterStatus('rejected')}
          >
            Rejected ({statusCounts.rejected})
          </button>
        </div>

        {/* Bids List */}
        {filteredBids.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3>No Bids Found</h3>
            <p>
              {filterStatus === 'all'
                ? "You haven't submitted any bids yet"
                : `No ${filterStatus} bids`}
            </p>
            <Link href="/jobs" className="btn-primary">Browse Jobs</Link>
          </div>
        ) : (
          <div className="bids-list">
            {filteredBids.map((bid) => (
              <div key={bid.id} className="bid-item">
                <div className="bid-item-header">
                  <div className="bid-item-title-section">
                    <h3 className="bid-item-title">{bid.jobTitle}</h3>
                    <span className={`bid-status status-${bid.status.toLowerCase()}`}>
                      {bid.status}
                    </span>
                  </div>
                  <div className="bid-item-amount">
                    <span className="amount-label">Your Bid</span>
                    <span className="amount-value">{bid.amount} ADA</span>
                  </div>
                </div>

                <p className="bid-proposal">{bid.proposal}</p>

                <div className="bid-item-meta">
                  <div className="bid-item-info">
                    <span>📅 Submitted: {new Date(bid.createdAt).toLocaleDateString()}</span>
                    <span>⏱️ Delivery: {bid.deliveryDays} days</span>
                    <span>💰 Job Budget: {bid.jobBudget} ADA</span>
                    <span className="job-category">{bid.jobCategory}</span>
                  </div>
                </div>

                <div className="bid-item-footer">
                  <div className="employer-info-small">
                    <div className="employer-avatar-small">
                      {bid.employerName ? bid.employerName.charAt(0).toUpperCase() : bid.employerAddress.slice(0, 2)}
                    </div>
                    <div>
                      <div className="employer-name-small">
                        {bid.employerName || `${bid.employerAddress.slice(0, 8)}...`}
                      </div>
                      <div className="employer-address-small">
                        {bid.employerAddress.slice(0, 12)}...
                      </div>
                    </div>
                  </div>

                  <div className="bid-item-actions">
                    <Link href={`/jobs/${bid.jobId}`} className="btn-icon" title="View Job">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Link>
                    {bid.status === 'PENDING' && (
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => withdrawBid(bid.id)}
                        title="Withdraw Bid"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {bid.blockchainTxHash && (
                  <div className="blockchain-info">
                    <a
                      href={`${CARDANOSCAN_URL}/${bid.blockchainTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tx-link"
                    >
                      🔗 View on Cardanoscan
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageBidsPage;
