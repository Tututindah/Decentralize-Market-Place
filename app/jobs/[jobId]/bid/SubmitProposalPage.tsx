'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import './SubmitProposal.css';

interface Job {
  id: string;
  title: string;
  description: string;
  budget: string;
  deadline: string;
  category: string;
  skills: string[];
  employerAddress: string;
  employerName: string;
  employerReputation: number;
  employerTrustScore: number;
  bidsCount: number;
  status: string;
}

const SubmitProposalPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();
  const { address, role, submitBid } = useWallet();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [proposal, setProposal] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');

  const API_URL = '/api';

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

    fetchJobDetails();
  }, [jobId, address, role]);

  const fetchJobDetails = async () => {
    if (!jobId) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/jobs/${jobId}`);

      if (response.ok) {
        const data = await response.json();
        setJob(data);
      } else {
        setError('Failed to load job details');
      }
    } catch (err) {
      setError('Error fetching job details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!proposal.trim()) {
      setError('Please provide a proposal description');
      return;
    }

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      setError('Please provide a valid bid amount');
      return;
    }

    if (!deliveryTime || parseInt(deliveryTime) <= 0) {
      setError('Please provide valid delivery time in days');
      return;
    }

    if (job && parseFloat(bidAmount) > parseFloat(job.budget)) {
      setError(`Bid amount cannot exceed job budget of ${job.budget} ADA`);
      return;
    }

    try {
      setSubmitting(true);

      // Create bid on blockchain first
      const txHash = await submitBid(jobId!, bidAmount);

      // Submit to API
      const response = await fetch(`${API_URL}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          freelancerAddress: address,
          amount: bidAmount,
          proposal,
          deliveryDays: parseInt(deliveryTime),
          blockchainTxHash: txHash,
        }),
      });

      if (response.ok) {
        router.push('/freelancer/bids');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to submit proposal');
      }
    } catch (err: any) {
      setError(err.message || 'Error submitting proposal');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="submit-proposal-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="submit-proposal-page">
        <div className="empty-state">
          <h3>Job Not Found</h3>
          <p>The job you're looking for doesn't exist or has been removed.</p>
          <Link href="/jobs" className="btn-primary">Browse Jobs</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="submit-proposal-page">
      <div className="submit-proposal-container">
        {/* Job Details Card */}
        <div className="job-details-card">
          <div className="job-header">
            <div>
              <h2 className="job-title">{job.title}</h2>
              <div className="job-category">{job.category}</div>
            </div>
            <div className="job-budget">
              <span className="budget-label">Budget</span>
              <span className="budget-amount">{job.budget} ADA</span>
            </div>
          </div>

          <p className="job-description">{job.description}</p>

          <div className="job-meta">
            <div className="meta-item">
              <strong>Deadline:</strong> {new Date(job.deadline).toLocaleDateString()}
            </div>
            <div className="meta-item">
              <strong>Bids:</strong> {job.bidsCount}
            </div>
          </div>

          {job.skills && job.skills.length > 0 && (
            <div className="job-skills">
              <strong>Required Skills:</strong>
              <div className="skills-list">
                {job.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>
          )}

          <div className="employer-info">
            <div className="employer-avatar">
              {job.employerName ? job.employerName.charAt(0).toUpperCase() : job.employerAddress.slice(0, 2)}
            </div>
            <div className="employer-details">
              <div className="employer-name">{job.employerName || `${job.employerAddress.slice(0, 8)}...`}</div>
              <div className="employer-stats">
                <span>⭐ {job.employerReputation}/100</span>
                <span>🛡️ Trust: {job.employerTrustScore}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Proposal Form */}
        <div className="proposal-form-card">
          <h3 className="form-title">Submit Your Proposal</h3>

          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="proposal">Proposal Description *</label>
              <textarea
                id="proposal"
                rows={8}
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                placeholder="Explain how you'll approach this project, your relevant experience, and why you're the best fit..."
                required
                disabled={submitting}
              />
              <span className="form-hint">
                Provide detailed information about your approach and qualifications
              </span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bidAmount">Bid Amount (ADA) *</label>
                <input
                  type="number"
                  id="bidAmount"
                  step="0.01"
                  min="0"
                  max={job.budget}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  disabled={submitting}
                />
                <span className="form-hint">
                  Maximum: {job.budget} ADA
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="deliveryTime">Delivery Time (Days) *</label>
                <input
                  type="number"
                  id="deliveryTime"
                  min="1"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  placeholder="e.g., 7"
                  required
                  disabled={submitting}
                />
                <span className="form-hint">
                  Estimated days to complete
                </span>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => router.push(`/jobs/${jobId}`)}
                className="btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Submitting Proposal...' : 'Submit Proposal'}
              </button>
            </div>
          </form>

          <div className="blockchain-notice">
            <span>🔗</span>
            <p>Your bid will be recorded on the Cardano blockchain for transparency and security.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitProposalPage;
