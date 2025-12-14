/**
 * React Hook for Cardano Blockchain Operations
 */

import { useState, useCallback } from "react";
import { cardanoService } from "../services/cardano.service";
import { toast } from "react-hot-toast";

export interface WalletState {
  connected: boolean;
  address: string | null;
  balance: { ada: number; usdm: number } | null;
}

export function useCardano() {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    balance: null,
  });
  const [loading, setLoading] = useState(false);

  /**
   * Connect wallet
   */
  const connectWallet = useCallback(async (mnemonic: string[]) => {
    try {
      setLoading(true);
      const address = await cardanoService.connectWallet(mnemonic);
      const balance = await cardanoService.getBalance();

      setWallet({
        connected: true,
        address,
        balance,
      });

      toast.success("Wallet connected!");
      return address;
    } catch (error: any) {
      toast.error(`Failed to connect wallet: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh balance
   */
  const refreshBalance = useCallback(async () => {
    if (!wallet.connected) return;

    try {
      const balance = await cardanoService.getBalance();
      setWallet((prev) => ({ ...prev, balance }));
    } catch (error: any) {
      console.error("Failed to refresh balance:", error);
    }
  }, [wallet.connected]);

  /**
   * Create job listing
   */
  const createJob = useCallback(
    async (params: {
      title: string;
      description: string;
      budgetMin: number;
      budgetMax: number;
      deadline: Date;
      clientDid: string;
    }) => {
      try {
        setLoading(true);

        const jobId = `JOB-${Date.now()}`;
        const descriptionHash = await hashDescription(params.description);

        const txHash = await cardanoService.createJob({
          jobId,
          title: params.title,
          descriptionHash,
          budgetMin: params.budgetMin * 1_000_000, // Convert to base unit
          budgetMax: params.budgetMax * 1_000_000,
          deadline: params.deadline.getTime(),
          clientDid: params.clientDid,
        });

        toast.success("Job created on blockchain!");
        
        // Wait for confirmation
        toast.loading("Waiting for confirmation...", { id: txHash });
        const confirmed = await cardanoService.waitForConfirmation(txHash);
        
        if (confirmed) {
          toast.success("Job confirmed!", { id: txHash });
        } else {
          toast.error("Confirmation timeout", { id: txHash });
        }

        await refreshBalance();

        return { jobId, txHash };
      } catch (error: any) {
        toast.error(`Failed to create job: ${error.message}`);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [refreshBalance]
  );

  /**
   * Accept bid and create escrow
   */
  const acceptBidAndCreateEscrow = useCallback(
    async (params: {
      jobId: string;
      employerAddress: string;
      employerDid: string;
      freelancerAddress: string;
      freelancerDid: string;
      arbiterAddress: string;
      amount: number;
    }) => {
      try {
        setLoading(true);

        const txHash = await cardanoService.createEscrow({
          ...params,
          amount: params.amount * 1_000_000, // Convert to base unit
        });

        toast.success("Escrow created on blockchain!");
        
        // Wait for confirmation
        toast.loading("Waiting for confirmation...", { id: txHash });
        const confirmed = await cardanoService.waitForConfirmation(txHash);
        
        if (confirmed) {
          toast.success("Escrow confirmed!", { id: txHash });
        } else {
          toast.error("Confirmation timeout", { id: txHash });
        }

        await refreshBalance();

        return txHash;
      } catch (error: any) {
        toast.error(`Failed to create escrow: ${error.message}`);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [refreshBalance]
  );

  /**
   * Release escrow to freelancer
   */
  const releaseEscrow = useCallback(
    async (params: {
      escrowTxHash: string;
      jobId: string;
      employerAddress: string;
      employerDid: string;
      freelancerAddress: string;
      freelancerDid: string;
      arbiterAddress: string;
      amount: number;
      freelancerWallet: any;
    }) => {
      try {
        setLoading(true);

        const txHash = await cardanoService.releaseEscrow({
          ...params,
          amount: params.amount * 1_000_000,
        });

        toast.success("Escrow released on blockchain!");
        
        // Wait for confirmation
        toast.loading("Waiting for confirmation...", { id: txHash });
        const confirmed = await cardanoService.waitForConfirmation(txHash);
        
        if (confirmed) {
          toast.success("Release confirmed!", { id: txHash });
        } else {
          toast.error("Confirmation timeout", { id: txHash });
        }

        await refreshBalance();

        return txHash;
      } catch (error: any) {
        toast.error(`Failed to release escrow: ${error.message}`);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [refreshBalance]
  );

  return {
    wallet,
    loading,
    connectWallet,
    refreshBalance,
    createJob,
    acceptBidAndCreateEscrow,
    releaseEscrow,
  };
}

/**
 * Hash description for on-chain storage
 */
async function hashDescription(description: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(description);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}
