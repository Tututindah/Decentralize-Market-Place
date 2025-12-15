'use client';

import { useState } from 'react';
import { CardanoService } from '@/app/src/services/cardano.service';
import { jobService } from '@/app/src/services/job.service';
import { proposalService } from '@/app/src/services/proposal.service';
import { escrowService } from '@/app/src/services/escrow.service';
import { userService } from '@/app/src/services/user.service';
import { useWallet } from '@/app/src/contexts/WalletContext';

export function useCardano() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { wallet } = useWallet();

  const createJob = async (
    jobData: {
      title: string;
      description: string;
      budget: number;
      employerAddress: string;
      budgetMin?: number;
      budgetMax?: number;
      deadline?: string;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🚀 Creating job on blockchain...');

      // Check wallet connection
      if (!wallet) {
        throw new Error('Please connect your wallet first');
      }

      // Get or create user in database first
      console.log('📝 Getting or creating user in database...');
      const user = await userService.getOrCreateUser(jobData.employerAddress, 'EMPLOYER');
      console.log('✅ User found/created:', user.id);

      // Create CardanoService instance with wallet
      const cardanoService = new CardanoService(wallet);

      // Create job listing on-chain first
      // Budget is in USDM tokens (whole units, e.g., 50 USDM)
      const budgetMin = jobData.budgetMin || jobData.budget * 0.8;
      const budgetMax = jobData.budgetMax || jobData.budget;
      const deadlineTimestamp = jobData.deadline
        ? new Date(jobData.deadline).getTime()
        : Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days default

      const blockchainResult = await cardanoService.createJobListing(
        jobData.title,
        jobData.description,
        budgetMin, // USDM amount
        budgetMax, // USDM amount
        deadlineTimestamp
      );

      console.log('✅ Job created on blockchain:', blockchainResult.txHash);

      // Calculate description hash for database
      const encoder = new TextEncoder();
      const data = encoder.encode(jobData.description);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const descriptionHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      // Get employer DID (placeholder for now - should come from KYC system)
      const walletAddress = await wallet.getChangeAddress();
      const employerHash = (await import('@meshsdk/core')).deserializeAddress(walletAddress).pubKeyHash;
      const employerDid = `did:cardano:${employerHash.substring(0, 16)}`;

      // Create job in database with blockchain info
      const job = await jobService.createJob({
        title: jobData.title,
        description: jobData.description,
        employer_id: user.id, // Use user UUID from database
        employer_did: employerDid,
        budget_min: budgetMin,
        budget_max: budgetMax,
        deadline: jobData.deadline || new Date(deadlineTimestamp).toISOString(),
        description_hash: descriptionHash,
        tx_hash: blockchainResult.txHash,
        script_address: blockchainResult.scriptAddress,
        job_id: blockchainResult.jobId
      });

      return {
        ...job,
        blockchain: blockchainResult
      };
    } catch (err: any) {
      console.error('Job creation error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const acceptBidAndCreateEscrow = async (
    proposalId: string,
    jobId: string,
    freelancerAddress: string,
    amount: number
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Get job and proposal details to get employer and freelancer IDs
      const job = await jobService.getJobById(jobId);
      const proposal = await proposalService.getProposalById(proposalId);

      if (!job || !proposal) {
        throw new Error('Job or proposal not found');
      }

      // Accept the proposal
      await proposalService.acceptProposal(proposalId);

      // Check wallet connection
      if (!wallet) {
        throw new Error('Please connect your wallet first');
      }

      // Create CardanoService instance with wallet
      const cardanoService = new CardanoService(wallet);

      // Create escrow transaction on Cardano
      const escrowTxHash = await cardanoService.createJobEscrow(
        jobId,
        amount,
        freelancerAddress,
        process.env.NEXT_PUBLIC_ARBITER_ADDRESS || ''
      );

      // Wait for confirmation
      const confirmed = await cardanoService.waitForConfirmation(escrowTxHash);

      if (!confirmed) {
        throw new Error('Transaction not confirmed');
      }

      // Get DIDs from job/proposal or create placeholder
      const employerDid = (job as any).employer_did || `did:cardano:${job.employer_id.substring(0, 16)}`;
      const freelancerDid = (proposal as any).freelancer_did || `did:cardano:${proposal.freelancer_id.substring(0, 16)}`;

      // USDM token constants
      const USDM_POLICY_ID = "f96672ded25c90551d210e883099110f613e0e65012d5b88b68c51d0";
      const USDM_ASSET_NAME = "4d4f434b5f5553444d";

      // Create escrow record in database
      const escrow = await escrowService.createEscrow({
        job_id: jobId,
        employer_id: job.employer_id,
        employer_did: employerDid,
        freelancer_id: proposal.freelancer_id,
        freelancer_did: freelancerDid,
        arbiter_address: process.env.NEXT_PUBLIC_ARBITER_ADDRESS || '',
        job_ref: (job as any).job_id || jobId,
        tx_hash: escrowTxHash,
        amount: amount,
        policy_id: USDM_POLICY_ID,
        asset_name: USDM_ASSET_NAME,
        status: 'LOCKED'
      });

      // Update job status
      await jobService.updateJobStatus(jobId, 'in-progress', '', escrowTxHash);

      return { escrow, txHash: escrowTxHash };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const releaseEscrow = async (
    escrowId: string,
    escrowTxHash: string,
    recipientAddress: string,
    signerId: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Sign release in database
      const escrow = await escrowService.signRelease(escrowId, signerId);

      // If threshold met, release on blockchain
      if (escrow.status === 'RELEASED') {
        if (!wallet) {
          throw new Error('Please connect your wallet first');
        }
        const cardanoService = new CardanoService(wallet);
        
        const releaseTxHash = await cardanoService.releaseEscrow(
          escrowTxHash,
          recipientAddress
        );

        // Wait for confirmation
        const confirmed = await cardanoService.waitForConfirmation(releaseTxHash);
        
        if (!confirmed) {
          throw new Error('Release transaction not confirmed');
        }

        return { escrow, txHash: releaseTxHash };
      }

      return { escrow };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refundEscrow = async (
    escrowId: string,
    escrowTxHash: string,
    employerAddress: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      if (!wallet) {
        throw new Error('Please connect your wallet first');
      }
      const cardanoService = new CardanoService(wallet);

      // Refund on blockchain
      const refundTxHash = await cardanoService.refundEscrow(
        escrowTxHash,
        employerAddress
      );

      // Wait for confirmation
      const confirmed = await cardanoService.waitForConfirmation(refundTxHash);
      
      if (!confirmed) {
        throw new Error('Refund transaction not confirmed');
      }

      // Update escrow status in database
      const escrow = await escrowService.updateEscrowStatus(escrowId, 'REFUNDED');

      return { escrow, txHash: refundTxHash };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const waitForConfirmation = async (txHash: string): Promise<boolean> => {
    if (!wallet) return false;
    const cardanoService = new CardanoService(wallet);
    return cardanoService.waitForConfirmation(txHash);
  };

  return {
    loading,
    error,
    createJob,
    acceptBidAndCreateEscrow,
    releaseEscrow,
    refundEscrow,
    waitForConfirmation,
  };
}
