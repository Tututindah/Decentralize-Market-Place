/**
 * CardanoService Usage Examples
 * How to use the CardanoService in your React components
 */

import { cardanoService } from '../services/cardano.service';
import { useWallet } from '../contexts/WalletContext';

// ============================================================================
// EXAMPLE 1: CREATE JOB LISTING
// ============================================================================

export async function handleCreateJob() {
  try {
    // Make sure wallet is connected via WalletContext
    const jobId = `JOB-${Date.now()}`;
    const title = "Cardano Smart Contract Development";
    const descriptionHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    const budgetMin = 50_000_000; // 50 USDM (with 6 decimals)
    const budgetMax = 100_000_000; // 100 USDM
    const deadline = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days

    const txHash = await cardanoService.createJob({
      jobId,
      title,
      descriptionHash,
      budgetMin,
      budgetMax,
      deadline,
    });

    console.log('Job created!', txHash);
    
    // Wait for confirmation (optional)
    const confirmed = await cardanoService.waitForConfirmation(txHash);
    if (confirmed) {
      console.log('Job listing confirmed on-chain!');
    }

    return txHash;
  } catch (error) {
    console.error('Failed to create job:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 2: CREATE ESCROW (When bid is accepted)
// ============================================================================

export async function handleCreateEscrow(
  jobId: string,
  employerAddress: string,
  freelancerAddress: string,
  amount: number // in USDM with 6 decimals
) {
  try {
    // Arbiter can be a separate admin address
    // For demo, you can use employer address
    const arbiterAddress = employerAddress;

    const { txHash, escrowInfo } = await cardanoService.createEscrow({
      jobId,
      employerAddress,
      freelancerAddress,
      arbiterAddress,
      amount,
    });

    console.log('Escrow created!', txHash);
    console.log('Escrow info:', escrowInfo);

    // Save escrowInfo to your database for later use
    // You'll need it to release or refund the escrow
    await saveEscrowInfoToDatabase(escrowInfo);

    // Wait for confirmation
    const confirmed = await cardanoService.waitForConfirmation(txHash);
    if (confirmed) {
      console.log('Escrow confirmed on-chain!');
    }

    return { txHash, escrowInfo };
  } catch (error) {
    console.error('Failed to create escrow:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 3: RELEASE ESCROW (When work is completed)
// ============================================================================

export async function handleReleaseEscrow(
  escrowTxHash: string,
  jobId: string,
  employerAddress: string,
  freelancerAddress: string,
  arbiterAddress: string,
  amount: number,
  freelancerWallet: any // MeshWallet instance from freelancer
) {
  try {
    // IMPORTANT: Both employer and freelancer must sign!
    // The current wallet (from WalletContext) should be the employer's wallet
    // You need to get the freelancer's wallet instance to sign as well

    const txHash = await cardanoService.releaseEscrow({
      escrowTxHash,
      jobId,
      employerAddress,
      freelancerAddress,
      arbiterAddress,
      amount,
      freelancerWallet, // Pass freelancer's MeshWallet instance
    });

    console.log('Escrow released to freelancer!', txHash);

    // Wait for confirmation
    const confirmed = await cardanoService.waitForConfirmation(txHash);
    if (confirmed) {
      console.log('Release confirmed on-chain!');
      // Update job status in database
    }

    return txHash;
  } catch (error) {
    console.error('Failed to release escrow:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 4: REFUND ESCROW (In case of dispute)
// ============================================================================

export async function handleRefundEscrow(
  escrowTxHash: string,
  jobId: string,
  employerAddress: string,
  freelancerAddress: string,
  arbiterAddress: string,
  amount: number,
  arbiterWallet: any // MeshWallet instance from arbiter
) {
  try {
    // IMPORTANT: Both employer and arbiter must sign!
    // The current wallet should be the employer's wallet
    // You need the arbiter's wallet instance as well

    const txHash = await cardanoService.refundEscrow({
      escrowTxHash,
      jobId,
      employerAddress,
      freelancerAddress,
      arbiterAddress,
      amount,
      arbiterWallet, // Pass arbiter's MeshWallet instance
    });

    console.log('Escrow refunded to employer!', txHash);

    // Wait for confirmation
    const confirmed = await cardanoService.waitForConfirmation(txHash);
    if (confirmed) {
      console.log('Refund confirmed on-chain!');
      // Update job status in database
    }

    return txHash;
  } catch (error) {
    console.error('Failed to refund escrow:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 5: USING IN REACT COMPONENT
// ============================================================================

export function CreateJobComponent() {
  const { wallet, connected } = useWallet();

  const handleSubmit = async (formData: any) => {
    if (!connected || !wallet) {
      alert('Please connect your wallet first');
      return;
    }

    // Set the wallet instance in cardanoService
    cardanoService.setWallet(wallet);

    try {
      const jobId = `JOB-${Date.now()}`;
      
      const txHash = await cardanoService.createJob({
        jobId,
        title: formData.title,
        descriptionHash: await hashDescription(formData.description),
        budgetMin: formData.budgetMin * 1_000_000, // Convert to 6 decimals
        budgetMax: formData.budgetMax * 1_000_000,
        deadline: formData.deadline,
      });

      alert(`Job created! TX: ${txHash}`);
      
      // Optionally wait for confirmation
      await cardanoService.waitForConfirmation(txHash);
      
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create job');
    }
  };

  return (
    <div>
      {/* Your form UI here */}
      <button onClick={handleSubmit}>Create Job</button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: ACCEPT BID AND CREATE ESCROW
// ============================================================================

export async function handleAcceptBid(
  jobId: string,
  bidAmount: number,
  freelancerAddress: string
) {
  const { wallet, address, connected } = useWallet();
  
  if (!connected || !wallet || !address) {
    throw new Error('Wallet not connected');
  }

  // Set wallet
  cardanoService.setWallet(wallet);

  try {
    // Create escrow with bid amount
    const { txHash, escrowInfo } = await cardanoService.createEscrow({
      jobId,
      employerAddress: address,
      freelancerAddress,
      arbiterAddress: address, // Can be separate admin
      amount: bidAmount * 1_000_000, // Convert to 6 decimals
    });

    console.log('Escrow created:', txHash);
    
    // Save to backend
    await fetch('/api/escrows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId,
        txHash,
        escrowInfo,
      }),
    });

    return { txHash, escrowInfo };
  } catch (error) {
    console.error('Failed to accept bid:', error);
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function hashDescription(description: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(description);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function saveEscrowInfoToDatabase(escrowInfo: any) {
  // Save to your backend database
  await fetch('/api/escrows/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(escrowInfo),
  });
}

// ============================================================================
// NOTES:
// ============================================================================

/**
 * 1. Always set the wallet using cardanoService.setWallet(wallet) before operations
 * 
 * 2. For multi-signature operations (release/refund):
 *    - You need BOTH wallets to sign
 *    - Pass the second wallet as a parameter
 *    - The service will collect both signatures
 * 
 * 3. USDM amounts:
 *    - Always use 6 decimals (multiply by 1_000_000)
 *    - Example: 100 USDM = 100_000_000
 * 
 * 4. Transaction confirmation:
 *    - Use waitForConfirmation() to wait for on-chain confirmation
 *    - Default timeout is 60 attempts (5 minutes)
 * 
 * 5. Error handling:
 *    - Always wrap in try-catch
 *    - Show user-friendly error messages
 *    - Log errors for debugging
 * 
 * 6. Plutus.json:
 *    - Must be in /public folder (web root for Vite)
 *    - Contains validator scripts
 *    - Loaded automatically by service
 */
