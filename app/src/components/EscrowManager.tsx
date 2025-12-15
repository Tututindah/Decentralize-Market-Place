/**
 * Escrow Manager Component
 * Multi-sig escrow interface for job payments
 * Integrated with Atala Prism/Identus KYC verification
 */

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import axios from 'axios';

// Types
interface EscrowData {
  jobId: string;
  amountLovelace: string;
  status: 'locked' | 'released' | 'refunded';
  employer: string;
  freelancer: string;
  admin: string;
  threshold: number;
  createdAt: string;
  kycVerified: boolean;
}

interface CreateEscrowForm {
  jobId: string;
  amount: string;
  freelancerAddress: string;
  threshold: number;
  requireKyc: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const EscrowManager: React.FC = () => {
  const [escrows, setEscrows] = useState<EscrowData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateEscrowForm>({
    jobId: '',
    amount: '',
    freelancerAddress: '',
    threshold: 2,
    requireKyc: false,
  });

  // Load escrows on mount
  useEffect(() => {
    loadEscrows();
  }, []);

  const loadEscrows = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/escrow/list`);
      setEscrows(response.data.data || []);
    } catch (err: any) {
      console.error('Failed to load escrows:', err);
      setError(err.response?.data?.error || 'Failed to load escrows');
    } finally {
      setLoading(false);
    }
  };

  const createEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setLoading(true);

      // Get wallet seed from environment or user input
      // In production, use proper wallet connection (e.g., Nami, Eternl)
      const employerSeed = localStorage.getItem('walletSeed');
      if (!employerSeed) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      const response = await axios.post(`${API_BASE_URL}/escrow/create`, {
        jobId: formData.jobId,
        amountLovelace: parseInt(formData.amount) * 1000000, // Convert to lovelace
        freelancerAddress: formData.freelancerAddress,
        employerSeed: employerSeed,
        threshold: formData.threshold,
        requireKyc: formData.requireKyc,
      });

      setSuccess(`Escrow created successfully! TxHash: ${response.data.data.txHash}`);

      // Reset form
      setFormData({
        jobId: '',
        amount: '',
        freelancerAddress: '',
        threshold: 2,
        requireKyc: false,
      });

      // Reload escrows
      await loadEscrows();
    } catch (err: any) {
      console.error('Failed to create escrow:', err);
      setError(err.response?.data?.error || 'Failed to create escrow');
    } finally {
      setLoading(false);
    }
  };

  const releasePayment = async (jobId: string) => {
    if (!confirm('Are you sure you want to release payment to the freelancer?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get signer seeds - in production, use multi-sig wallet solution
      const employerSeed = localStorage.getItem('walletSeed');
      const freelancerSeed = localStorage.getItem('freelancerSeed');

      const response = await axios.post(`${API_BASE_URL}/escrow/release`, {
        jobId,
        signers: {
          employer: employerSeed,
          freelancer: freelancerSeed,
        },
      });

      setSuccess(`Payment released! TxHash: ${response.data.data.txHash}`);
      await loadEscrows();
    } catch (err: any) {
      console.error('Failed to release payment:', err);
      setError(err.response?.data?.error || 'Failed to release payment');
    } finally {
      setLoading(false);
    }
  };

  const refundPayment = async (jobId: string) => {
    if (!confirm('Are you sure you want to refund payment to the employer?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const employerSeed = localStorage.getItem('walletSeed');
      const freelancerSeed = localStorage.getItem('freelancerSeed');

      const response = await axios.post(`${API_BASE_URL}/escrow/refund`, {
        jobId,
        signers: {
          employer: employerSeed,
          freelancer: freelancerSeed,
        },
      });

      setSuccess(`Payment refunded! TxHash: ${response.data.data.txHash}`);
      await loadEscrows();
    } catch (err: any) {
      console.error('Failed to refund payment:', err);
      setError(err.response?.data?.error || 'Failed to refund payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Multi-Sig Escrow Manager</h1>
        <p className="text-muted-foreground">
          Manage job escrows with 3-wallet multi-signature security
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {/* Create Escrow Form */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Create New Escrow</h2>
        <form onSubmit={createEscrow} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobId">Job ID</Label>
              <Input
                id="jobId"
                value={formData.jobId}
                onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                placeholder="unique-job-id"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (ADA)</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="10"
                min="2"
                step="0.1"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="freelancer">Freelancer Address</Label>
              <Input
                id="freelancer"
                value={formData.freelancerAddress}
                onChange={(e) => setFormData({ ...formData, freelancerAddress: e.target.value })}
                placeholder="addr_test1..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">Signature Threshold</Label>
              <select
                id="threshold"
                value={formData.threshold}
                onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) })}
                className="w-full p-2 border rounded"
              >
                <option value={1}>1 of 3</option>
                <option value={2}>2 of 3 (Recommended)</option>
                <option value={3}>3 of 3</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requireKyc">KYC Verification</Label>
              <div className="flex items-center space-x-2">
                <input
                  id="requireKyc"
                  type="checkbox"
                  checked={formData.requireKyc}
                  onChange={(e) => setFormData({ ...formData, requireKyc: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Require Atala Prism KYC</span>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating...' : 'Create Escrow'}
          </Button>
        </form>
      </Card>

      {/* Active Escrows */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Active Escrows ({escrows.length})</h2>

        {loading && <p className="text-center text-muted-foreground">Loading...</p>}

        {!loading && escrows.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            No active escrows found. Create one above to get started.
          </Card>
        )}

        {escrows.map((escrow) => (
          <Card key={escrow.jobId} className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">Job: {escrow.jobId}</h3>
                  <Badge variant={
                    escrow.status === 'locked' ? 'default' :
                    escrow.status === 'released' ? 'success' : 'secondary'
                  }>
                    {escrow.status.toUpperCase()}
                  </Badge>
                  {escrow.kycVerified && (
                    <Badge variant="outline">✓ KYC Verified</Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <p>
                    <strong>Amount:</strong> {(parseInt(escrow.amountLovelace) / 1000000).toFixed(2)} ADA
                  </p>
                  <p>
                    <strong>Threshold:</strong> {escrow.threshold} of 3 signatures
                  </p>
                  <p className="md:col-span-2">
                    <strong>Employer:</strong> {escrow.employer.slice(0, 20)}...
                  </p>
                  <p className="md:col-span-2">
                    <strong>Freelancer:</strong> {escrow.freelancer.slice(0, 20)}...
                  </p>
                  <p className="md:col-span-2">
                    <strong>Created:</strong> {new Date(escrow.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {escrow.status === 'locked' && (
                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={() => releasePayment(escrow.jobId)}
                    disabled={loading}
                    variant="default"
                    size="sm"
                  >
                    Release
                  </Button>
                  <Button
                    onClick={() => refundPayment(escrow.jobId)}
                    disabled={loading}
                    variant="destructive"
                    size="sm"
                  >
                    Refund
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EscrowManager;
