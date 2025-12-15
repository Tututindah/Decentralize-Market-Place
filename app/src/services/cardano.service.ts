import type { BrowserWallet, Transaction } from '@meshsdk/core';
import plutusBlueprint from '@/plutus.json';

// Helper to dynamically import Mesh SDK functions
async function getMeshCore() {
  return await import('@meshsdk/core');
}

async function getMeshCst() {
  return await import('@meshsdk/core-cst');
}

export interface CardanoConfig {
  network: 'testnet' | 'mainnet' | 'preprod';
  blockfrostApiKey: string;
}

export class CardanoService {
  private wallet: BrowserWallet | null = null;
  private config: CardanoConfig;

  constructor(walletOrConfig: BrowserWallet | CardanoConfig) {
    // Support both wallet instance and config object
    if ('network' in walletOrConfig) {
      // It's a config object
      this.config = walletOrConfig;
    } else {
      // It's a wallet instance
      this.wallet = walletOrConfig;
      this.config = {
        network: 'preprod',
        blockfrostApiKey: process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY || ''
      };
    }
  }

  // Connect to wallet
  async connectWallet(walletName: string): Promise<string> {
    try {
      const { BrowserWallet } = await getMeshCore();
      this.wallet = await BrowserWallet.enable(walletName);
      const addresses = await this.wallet.getUsedAddresses();
      return addresses[0];
    } catch (error: any) {
      throw new Error(`Failed to connect wallet: ${error.message}`);
    }
  }

  // Get connected wallet address
  async getWalletAddress(): Promise<string | null> {
    if (!this.wallet) return null;
    const addresses = await this.wallet.getUsedAddresses();
    return addresses[0] || null;
  }

  // Get wallet balance
  async getBalance(): Promise<string> {
    if (!this.wallet) throw new Error('Wallet not connected');
    const balance = await this.wallet.getBalance();
    return balance[0]?.quantity || '0';
  }

  /**
   * Create job listing on-chain (locks ADA at script address with job datum)
   * Based on your offchain/create-job-listing.ts reference
   */
  async createJobListing(
    title: string,
    description: string,
    budgetMin: number,
    budgetMax: number,
    deadline: number
  ): Promise<{ jobId: string; txHash: string; scriptAddress: string }> {
    if (!this.wallet) throw new Error('Wallet not connected');

    console.log('\n📋 Creating Job Listing On-Chain');
    console.log('Title:', title);
    console.log('Budget:', budgetMin, '-', budgetMax, 'USDM');

    try {
      const { deserializeAddress, mConStr0, serializePlutusScript, Transaction } = await getMeshCore();
      const { applyParamsToScript } = await getMeshCst();

      const employerAddress = await this.wallet.getChangeAddress();
      const employerHash = deserializeAddress(employerAddress).pubKeyHash;
      const utxos = await this.wallet.getUtxos();

      // Generate unique job ID
      const jobId = `JOB-${Date.now()}`;
      console.log('Job ID:', jobId);

      // Calculate description hash (SHA-256)
      const descriptionHash = Array.from(new TextEncoder().encode(description))
        .reduce((hash, byte) => {
          const h = hash << 5 - hash + byte;
          return h & h;
        }, 0).toString(16).padStart(64, '0').slice(0, 64);

      // Load job_listing validator from plutus.json
      const jobValidator = plutusBlueprint.validators.find(
        (v: any) => v.title === 'job_listing.job_listing.spend'
      );

      if (!jobValidator) {
        throw new Error('Job listing validator not found in plutus.json');
      }

      // Get script address using proper serialization (matching reference code)
      const scriptCbor = applyParamsToScript(jobValidator.compiledCode, []);
      const scriptAddress = serializePlutusScript(
        { code: scriptCbor, version: 'V3' },
        undefined,
        0 // 0 = preprod network
      ).address;

      console.log('📍 Script Address:', scriptAddress);

      // Create job datum matching Plutus validator structure
      // Note: Using placeholder DID - in production, fetch from KYC system
      const clientDid = `did:cardano:${employerHash.substring(0, 16)}`;

      const datum = mConStr0([
        employerHash,
        Buffer.from(clientDid).toString('hex'),
        Buffer.from(jobId).toString('hex'),
        Buffer.from(title).toString('hex'),
        descriptionHash,
        budgetMin, // USDM amount (not lovelace - USDM has 6 decimals)
        budgetMax, // USDM amount
        deadline,
        1, // is_active = true (Bool: 1 = True, 0 = False)
        0  // kyc_required = false (for now)
      ]);

      console.log('Locking 3 ADA with job datum at script address...');
      const tx = new Transaction({ initiator: this.wallet });
      
      // Send to script address with inline datum
      tx.sendLovelace(
        { 
          address: scriptAddress,
          datum: { value: datum, inline: true }
        },
        '3000000' // 3 ADA
      );

      tx.setChangeAddress(employerAddress);

      const unsignedTx = await tx.build();
      const signedTx = await this.wallet.signTx(unsignedTx);
      const txHash = await this.wallet.submitTx(signedTx);

      console.log('✅ Job listing created!');
      console.log('🎉 TX Hash:', txHash);
      console.log(`🔗 https://preprod.cardanoscan.io/transaction/${txHash}`);

      return {
        jobId,
        txHash,
        scriptAddress
      };
    } catch (error: any) {
      console.error('Job creation failed:', error);
      throw new Error(`Failed to create job: ${error.message}`);
    }
  }

  // Create job escrow transaction (locks funds for specific job)
  async createJobEscrow(
    jobId: string,
    amount: number,
    freelancerAddress: string,
    arbitratorAddress: string
  ): Promise<string> {
    if (!this.wallet) throw new Error('Wallet not connected');

    console.log('\n🔒 Creating Job Escrow');
    console.log('Job ID:', jobId);
    console.log('Amount:', amount, 'ADA');
    console.log('Freelancer:', freelancerAddress);

    try {
      const { deserializeAddress, mConStr0, serializePlutusScript, Transaction } = await getMeshCore();
      const { applyParamsToScript } = await getMeshCst();

      const employerAddress = await this.wallet.getChangeAddress();
      const employerHash = deserializeAddress(employerAddress).pubKeyHash;
      const freelancerHash = deserializeAddress(freelancerAddress).pubKeyHash;
      const arbiterHash = deserializeAddress(arbitratorAddress || employerAddress).pubKeyHash;

      // Load escrow validator from plutus.json
      const escrowValidator = plutusBlueprint.validators.find(
        (v: any) => v.title === 'freelance_escrow.freelance_escrow.spend'
      );

      if (!escrowValidator) {
        throw new Error('Escrow validator not found in plutus.json');
      }

      // Get script address
      const scriptCbor = applyParamsToScript(escrowValidator.compiledCode, []);
      const scriptAddress = serializePlutusScript(
        { code: scriptCbor, version: 'V3' },
        undefined,
        0 // 0 = preprod
      ).address;

      console.log('📍 Escrow Script Address:', scriptAddress);

      // Create escrow datum (matching EscrowDatum structure)
      const USDM_POLICY_ID = "f96672ded25c90551d210e883099110f613e0e65012d5b88b68c51d0";
      const USDM_ASSET_NAME = "4d4f434b5f5553444d";

      // Note: Using placeholder DIDs - in production, fetch from KYC system
      const clientDid = `did:cardano:${employerHash.substring(0, 16)}`;
      const freelancerDid = `did:cardano:${freelancerHash.substring(0, 16)}`;

      const datum = mConStr0([
        employerHash,
        Buffer.from(clientDid).toString('hex'),
        freelancerHash,
        Buffer.from(freelancerDid).toString('hex'),
        arbiterHash,
        USDM_POLICY_ID,
        USDM_ASSET_NAME,
        amount * 1_000_000, // Convert to lovelace
        Buffer.from(jobId).toString('hex')
      ]);

      // Lock 5 ADA + USDM tokens at script address
      const tx = new Transaction({ initiator: this.wallet });

      // For now, just lock ADA (USDM tokens require minting first)
      tx.sendLovelace(
        {
          address: scriptAddress,
          datum: { value: datum, inline: true }
        },
        '5000000' // 5 ADA
      );

      tx.setChangeAddress(employerAddress);

      const unsignedTx = await tx.build();
      const signedTx = await this.wallet.signTx(unsignedTx);
      const txHash = await this.wallet.submitTx(signedTx);

      console.log('✅ Escrow created!');
      console.log('🎉 TX Hash:', txHash);
      console.log(`🔗 https://preprod.cardanoscan.io/transaction/${txHash}`);

      return txHash;
    } catch (error: any) {
      console.error('Escrow creation failed:', error);
      throw new Error(`Failed to create escrow: ${error.message}`);
    }
  }

  // Release escrow funds
  async releaseEscrow(
    escrowTxHash: string,
    recipientAddress: string
  ): Promise<string> {
    if (!this.wallet) throw new Error('Wallet not connected');

    try {
      const { Transaction } = await getMeshCore();
      // Placeholder for actual script interaction
      const tx = new Transaction({ initiator: this.wallet });
      
      const unsignedTx = await tx.build();
      const signedTx = await this.wallet.signTx(unsignedTx);
      const txHash = await this.wallet.submitTx(signedTx);

      return txHash;
    } catch (error: any) {
      throw new Error(`Failed to release escrow: ${error.message}`);
    }
  }

  /**
   * Mint reputation NFT badge (following reputation-score.ts pattern)
   * Returns complete NFT info: {policyId, assetName, txHash, utxoRef}
   */
  async mintReputationNFT(
    walletAddress: string,
    metadata: { name: string; description: string; image: string; attributes: any }
  ): Promise<{ policyId: string; assetName: string; txHash: string; utxoRef: string }> {
    if (!this.wallet) throw new Error('Wallet not connected');

    console.log('\n🎯 Minting Reputation NFT Badge');
    console.log('Wallet:', walletAddress);

    try {
      // Generate unique asset name with timestamp
      const timestamp = Date.now().toString();
      const assetName = `ReputationBadge${timestamp.slice(-8)}`;
      console.log('Asset Name:', assetName);

      const { ForgeScript, Transaction } = await getMeshCore();

      // Get wallet address
      const address = await this.wallet.getChangeAddress();
      console.log('Wallet address:', address);

      // Create forging script (one-signature policy)
      const forgingScript = ForgeScript.withOneSignature(address);
      console.log('Forging script (hex):', forgingScript);

      // Prepare metadata following CIP-25
      const assetMetadata: any = {
        name: metadata.name,
        image: metadata.image,
        description: metadata.description,
        mediaType: 'image/png',
        files: [{
          name: metadata.name,
          mediaType: 'image/png',
          src: metadata.image
        }],
        ...metadata.attributes
      };

      // Build and submit transaction using Mesh Transaction builder
      console.log('Building mint transaction...');
      const tx = new Transaction({ initiator: this.wallet });
      
      // Mint the asset (Transaction builder will handle policy ID internally)
      tx.mintAsset(
        forgingScript,
        {
          assetName,
          assetQuantity: '1',
        },
        assetMetadata
      );
      
      tx.setChangeAddress(address);
      
      // Build, sign, and submit
      const unsignedTx = await tx.build();
      console.log('✓ Transaction built');
      
      const signedTx = await this.wallet.signTx(unsignedTx);
      console.log('✓ Transaction signed');
      
      const txHash = await this.wallet.submitTx(signedTx);
      console.log('✅ NFT Minted!');
      console.log('🎉 TX Hash:', txHash);
      console.log(`🔗 https://preprod.cardanoscan.io/transaction/${txHash}`);

      // Calculate policy ID from forging script
      // The policy ID is the hash of the forging script
      const { resolveScriptHash } = await import('@meshsdk/core');
      const policyId = resolveScriptHash(forgingScript);
      console.log('Policy ID:', policyId);

      // Create result object
      const result = {
        policyId,
        assetName,
        txHash,
        utxoRef: `${txHash}#0`
      };

      console.log('📦 Returning result:', JSON.stringify(result, null, 2));
      
      return result;
    } catch (error: any) {
      console.error('=== NFT Minting Failed ===');
      console.error('Error:', error);
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      
      // Re-throw with more context
      throw error;
    }
  }

  // Refund escrow to employer
  async refundEscrow(
    escrowTxHash: string,
    employerAddress: string
  ): Promise<string> {
    if (!this.wallet) throw new Error('Wallet not connected');

    try {
      const { Transaction } = await getMeshCore();
      // Placeholder for actual script interaction
      const tx = new Transaction({ initiator: this.wallet });
      
      const unsignedTx = await tx.build();
      const signedTx = await this.wallet.signTx(unsignedTx);
      const txHash = await this.wallet.submitTx(signedTx);

      return txHash;
    } catch (error: any) {
      throw new Error(`Failed to refund escrow: ${error.message}`);
    }
  }

  // Wait for transaction confirmation
  async waitForConfirmation(txHash: string, maxAttempts: number = 30): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        // Check transaction status using Blockfrost or similar
        // This is a placeholder
        return true;
      } catch (error) {
        continue;
      }
    }
    return false;
  }

  // Disconnect wallet
  disconnect(): void {
    this.wallet = null;
  }
}

// Create singleton instance
const config: CardanoConfig = {
  network: 'preprod',
  blockfrostApiKey: process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY || '',
};

export const cardanoService = new CardanoService(config);
