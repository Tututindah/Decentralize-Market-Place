# 🚀 Quick Reference - CardanoService

## Import & Setup
```typescript
import { cardanoService } from '../services/cardano.service';
import { useWallet } from '../contexts/WalletContext';

const { wallet, connected, address } = useWallet();
cardanoService.setWallet(wallet);
```

## 📋 Create Job
```typescript
const txHash = await cardanoService.createJob({
  jobId: `JOB-${Date.now()}`,
  title: "Smart Contract Development",
  descriptionHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  budgetMin: 50_000_000,  // 50 USDM
  budgetMax: 100_000_000, // 100 USDM
  deadline: Date.now() + (30 * 24 * 60 * 60 * 1000)
});
```

## 🔒 Create Escrow (Accept Bid)
```typescript
const { txHash, escrowInfo } = await cardanoService.createEscrow({
  jobId: "JOB-123",
  employerAddress: address,
  freelancerAddress: bid.freelancerAddress,
  arbiterAddress: ADMIN_ADDRESS,
  amount: 75_000_000 // 75 USDM
});

// IMPORTANT: Save escrowInfo to database!
await saveToDatabase(escrowInfo);
```

## 🔓 Release Escrow (Work Complete)
```typescript
// Need BOTH wallets to sign
cardanoService.setWallet(employerWallet);

const txHash = await cardanoService.releaseEscrow({
  escrowTxHash: escrowInfo.txHash,
  jobId: escrowInfo.jobId,
  employerAddress: escrowInfo.employerAddress,
  freelancerAddress: escrowInfo.freelancerAddress,
  arbiterAddress: escrowInfo.arbiterAddress,
  amount: escrowInfo.escrowAmount,
  freelancerWallet: freelancerWalletInstance // ⚡ Multi-sig required!
});
```

## 💰 Refund Escrow (Dispute)
```typescript
// Need employer + arbiter to sign
cardanoService.setWallet(employerWallet);

const txHash = await cardanoService.refundEscrow({
  escrowTxHash: escrowInfo.txHash,
  jobId: escrowInfo.jobId,
  employerAddress: escrowInfo.employerAddress,
  freelancerAddress: escrowInfo.freelancerAddress,
  arbiterAddress: escrowInfo.arbiterAddress,
  amount: escrowInfo.escrowAmount,
  arbiterWallet: arbiterWalletInstance // ⚡ Multi-sig required!
});
```

## ⏳ Wait for Confirmation
```typescript
const confirmed = await cardanoService.waitForConfirmation(txHash);
if (confirmed) {
  console.log('Transaction confirmed on-chain!');
}
```

## 💎 Get Balance
```typescript
const { ada, usdm } = await cardanoService.getBalance();
console.log(`${ada} ADA, ${usdm} USDM`);
```

## 💰 USDM Conversion
```typescript
// Display → Blockchain
100 USDM     = 100_000_000
50.5 USDM    = 50_500_000

// Helper functions
const toUSDM = (n) => n * 1_000_000;
const fromUSDM = (n) => n / 1_000_000;
```

## 🔐 Multi-Sig Requirements
```
Release Escrow:   Employer ✅ + Freelancer ✅
Refund Escrow:    Employer ✅ + Arbiter ✅
```

## 📁 Files
```
/plutus.json                  ← Validator scripts
/src/services/
  ├── cardano.service.ts      ← Main service
  ├── mesh-utils.ts           ← Utilities
  ├── README.md               ← Full docs
  ├── USAGE_EXAMPLES.tsx      ← Examples
  └── WALLET_INTEGRATION.tsx  ← Integration
```

## 🔗 Explorer Links
```
Preprod: https://preprod.cardanoscan.io/transaction/{txHash}
```

## ⚡ Quick Tips
1. Always check wallet connection before operations
2. Set wallet using `cardanoService.setWallet(wallet)`
3. Save escrowInfo after creating escrow (you'll need it later!)
4. Wait for confirmation before next action
5. Use USDM with 6 decimals (multiply by 1,000,000)

## 🆘 Troubleshooting
```typescript
// "Wallet not connected"
if (!connected || !wallet) {
  alert('Please connect wallet');
  return;
}

// "Escrow UTxO not found"
await cardanoService.waitForConfirmation(escrowCreationTxHash);

// "Missing freelancer wallet"
const freelancerWallet = await getFreelancerWalletInstance();
```

## 📚 Documentation
- **Full API**: `services/README.md`
- **Examples**: `services/USAGE_EXAMPLES.tsx`
- **Integration**: `services/WALLET_INTEGRATION.tsx`
