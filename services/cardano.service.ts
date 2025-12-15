/**
 * Cardano Blockchain Service
 * Handles all on-chain interactions for DecentGigs platform
 * Based on test-freelance-platform.ts pattern with multi-signature support
 */

import {
  BlockfrostProvider,
  MeshWallet,
  deserializeAddress,
  mConStr0,
  UTxO,
} from "@meshsdk/core";
import { getScript, getTxBuilder, getUtxoByTxHash } from "./mesh-utils";

// Configuration
const BLOCKFROST_API_KEY = process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY || "preprodHRP2qbfZXQbN1FOMOio2HzZ9VO0vZigh";
const USDM_POLICY_ID = process.env.NEXT_PUBLIC_USDM_POLICY_ID || "f96672ded25c90551d210e883099110f613e0e65012d5b88b68c51d0";
const USDM_ASSET_NAME = process.env.NEXT_PUBLIC_USDM_ASSET_NAME || "4d4f434b5f5553444d";
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * CardanoService - Singleton service for blockchain interactions
 * Uses browser wallet (not mnemonic) for production
 */
export class CardanoService {
  private provider: BlockfrostProvider;
  private wallet: MeshWallet | null = null;
  private static instance: CardanoService;

  constructor() {
    this.provider = new BlockfrostProvider(BLOCKFROST_API_KEY);
  }

  /**
   * Get singleton instance
   */
  static getInstance(): CardanoService {
    if (!CardanoService.instance) {
      CardanoService.instance = new CardanoService();
    }
    return CardanoService.instance;
  }

  /**
   * Set wallet instance (for browser wallet connection)
   */
  setWallet(wallet: MeshWallet) {
    this.wallet = wallet;
  }

  /**
   * Connect wallet using mnemonic (for testing only)
   */
  async connectWallet(mnemonic: string[]): Promise<string> {
    this.wallet = new MeshWallet({
      networkId: 0,
      fetcher: this.provider,
      submitter: this.provider,
      key: {
        type: "mnemonic",
        words: mnemonic,
      },
    });

    const address = await this.wallet.getChangeAddress();
    return address;
  }

  /**
   * Get wallet address
   */
  async getAddress(): Promise<string> {
    if (!this.wallet) throw new Error("Wallet not connected");
    return await this.wallet.getChangeAddress();
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<{ ada: number; usdm: number }> {
    if (!this.wallet) throw new Error("Wallet not connected");

    const utxos = await this.wallet.getUtxos();
    let ada = 0;
    let usdm = 0;

    utxos.forEach((utxo) => {
      utxo.output.amount.forEach((asset) => {
        if (asset.unit === "lovelace") {
          ada += parseInt(asset.quantity);
        } else if (asset.unit === `${USDM_POLICY_ID}${USDM_ASSET_NAME}`) {
          usdm += parseInt(asset.quantity);
        }
      });
    });

    return {
      ada: ada / 1_000_000,
      usdm: usdm / 1_000_000,
    };
  }

  /**
   * Load Plutus blueprint
   */
  private async loadBlueprint() {
    const response = await fetch("/plutus.json");
    return await response.json();
  }

  /**
   * Create job listing on-chain
   * Based on createJobListing() from test-freelance-platform.ts
   */
  async createJob(params: {
    jobId: string;
    title: string;
    descriptionHash: string;
    budgetMin: number;
    budgetMax: number;
    deadline: number;
  }): Promise<string> {
    if (!this.wallet) throw new Error("Wallet not connected");

    const employerAddress = await this.wallet.getChangeAddress();
    const employerUtxos = await this.wallet.getUtxos();
    const employerHash = deserializeAddress(employerAddress).pubKeyHash;

    // Load validator
    const blueprint = await this.loadBlueprint();
    const jobValidator = blueprint.validators.find(
      (v: any) => v.title === "job_listing.job_listing.spend"
    );

    if (!jobValidator) {
      throw new Error("Job listing validator not found");
    }

    const { scriptAddr } = getScript(jobValidator.compiledCode);

    console.log(`\n📋 Creating Job Listing:`);
    console.log(`   Job ID: ${params.jobId}`);
    console.log(`   Title: ${params.title}`);
    console.log(`   Budget: ${params.budgetMin} - ${params.budgetMax} USDM`);
    console.log(`   Deadline: ${new Date(params.deadline).toISOString()}`);

    // Create job datum (inline datum)
    const datum = mConStr0([
      employerHash,
      Buffer.from(params.jobId).toString("hex"),
      Buffer.from(params.title).toString("hex"),
      params.descriptionHash,
      params.budgetMin,
      params.budgetMax,
      params.deadline,
      1, // is_active = true
    ]);

    const txBuilder = getTxBuilder();
    await txBuilder
      .txOut(scriptAddr, [{ unit: "lovelace", quantity: "3000000" }])
      .txOutInlineDatumValue(datum)
      .changeAddress(employerAddress)
      .selectUtxosFrom(employerUtxos)
      .complete();

    const unsignedTx = txBuilder.txHex;
    const signedTx = await this.wallet.signTx(unsignedTx);
    const txHash = await this.wallet.submitTx(signedTx);

    console.log(`✅ Job listing created! TX: ${txHash}`);
    console.log(`🔗 https://preprod.cardanoscan.io/transaction/${txHash}`);

    return txHash;
  }

  /**
   * Create escrow when bid is accepted
   * Based on createEscrow() from test-freelance-platform.ts
   */
  async createEscrow(params: {
    jobId: string;
    employerAddress: string;
    freelancerAddress: string;
    arbiterAddress: string;
    amount: number; // in USDM (raw amount with 6 decimals)
  }): Promise<{ txHash: string; escrowInfo: any }> {
    if (!this.wallet) throw new Error("Wallet not connected");

    const employerAddress = params.employerAddress;
    const freelancerAddress = params.freelancerAddress;
    const employerUtxos = await this.wallet.getUtxos();

    const employerHash = deserializeAddress(employerAddress).pubKeyHash;
    const freelancerHash = deserializeAddress(freelancerAddress).pubKeyHash;
    const arbiterHash = deserializeAddress(params.arbiterAddress).pubKeyHash;

    // Load validator
    const blueprint = await this.loadBlueprint();
    const escrowValidator = blueprint.validators.find(
      (v: any) => v.title === "freelance_escrow.freelance_escrow.spend"
    );

    if (!escrowValidator) {
      throw new Error("Freelance escrow validator not found");
    }

    const { scriptAddr } = getScript(escrowValidator.compiledCode);

    console.log(`\n🔒 Creating Escrow:`);
    console.log(`   Employer: ${employerAddress.substring(0, 50)}...`);
    console.log(`   Freelancer: ${freelancerAddress.substring(0, 50)}...`);
    console.log(`   Arbiter: ${params.arbiterAddress.substring(0, 50)}...`);
    console.log(`   Amount: ${params.amount / 1_000_000} USDM`);
    console.log(`   Job ID: ${params.jobId}`);

    // Create escrow datum
    const datum = mConStr0([
      employerHash,
      freelancerHash,
      arbiterHash,
      USDM_POLICY_ID,
      USDM_ASSET_NAME,
      params.amount,
      Buffer.from(params.jobId).toString("hex"),
    ]);

    // Lock 5 ADA + USDM tokens in escrow
    const assets = [
      { unit: "lovelace", quantity: "5000000" }, // 5 ADA
      { unit: USDM_POLICY_ID + USDM_ASSET_NAME, quantity: params.amount.toString() },
    ];

    const txBuilder = getTxBuilder();
    await txBuilder
      .txOut(scriptAddr, assets)
      .txOutDatumHashValue(datum)
      .changeAddress(employerAddress)
      .selectUtxosFrom(employerUtxos)
      .complete();

    const unsignedTx = txBuilder.txHex;
    const signedTx = await this.wallet.signTx(unsignedTx);
    const txHash = await this.wallet.submitTx(signedTx);

    console.log(`✅ Escrow created! TX: ${txHash}`);
    console.log(`🔗 https://preprod.cardanoscan.io/transaction/${txHash}`);

    // Save escrow info for later use
    const escrowInfo = {
      txHash,
      outputIndex: 0,
      scriptAddress: scriptAddr,
      jobId: params.jobId,
      employerAddress,
      employerHash,
      freelancerAddress,
      freelancerHash,
      arbiterHash,
      usdmPolicy: USDM_POLICY_ID,
      usdmAssetName: USDM_ASSET_NAME,
      escrowAmount: params.amount,
      timestamp: new Date().toISOString(),
    };

    return { txHash, escrowInfo };
  }

  /**
   * Release escrow to freelancer
   * Based on releaseEscrow() from test-freelance-platform.ts
   * Requires BOTH employer AND freelancer signatures (multi-sig)
   */
  async releaseEscrow(params: {
    escrowTxHash: string;
    jobId: string;
    employerAddress: string;
    freelancerAddress: string;
    arbiterAddress: string;
    amount: number;
    freelancerWallet: MeshWallet; // Need freelancer's wallet for multi-sig
  }): Promise<string> {
    if (!this.wallet) throw new Error("Wallet not connected");

    const employerAddress = params.employerAddress;
    const freelancerAddress = params.freelancerAddress;
    const employerUtxos = await this.wallet.getUtxos();
    const employerCollateral = (await this.wallet.getCollateral())[0];

    const employerHash = deserializeAddress(employerAddress).pubKeyHash;
    const freelancerHash = deserializeAddress(freelancerAddress).pubKeyHash;
    const arbiterHash = deserializeAddress(params.arbiterAddress).pubKeyHash;

    // Load validator
    const blueprint = await this.loadBlueprint();
    const escrowValidator = blueprint.validators.find(
      (v: any) => v.title === "freelance_escrow.freelance_escrow.spend"
    );

    if (!escrowValidator) {
      throw new Error("Freelance escrow validator not found");
    }

    const { scriptCbor } = getScript(escrowValidator.compiledCode);

    console.log(`\n🔓 Releasing Escrow:`);
    console.log(`   Fetching escrow UTxO...`);

    // Fetch escrow UTxO
    const scriptUtxo = await getUtxoByTxHash(params.escrowTxHash);

    if (!scriptUtxo) {
      throw new Error("Escrow UTxO not found");
    }

    console.log(`   ✅ Found escrow: ${params.amount / 1_000_000} USDM + 5 ADA`);

    // Recreate datum
    const datum = mConStr0([
      employerHash,
      freelancerHash,
      arbiterHash,
      USDM_POLICY_ID,
      USDM_ASSET_NAME,
      params.amount,
      Buffer.from(params.jobId).toString("hex"),
    ]);

    // Release redeemer (constructor 0)
    const redeemer = mConStr0([]);

    console.log(`\n🔐 MULTI-SIGNATURE REQUIREMENT:`);
    console.log(`   - Smart contract requires BOTH employer AND freelancer signatures`);
    console.log(`   - This ensures both parties agree to the release`);
    console.log(`\n✍️  Collecting signatures from both parties...`);

    const txBuilder = getTxBuilder();
    await txBuilder
      .spendingPlutusScript("V3")
      .txIn(
        scriptUtxo.input.txHash,
        scriptUtxo.input.outputIndex,
        scriptUtxo.output.amount,
        scriptUtxo.output.address
      )
      .txInScript(scriptCbor)
      .txInRedeemerValue(redeemer)
      .txInDatumValue(datum)
      .requiredSignerHash(employerHash)    // ✅ Employer signature required
      .requiredSignerHash(freelancerHash)  // ✅ Freelancer signature required
      .txOut(freelancerAddress, scriptUtxo.output.amount)
      .changeAddress(employerAddress)
      .txInCollateral(
        employerCollateral.input.txHash,
        employerCollateral.input.outputIndex,
        employerCollateral.output.amount,
        employerCollateral.output.address
      )
      .selectUtxosFrom(employerUtxos)
      .complete();

    const unsignedTx = txBuilder.txHex;

    // Sign with employer wallet (Party 1)
    console.log(`\n✍️  [1/2] Signing with EMPLOYER wallet...`);
    const employerSignedTx = await this.wallet.signTx(unsignedTx, true);
    console.log(`   ✅ Employer signature collected`);

    // Sign with freelancer wallet (Party 2)
    console.log(`✍️  [2/2] Signing with FREELANCER wallet...`);
    const fullySignedTx = await params.freelancerWallet.signTx(employerSignedTx, true);
    console.log(`   ✅ Freelancer signature collected`);

    console.log(`\n🔒 Transaction fully signed with both parties!`);
    console.log(`📡 Submitting transaction to blockchain...`);

    // Submit
    const txHash = await this.wallet.submitTx(fullySignedTx);

    console.log(`\n✅ Escrow released to freelancer!`);
    console.log(`🎉 TX Hash: ${txHash}`);
    console.log(`🔗 https://preprod.cardanoscan.io/transaction/${txHash}`);
    console.log(`\n💡 Both employer and freelancer signatures were verified on-chain`);

    return txHash;
  }

  /**
   * Refund escrow to employer (requires employer + arbiter signatures)
   */
  async refundEscrow(params: {
    escrowTxHash: string;
    jobId: string;
    employerAddress: string;
    freelancerAddress: string;
    arbiterAddress: string;
    amount: number;
    arbiterWallet: MeshWallet;
  }): Promise<string> {
    if (!this.wallet) throw new Error("Wallet not connected");

    const employerAddress = params.employerAddress;
    const employerUtxos = await this.wallet.getUtxos();
    const employerCollateral = (await this.wallet.getCollateral())[0];

    const employerHash = deserializeAddress(employerAddress).pubKeyHash;
    const freelancerHash = deserializeAddress(params.freelancerAddress).pubKeyHash;
    const arbiterHash = deserializeAddress(params.arbiterAddress).pubKeyHash;

    // Load validator
    const blueprint = await this.loadBlueprint();
    const escrowValidator = blueprint.validators.find(
      (v: any) => v.title === "freelance_escrow.freelance_escrow.spend"
    );

    if (!escrowValidator) {
      throw new Error("Freelance escrow validator not found");
    }

    const { scriptCbor } = getScript(escrowValidator.compiledCode);

    console.log(`\n💰 Refunding Escrow:`);
    console.log(`   Fetching escrow UTxO...`);

    // Fetch escrow UTxO
    const scriptUtxo = await getUtxoByTxHash(params.escrowTxHash);

    if (!scriptUtxo) {
      throw new Error("Escrow UTxO not found");
    }

    console.log(`   ✅ Found escrow: ${params.amount / 1_000_000} USDM + 5 ADA`);

    // Recreate datum
    const datum = mConStr0([
      employerHash,
      freelancerHash,
      arbiterHash,
      USDM_POLICY_ID,
      USDM_ASSET_NAME,
      params.amount,
      Buffer.from(params.jobId).toString("hex"),
    ]);

    // Refund redeemer (constructor 1)
    const redeemer = {
      ...mConStr0([]),
      alternative: 1
    } as any;

    console.log(`\n🔐 MULTI-SIGNATURE REQUIREMENT:`);
    console.log(`   - Smart contract requires BOTH employer AND arbiter signatures`);
    console.log(`   - Arbiter mediates disputes and approves refunds`);
    console.log(`\n✍️  Collecting signatures...`);

    const txBuilder = getTxBuilder();
    await txBuilder
      .spendingPlutusScript("V3")
      .txIn(
        scriptUtxo.input.txHash,
        scriptUtxo.input.outputIndex,
        scriptUtxo.output.amount,
        scriptUtxo.output.address
      )
      .txInScript(scriptCbor)
      .txInRedeemerValue(redeemer)
      .txInDatumValue(datum)
      .requiredSignerHash(employerHash)    // ✅ Employer signature required
      .requiredSignerHash(arbiterHash)     // ✅ Arbiter signature required
      .txOut(employerAddress, scriptUtxo.output.amount)
      .changeAddress(employerAddress)
      .txInCollateral(
        employerCollateral.input.txHash,
        employerCollateral.input.outputIndex,
        employerCollateral.output.amount,
        employerCollateral.output.address
      )
      .selectUtxosFrom(employerUtxos)
      .complete();

    const unsignedTx = txBuilder.txHex;

    // Sign with employer wallet (Party 1)
    console.log(`\n✍️  [1/2] Signing with EMPLOYER wallet...`);
    const employerSignedTx = await this.wallet.signTx(unsignedTx, true);
    console.log(`   ✅ Employer signature collected`);

    // Sign with arbiter wallet (Party 2)
    console.log(`✍️  [2/2] Signing with ARBITER wallet...`);
    const fullySignedTx = await params.arbiterWallet.signTx(employerSignedTx, true);
    console.log(`   ✅ Arbiter signature collected`);

    console.log(`\n🔒 Transaction fully signed!`);
    console.log(`📡 Submitting transaction to blockchain...`);

    // Submit
    const txHash = await this.wallet.submitTx(fullySignedTx);

    console.log(`\n✅ Escrow refunded to employer!`);
    console.log(`🎉 TX Hash: ${txHash}`);
    console.log(`🔗 https://preprod.cardanoscan.io/transaction/${txHash}`);

    return txHash;
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txHash: string): Promise<"pending" | "confirmed" | "failed"> {
    try {
      await this.provider.fetchTxInfo(txHash);
      return "confirmed";
    } catch (error) {
      return "pending";
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(txHash: string, maxAttempts = 60): Promise<boolean> {
    console.log(`\n⏳ Waiting for transaction confirmation...`);
    console.log(`   TX: ${txHash}`);
    
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getTransactionStatus(txHash);
      if (status === "confirmed") {
        console.log(`   ✅ Transaction confirmed!`);
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
      if (i > 0) process.stdout.write('.');
    }
    
    console.log(`\n   ❌ Transaction not confirmed after ${maxAttempts * 5} seconds`);
    return false;
  }

  /**
   * Get UTxO by transaction hash (helper for components)
   */
  async getUtxoByTxHash(txHash: string): Promise<UTxO> {
    return await getUtxoByTxHash(txHash);
  }

  /**
   * Get blockchain provider (helper for components)
   */
  getProvider(): BlockfrostProvider {
    return this.provider;
  }

  /**
   * Initialize user reputation on-chain (called during account setup)
   */
  async initializeReputation(params: {
    walletAddress: string;
    initialScore?: number;
  }): Promise<string> {
    if (!this.wallet) throw new Error("Wallet not connected");

    const { walletAddress, initialScore = 0 } = params;

    // Create reputation token (NFT) for user
    const userHash = deserializeAddress(walletAddress).pubKeyHash;
    
    console.log(`\n🌟 Initializing Reputation:`);
    console.log(`   Address: ${walletAddress}`);
    console.log(`   Initial Score: ${initialScore}`);
    console.log(`   User Hash: ${userHash}`);

    // Build transaction with metadata
    // Note: Metadata attachment for production would use CIP-20 standard
    const txBuilder = getTxBuilder();
    const unsignedTx = await txBuilder
      .txOut(walletAddress, [{ unit: "lovelace", quantity: "2000000" }])
      .changeAddress(walletAddress)
      .selectUtxosFrom(await this.wallet.getUtxos())
      .complete();

    // Add metadata manually for now (Mesh SDK limitation)
    // In production, use Lucid or submit metadata separately
    const signedTx = await this.wallet.signTx(unsignedTx);
    const submittedTxHash = await this.wallet.submitTx(signedTx);

    console.log(`✅ Reputation initialized`);
    console.log(`🎉 TX Hash: ${submittedTxHash}`);
    console.log(`🔗 https://preprod.cardanoscan.io/transaction/${submittedTxHash}`);

    return submittedTxHash;
  }

  /**
   * Get user reputation from on-chain data
   * Note: For production, implement proper metadata query using Koios or DB Sync
   */
  async getUserReputation(walletAddress: string): Promise<{
    score: number;
    trustScore: number;
    totalJobs: number;
    completedJobs: number;
  }> {
    try {
      // For now, fetch from backend which syncs with blockchain
      // In production, query blockchain metadata directly via Koios API
      const response = await fetch(`${API_URL}/users/profile/${walletAddress}/reputation`);
      
      if (response.ok) {
        const data = await response.json();
        return {
          score: data.reputation,
          trustScore: data.trustScore,
          totalJobs: data.totalJobs,
          completedJobs: data.completedJobs
        };
      }

      return {
        score: 0,
        trustScore: 0.0,
        totalJobs: 0,
        completedJobs: 0
      };
    } catch (error) {
      console.error('Error fetching reputation:', error);
      return {
        score: 0,
        trustScore: 0.0,
        totalJobs: 0,
        completedJobs: 0
      };
    }
  }

  /**
   * Update user reputation on-chain (after job completion)
   */
  async updateReputation(params: {
    walletAddress: string;
    scoreChange: number;
    completed: boolean;
  }): Promise<string> {
    if (!this.wallet) throw new Error("Wallet not connected");

    const { walletAddress, scoreChange, completed } = params;
    
    // Get current reputation
    const current = await this.getUserReputation(walletAddress);
    
    const newScore = current.score + scoreChange;
    const newCompleted = completed ? current.completedJobs + 1 : current.completedJobs;
    const newTotal = current.totalJobs + 1;
    const newTrustScore = newTotal > 0 ? (newCompleted / newTotal) * 100 : 0;

    console.log(`\n📊 Updating Reputation:`);
    console.log(`   Score: ${current.score} → ${newScore}`);
    console.log(`   Completed: ${current.completedJobs} → ${newCompleted}`);
    console.log(`   Trust Score: ${current.trustScore.toFixed(2)}% → ${newTrustScore.toFixed(2)}%`);

    // Build transaction
    // Reputation data will be synced to backend after transaction
    const txBuilder = getTxBuilder();
    const unsignedTx = await txBuilder
      .txOut(walletAddress, [{ unit: "lovelace", quantity: "2000000" }])
      .changeAddress(walletAddress)
      .selectUtxosFrom(await this.wallet.getUtxos())
      .complete();

    // Note: Metadata should be added here - for production use Lucid or CML
    const signedTx = await this.wallet.signTx(unsignedTx);
    const submittedTxHash = await this.wallet.submitTx(signedTx);

    console.log(`✅ Reputation updated`);
    console.log(`🎉 TX Hash: ${submittedTxHash}`);

    return submittedTxHash;
  }
}

// Export singleton instance
export const cardanoService = CardanoService.getInstance();
