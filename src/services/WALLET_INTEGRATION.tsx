/**
 * Wallet Context Integration with CardanoService
 * How to bridge WalletContext (BrowserWallet) with CardanoService (MeshWallet)
 */

import { BrowserWallet } from '@meshsdk/core';
import { cardanoService } from '../services/cardano.service';

// ============================================================================
// PROBLEM: Type Mismatch
// ============================================================================

/**
 * WalletContext uses: BrowserWallet (for browser extensions like Nami, Eternl)
 * CardanoService uses: MeshWallet (for signing transactions)
 * 
 * Solution: Create a MeshWallet instance from browser wallet
 */

// ============================================================================
// SOLUTION 1: Convert BrowserWallet to MeshWallet (Recommended for Testing)
// ============================================================================

import { MeshWallet, BlockfrostProvider } from '@meshsdk/core';

export async function connectBrowserWalletToService(
  browserWallet: BrowserWallet,
  blockfrostApiKey: string
) {
  // Get wallet address
  const address = await browserWallet.getChangeAddress();
  
  // For production, you'll use BrowserWallet's signing capabilities directly
  // For testing, you can use MeshWallet with mnemonic
  
  console.log('Connected wallet:', address);
  
  // Note: BrowserWallet handles signing through browser extension
  // No need to convert - just use the browserWallet directly for signing
}

// ============================================================================
// SOLUTION 2: Extend CardanoService to Accept BrowserWallet (Production)
// ============================================================================

/**
 * Update CardanoService to work with BrowserWallet
 * This is the PRODUCTION approach
 */

// Add this to cardano.service.ts:

export class CardanoServiceV2 {
  private wallet: BrowserWallet | MeshWallet | null = null;

  /**
   * Set wallet (accepts both BrowserWallet and MeshWallet)
   */
  setWallet(wallet: BrowserWallet | MeshWallet) {
    this.wallet = wallet;
  }

  /**
   * Sign and submit transaction (works with both wallet types)
   */
  private async signAndSubmit(unsignedTx: string): Promise<string> {
    if (!this.wallet) throw new Error("Wallet not connected");
    
    const signedTx = await this.wallet.signTx(unsignedTx);
    const txHash = await this.wallet.submitTx(signedTx);
    
    return txHash;
  }

  // All other methods remain the same...
}

// ============================================================================
// SOLUTION 3: Use Browser Wallet Directly (Simplest for Production)
// ============================================================================

/**
 * Modified CardanoService that uses the connected browser wallet
 * This approach works with Nami, Eternl, Flint, etc.
 */

import { useWallet } from '../contexts/WalletContext';

export function CreateJobWithBrowserWallet() {
  const { wallet, connected } = useWallet();

  const handleCreateJob = async () => {
    if (!connected || !wallet) {
      alert('Please connect your wallet');
      return;
    }

    try {
      // Get wallet info
      const address = await wallet.getChangeAddress();
      const utxos = await wallet.getUtxos();

      // Build transaction using mesh-utils
      const { getTxBuilder, getScript } = await import('../services/mesh-utils');
      
      // Load blueprint
      const response = await fetch('/plutus.json');
      const blueprint = await response.json();
      const jobValidator = blueprint.validators.find(
        (v: any) => v.title === "job_listing.job_listing.spend"
      );

      const { scriptAddr } = getScript(jobValidator.compiledCode);

      // Create datum
      const { mConStr0, deserializeAddress } = await import('@meshsdk/core');
      const employerHash = deserializeAddress(address).pubKeyHash;
      
      const datum = mConStr0([
        employerHash,
        Buffer.from(`JOB-${Date.now()}`).toString("hex"),
        Buffer.from("Job Title").toString("hex"),
        "hash123",
        50_000_000,
        100_000_000,
        Date.now() + 30 * 24 * 60 * 60 * 1000,
        1
      ]);

      // Build transaction
      const txBuilder = getTxBuilder();
      await txBuilder
        .txOut(scriptAddr, [{ unit: "lovelace", quantity: "3000000" }])
        .txOutInlineDatumValue(datum)
        .changeAddress(address)
        .selectUtxosFrom(utxos)
        .complete();

      // Sign with browser wallet
      const unsignedTx = txBuilder.txHex;
      const signedTx = await wallet.signTx(unsignedTx);
      
      // Submit with browser wallet
      const txHash = await wallet.submitTx(signedTx);

      console.log('Job created!', txHash);
      alert(`Transaction submitted: ${txHash}`);

    } catch (error) {
      console.error('Error creating job:', error);
      alert('Failed to create job');
    }
  };

  return (
    <button onClick={handleCreateJob}>
      Create Job (Browser Wallet)
    </button>
  );
}

// ============================================================================
// RECOMMENDED APPROACH: Wrapper Service
// ============================================================================

/**
 * Create a wrapper that works with both wallet types
 */

class UnifiedCardanoService {
  private browserWallet: BrowserWallet | null = null;
  private meshWallet: MeshWallet | null = null;

  setBrowserWallet(wallet: BrowserWallet) {
    this.browserWallet = wallet;
    this.meshWallet = null;
  }

  setMeshWallet(wallet: MeshWallet) {
    this.meshWallet = wallet;
    this.browserWallet = null;
  }

  async getAddress(): Promise<string> {
    if (this.browserWallet) {
      return await this.browserWallet.getChangeAddress();
    }
    if (this.meshWallet) {
      return await this.meshWallet.getChangeAddress();
    }
    throw new Error('No wallet connected');
  }

  async getUtxos() {
    if (this.browserWallet) {
      return await this.browserWallet.getUtxos();
    }
    if (this.meshWallet) {
      return await this.meshWallet.getUtxos();
    }
    throw new Error('No wallet connected');
  }

  async signTx(unsignedTx: string, partialSign = false): Promise<string> {
    if (this.browserWallet) {
      return await this.browserWallet.signTx(unsignedTx, partialSign);
    }
    if (this.meshWallet) {
      return await this.meshWallet.signTx(unsignedTx, partialSign);
    }
    throw new Error('No wallet connected');
  }

  async submitTx(signedTx: string): Promise<string> {
    if (this.browserWallet) {
      return await this.browserWallet.submitTx(signedTx);
    }
    if (this.meshWallet) {
      return await this.meshWallet.submitTx(signedTx);
    }
    throw new Error('No wallet connected');
  }
}

export const unifiedCardanoService = new UnifiedCardanoService();

// Usage:
// const { wallet } = useWallet();
// unifiedCardanoService.setBrowserWallet(wallet);

// ============================================================================
// PRODUCTION EXAMPLE: Full Integration
// ============================================================================

/**
 * Complete example of using browser wallet with CardanoService pattern
 */

import React from 'react';

export function ProductionJobCreation() {
  const { wallet, connected, address } = useWallet();
  const [loading, setLoading] = React.useState(false);

  const createJobOnChain = async (jobData: any) => {
    if (!connected || !wallet) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    try {
      // 1. Get wallet info
      const walletAddress = await wallet.getChangeAddress();
      const utxos = await wallet.getUtxos();

      // 2. Load blueprint
      const response = await fetch('/plutus.json');
      const blueprint = await response.json();
      const jobValidator = blueprint.validators.find(
        (v: any) => v.title === "job_listing.job_listing.spend"
      );

      // 3. Build transaction
      const { getScript, getTxBuilder } = await import('../services/mesh-utils');
      const { mConStr0, deserializeAddress } = await import('@meshsdk/core');

      const { scriptAddr } = getScript(jobValidator.compiledCode);
      const employerHash = deserializeAddress(walletAddress).pubKeyHash;

      const datum = mConStr0([
        employerHash,
        Buffer.from(jobData.jobId).toString("hex"),
        Buffer.from(jobData.title).toString("hex"),
        jobData.descriptionHash,
        jobData.budgetMin,
        jobData.budgetMax,
        jobData.deadline,
        1
      ]);

      const txBuilder = getTxBuilder();
      await txBuilder
        .txOut(scriptAddr, [{ unit: "lovelace", quantity: "3000000" }])
        .txOutInlineDatumValue(datum)
        .changeAddress(walletAddress)
        .selectUtxosFrom(utxos)
        .complete();

      // 4. Sign with browser wallet (user approves in extension)
      const unsignedTx = txBuilder.txHex;
      const signedTx = await wallet.signTx(unsignedTx);

      // 5. Submit to blockchain
      const txHash = await wallet.submitTx(signedTx);

      console.log('✅ Job created on-chain:', txHash);
      return txHash;

    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={() => createJobOnChain({
          jobId: `JOB-${Date.now()}`,
          title: "Smart Contract Dev",
          descriptionHash: "hash123",
          budgetMin: 50_000_000,
          budgetMax: 100_000_000,
          deadline: Date.now() + 30 * 24 * 60 * 60 * 1000
        })}
        disabled={!connected || loading}
      >
        {loading ? 'Creating...' : 'Create Job'}
      </button>
    </div>
  );
}

// ============================================================================
// SUMMARY
// ============================================================================

/**
 * FOR PRODUCTION:
 * - Use BrowserWallet from WalletContext (works with Nami, Eternl, etc.)
 * - Build transactions using mesh-utils
 * - Sign with wallet.signTx() - user approves in browser extension
 * - Submit with wallet.submitTx()
 * 
 * FOR TESTING:
 * - Use MeshWallet with mnemonic
 * - No browser extension needed
 * - Automatic signing (no user approval)
 * 
 * CardanoService uses MeshWallet for testing purposes.
 * For production, adapt the methods to use BrowserWallet pattern shown above.
 */
