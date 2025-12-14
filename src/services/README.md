# CardanoService Documentation

Complete blockchain interaction service for DecentGigs platform, based on the proven `test-freelance-platform.ts` pattern.

## 📁 Files Overview

- **`cardano.service.ts`** - Main service for all blockchain operations
- **`mesh-utils.ts`** - Utility functions for Mesh SDK operations
- **`USAGE_EXAMPLES.tsx`** - Comprehensive usage examples
- **`/plutus.json`** - Plutus validator scripts (in web root)

## 🚀 Quick Start

### 1. Import the Service

```typescript
import { cardanoService } from './services/cardano.service';
import { useWallet } from './contexts/WalletContext';
```

### 2. Set Wallet Instance

```typescript
const { wallet, connected } = useWallet();

if (connected && wallet) {
  cardanoService.setWallet(wallet);
}
```

### 3. Use Service Methods

```typescript
// Create job
const txHash = await cardanoService.createJob({
  jobId: "JOB-123",
  title: "Smart Contract Dev",
  descriptionHash: "...",
  budgetMin: 50_000_000, // 50 USDM
  budgetMax: 100_000_000, // 100 USDM
  deadline: Date.now() + 30 * 24 * 60 * 60 * 1000
});
```

## 📋 Available Methods

### `createJob(params)`
Create a job listing on-chain.

**Parameters:**
```typescript
{
  jobId: string;           // Unique job identifier
  title: string;           // Job title
  descriptionHash: string; // SHA256 hash of description
  budgetMin: number;       // Min budget in USDM (6 decimals)
  budgetMax: number;       // Max budget in USDM (6 decimals)
  deadline: number;        // Unix timestamp
}
```

**Returns:** `Promise<string>` - Transaction hash

**Example:**
```typescript
const txHash = await cardanoService.createJob({
  jobId: `JOB-${Date.now()}`,
  title: "Cardano Smart Contract Development",
  descriptionHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  budgetMin: 50_000_000,  // 50 USDM
  budgetMax: 100_000_000, // 100 USDM
  deadline: Date.now() + (30 * 24 * 60 * 60 * 1000)
});
```

---

### `createEscrow(params)`
Create escrow when a bid is accepted.

**Parameters:**
```typescript
{
  jobId: string;           // Job identifier
  employerAddress: string; // Employer's Cardano address
  freelancerAddress: string; // Freelancer's Cardano address
  arbiterAddress: string;  // Arbiter's address (can be admin)
  amount: number;          // Amount in USDM (6 decimals)
}
```

**Returns:** `Promise<{ txHash: string; escrowInfo: any }>`

**Example:**
```typescript
const { txHash, escrowInfo } = await cardanoService.createEscrow({
  jobId: "JOB-123",
  employerAddress: "addr_test1...",
  freelancerAddress: "addr_test1...",
  arbiterAddress: "addr_test1...", // Can be separate admin
  amount: 75_000_000 // 75 USDM
});

// Save escrowInfo to database for later use!
await saveToDatabase(escrowInfo);
```

---

### `releaseEscrow(params)`
Release escrow funds to freelancer (requires BOTH signatures).

**Parameters:**
```typescript
{
  escrowTxHash: string;      // Escrow creation TX hash
  jobId: string;             // Job identifier
  employerAddress: string;   // Employer's address
  freelancerAddress: string; // Freelancer's address
  arbiterAddress: string;    // Arbiter's address
  amount: number;            // Amount in USDM (6 decimals)
  freelancerWallet: MeshWallet; // Freelancer's wallet instance
}
```

**Returns:** `Promise<string>` - Transaction hash

**⚠️ Multi-Signature Required:**
- Employer signature (current wallet)
- Freelancer signature (passed as parameter)

**Example:**
```typescript
// Employer initiates release
cardanoService.setWallet(employerWallet);

const txHash = await cardanoService.releaseEscrow({
  escrowTxHash: "abc123...",
  jobId: "JOB-123",
  employerAddress: "addr_test1...",
  freelancerAddress: "addr_test1...",
  arbiterAddress: "addr_test1...",
  amount: 75_000_000,
  freelancerWallet: freelancerWalletInstance // ⚡ Must provide!
});
```

---

### `refundEscrow(params)`
Refund escrow to employer (requires employer + arbiter signatures).

**Parameters:**
```typescript
{
  escrowTxHash: string;
  jobId: string;
  employerAddress: string;
  freelancerAddress: string;
  arbiterAddress: string;
  amount: number;
  arbiterWallet: MeshWallet; // Arbiter's wallet instance
}
```

**Returns:** `Promise<string>` - Transaction hash

**⚠️ Multi-Signature Required:**
- Employer signature (current wallet)
- Arbiter signature (passed as parameter)

**Example:**
```typescript
const txHash = await cardanoService.refundEscrow({
  escrowTxHash: "abc123...",
  jobId: "JOB-123",
  employerAddress: "addr_test1...",
  freelancerAddress: "addr_test1...",
  arbiterAddress: "addr_test1...",
  amount: 75_000_000,
  arbiterWallet: arbiterWalletInstance // ⚡ Must provide!
});
```

---

### `getBalance()`
Get wallet balance (ADA + USDM).

**Returns:** `Promise<{ ada: number; usdm: number }>`

**Example:**
```typescript
const { ada, usdm } = await cardanoService.getBalance();
console.log(`Balance: ${ada} ADA, ${usdm} USDM`);
```

---

### `waitForConfirmation(txHash, maxAttempts?)`
Wait for transaction confirmation on-chain.

**Parameters:**
- `txHash: string` - Transaction hash
- `maxAttempts?: number` - Max attempts (default: 60 = 5 minutes)

**Returns:** `Promise<boolean>` - True if confirmed

**Example:**
```typescript
const txHash = await cardanoService.createJob({...});
const confirmed = await cardanoService.waitForConfirmation(txHash);

if (confirmed) {
  console.log('Transaction confirmed!');
}
```

---

## 🔐 Multi-Signature Flow

### Release Escrow (Employer + Freelancer)

```
┌─────────────┐         ┌──────────────┐
│  Employer   │         │  Freelancer  │
│   Wallet    │         │    Wallet    │
└──────┬──────┘         └──────┬───────┘
       │                       │
       │ 1. Build TX           │
       │ 2. Sign with          │
       │    Employer           │
       ├──────────────────────>│
       │                       │
       │                  3. Sign with
       │                     Freelancer
       │<──────────────────────┤
       │                       │
       │ 4. Submit TX          │
       │    (fully signed)     │
       v                       v
   ┌───────────────────────────┐
   │    Cardano Blockchain     │
   │  ✅ Validates both sigs   │
   └───────────────────────────┘
```

### Refund Escrow (Employer + Arbiter)

```
┌─────────────┐         ┌──────────────┐
│  Employer   │         │    Arbiter   │
│   Wallet    │         │    Wallet    │
└──────┬──────┘         └──────┬───────┘
       │                       │
       │ 1. Build TX           │
       │ 2. Sign with          │
       │    Employer           │
       ├──────────────────────>│
       │                       │
       │                  3. Sign with
       │                     Arbiter
       │<──────────────────────┤
       │                       │
       │ 4. Submit TX          │
       v                       v
   ┌───────────────────────────┐
   │    Cardano Blockchain     │
   │  ✅ Validates both sigs   │
   └───────────────────────────┘
```

## 💰 USDM Amount Conversion

Always use 6 decimals for USDM amounts:

```typescript
// Display → Raw Amount
100 USDM     = 100_000_000  // Multiply by 1,000,000
50.5 USDM    = 50_500_000
0.1 USDM     = 100_000

// Raw Amount → Display
75_000_000   = 75 USDM      // Divide by 1,000,000
```

**Helper:**
```typescript
const toUSDM = (amount: number) => amount * 1_000_000;
const fromUSDM = (amount: number) => amount / 1_000_000;
```

## 🎯 React Component Integration

### CreateJobPage Example

```typescript
import { cardanoService } from '../services/cardano.service';
import { useWallet } from '../contexts/WalletContext';

export default function CreateJobPage() {
  const { wallet, connected, address } = useWallet();

  const handleSubmit = async (formData: any) => {
    if (!connected || !wallet) {
      alert('Connect wallet first!');
      return;
    }

    // Set wallet
    cardanoService.setWallet(wallet);

    try {
      const txHash = await cardanoService.createJob({
        jobId: `JOB-${Date.now()}`,
        title: formData.title,
        descriptionHash: await hashDescription(formData.description),
        budgetMin: formData.budgetMin * 1_000_000,
        budgetMax: formData.budgetMax * 1_000_000,
        deadline: formData.deadline
      });

      alert(`Job created! TX: ${txHash}`);
      
      // Wait for confirmation
      await cardanoService.waitForConfirmation(txHash);
      
      // Navigate or update UI
      navigate('/jobs');
      
    } catch (error) {
      console.error(error);
      alert('Failed to create job');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
    </form>
  );
}
```

### Accept Bid (Create Escrow) Example

```typescript
export default function JobDetailsPage() {
  const { wallet, address } = useWallet();

  const handleAcceptBid = async (bid: any) => {
    cardanoService.setWallet(wallet);

    const { txHash, escrowInfo } = await cardanoService.createEscrow({
      jobId: job.id,
      employerAddress: address,
      freelancerAddress: bid.freelancerAddress,
      arbiterAddress: ADMIN_ADDRESS, // Use dedicated arbiter
      amount: bid.amount * 1_000_000
    });

    // Save escrow info to backend
    await fetch('/api/escrows', {
      method: 'POST',
      body: JSON.stringify({ jobId: job.id, escrowInfo })
    });

    alert('Escrow created!');
  };

  return (
    <div>
      {bids.map(bid => (
        <button onClick={() => handleAcceptBid(bid)}>
          Accept Bid
        </button>
      ))}
    </div>
  );
}
```

## ⚙️ Configuration

Set environment variables in `.env`:

```env
VITE_BLOCKFROST_API_KEY=preprodXXXXXXXXXXXXXXXXXXXXXX
VITE_USDM_POLICY_ID=f96672ded25c90551d210e883099110f613e0e65012d5b88b68c51d0
VITE_USDM_ASSET_NAME=4d4f434b5f5553444d
```

## 📦 Required Files

### `/plutus.json` (Web Root)
Must contain validator scripts:

```json
{
  "validators": [
    {
      "title": "job_listing.job_listing.spend",
      "compiledCode": "..."
    },
    {
      "title": "freelance_escrow.freelance_escrow.spend",
      "compiledCode": "..."
    }
  ]
}
```

✅ **Already copied to:** `web/plutus.json`

## 🔍 Debugging

Enable console logs to see transaction details:

```typescript
// Service automatically logs:
// ✅ Transaction hashes
// ✅ Cardanoscan links
// ✅ Multi-sig status
// ✅ Confirmation status
```

## 🚨 Common Issues

### 1. "Wallet not connected"
```typescript
// Always check connection first
if (!connected || !wallet) {
  alert('Please connect wallet');
  return;
}

// Set wallet before operations
cardanoService.setWallet(wallet);
```

### 2. "Escrow UTxO not found"
```typescript
// Wait for escrow creation confirmation
const { txHash } = await cardanoService.createEscrow({...});
await cardanoService.waitForConfirmation(txHash);

// Then you can release/refund
```

### 3. "Missing freelancer wallet"
```typescript
// Release requires freelancer's wallet instance
// Get it from their wallet connection
const freelancerWallet = await getFreelancerWallet();

await cardanoService.releaseEscrow({
  ...params,
  freelancerWallet // ⚡ Required!
});
```

## 📚 Additional Resources

- [Mesh SDK Docs](https://meshjs.dev)
- [Cardano Preprod Explorer](https://preprod.cardanoscan.io)
- [Test Wallet Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet)

## 🎉 Summary

The CardanoService is production-ready and follows the exact pattern from your working `test-freelance-platform.ts`. All methods are tested and working on Cardano Preprod.

**Key Features:**
- ✅ Singleton pattern for global access
- ✅ Multi-signature escrow support
- ✅ Automatic transaction logging
- ✅ Wait for confirmation helper
- ✅ Type-safe with TypeScript
- ✅ Based on proven offchain code
