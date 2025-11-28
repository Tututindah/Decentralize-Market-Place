# DecentGigs Workflow Documentation

Complete guide for the DecentGigs milestone-based escrow platform on Cardano.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Setup](#setup)
- [Complete Workflow](#complete-workflow)
- [Scripts Reference](#scripts-reference)
- [Data Flow](#data-flow)

## 🎯 Overview

DecentGigs is a decentralized freelance marketplace with milestone-based escrow payments on Cardano.

### Key Features

- **Offchain**: Job posting, applications, notifications
- **Onchain**: Escrow contracts, milestone payments
- **Milestone-Based**: Split payments into multiple milestones
- **Auto-Release**: Automatic payment if deadline passes
- **Multi-Signature**: Both parties must approve payments

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DecentGigs Platform                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  OFFCHAIN (JSON Database)          ONCHAIN (Cardano Blockchain) │
│  ┌──────────────────────┐          ┌──────────────────────┐    │
│  │ Job Postings         │          │ Escrow Contracts     │    │
│  │ Applications         │          │ Milestone Payments   │    │
│  │ Notifications        │          │ Fund Locks/Releases  │    │
│  └──────────────────────┘          └──────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Workflow                             │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                         │   │
│  │  1. Employer Posts Job (Offchain)                      │   │
│  │     ↓                                                   │   │
│  │  2. Freelancer Applies (Offchain)                      │   │
│  │     ↓                                                   │   │
│  │  3. Employer Accepts → Create Escrow (Onchain)         │   │
│  │     ↓                                                   │   │
│  │  4. Freelancer Completes Milestone                     │   │
│  │     ↓                                                   │   │
│  │  5. Employer Approves → Release Payment (Onchain)      │   │
│  │     ↓                                                   │   │
│  │  6. Repeat for each milestone                          │   │
│  │     ↓                                                   │   │
│  │  7. All Milestones Complete → Job Done                 │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Setup

### 1. Install Dependencies

```bash
cd decentgigs/offchain
npm install
```

### 2. Build TypeScript

```bash
npm run build
```

### 3. Build Aiken Contracts

```bash
# Build original contract
npm run build:aiken

# Build milestone contract
cd .. && aiken build
```

### 4. Mint Mock USDM (for testing)

```bash
npm run mint-usdm 10000
```

This will:
- Mint 10,000 MOCK_USDM tokens
- Save policy info to `mock_usdm_policy.json`
- Display policy ID to update in config

### 5. Update Configuration

Edit `src/config.ts` with the USDM policy ID from minting.

## 📖 Complete Workflow

### Step 1: Employer Posts a Job (Offchain)

**Script**: `post-job.ts`

```bash
npm run post-job
```

**What happens:**
- Job details saved to `data/jobs.json`
- Job becomes visible to freelancers
- Job includes milestones with deadlines

**Example Job:**
```typescript
{
  title: "Build DeFi Dashboard",
  budget: 5000 USDM,
  milestones: [
    { description: "UI/UX Design", amount: 1000, deadline: "2025-02-01" },
    { description: "Frontend Dev", amount: 1500, deadline: "2025-03-01" },
    { description: "Backend", amount: 1500, deadline: "2025-04-01" },
    { description: "Testing", amount: 1000, deadline: "2025-05-01" },
  ]
}
```

### Step 2: Freelancer Applies to Job (Offchain)

**Script**: `apply-job.ts`

```bash
npm run apply-job <jobId>
# Or apply to first job:
npm run apply-job
```

**What happens:**
- Application saved to `data/applications.json`
- Employer receives notification
- Application includes proposal and timeline

**Example Application:**
```typescript
{
  jobId: "job_123",
  proposal: "I have 5 years experience...",
  proposedTimeline: 90, // days
  portfolioLinks: ["https://github.com/..."]
}
```

### Step 3: Employer Accepts Application & Creates Escrow (Onchain)

**Script**: `accept-application.ts`

```bash
npm run accept-application <applicationId>
```

**What happens:**
1. Application status → ACCEPTED
2. **Onchain transaction created:**
   - Lock total budget (5000 USDM) in escrow
   - Include milestone data in datum
   - Both addresses (employer + freelancer) recorded
3. Job status → IN_PROGRESS
4. Escrow info saved to `data/escrows.json`
5. Freelancer notified

**Blockchain Transaction:**
```
Input:  Employer wallet (5000 USDM)
Output: Escrow contract (5000 USDM + milestone data)
Datum:  {
  employer: <pkh>,
  freelancer: <pkh>,
  milestones: [<milestone1>, <milestone2>, ...],
  total_amount: 5000000000 (atomic units)
}
```

### Step 4: Freelancer Completes Milestone

**Offchain process:**
1. Freelancer works on milestone 1
2. Freelancer delivers work
3. Employer reviews deliverable

### Step 5: Release Milestone Payment (Onchain)

**Script**: `release-milestone.ts`

```bash
npm run release-milestone <jobId> <milestoneIndex>
# Example:
npm run release-milestone job_123 0  # Release milestone 1
```

**What happens:**
1. Check milestone not already released
2. **Onchain transaction created:**
   - Unlock milestone amount from escrow
   - Send to freelancer address
   - Both employer + freelancer sign
3. Milestone marked as released
4. If last milestone → Job completed

**Blockchain Transaction:**
```
Input:  Escrow UTxO (5000 USDM)
Output: Freelancer wallet (1000 USDM for milestone 1)
        Continuing escrow (4000 USDM remaining)
Redeemer: { ReleaseMilestone: { milestone_index: 0 } }
Signatures: [employer_sig, freelancer_sig]
```

### Step 6: Auto-Release (If Deadline Passed)

If the deadline passes without employer approval:

```bash
npm run release-milestone <jobId> <milestoneIndex>
```

**What happens:**
- Only freelancer signature needed
- Payment automatically released
- Protects freelancer from non-paying employers

**Redeemer**: `{ AutoReleaseMilestone: { milestone_index: 0 } }`

### Step 7: Repeat for All Milestones

Continue steps 4-5 for each milestone until all are complete.

### Alternative: Cancel Job

If job needs to be cancelled:

```bash
npm run cancel-job
```

**What happens:**
- Both parties sign
- All remaining funds returned to employer
- Job status → CANCELLED

## 📜 Scripts Reference

### Workflow Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `post-job` | Post a new job (offchain) | `npm run post-job` |
| `apply-job` | Apply to a job (offchain) | `npm run apply-job <jobId>` |
| `accept-application` | Accept application & create escrow (onchain) | `npm run accept-application <appId>` |
| `release-milestone` | Release milestone payment (onchain) | `npm run release-milestone <jobId> <index>` |

### Utility Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `mint-usdm` | Mint mock USDM tokens | `npm run mint-usdm <amount>` |
| `check-balance` | Check wallet balances | `npm run check-balance` |
| `query-script` | Query escrow UTxOs | `npm run query-script` |
| `cancel-job` | Cancel job and return funds | `npm run cancel-job` |

### Build & Test

| Script | Description | Usage |
|--------|-------------|-------|
| `build` | Compile TypeScript | `npm run build` |
| `build:aiken` | Compile Aiken contracts | `npm run build:aiken` |
| `test:aiken` | Run Aiken tests | `npm run test:aiken` |
| `test` | Run TypeScript tests | `npm test` |

## 🔄 Data Flow

### Offchain Data (JSON Files)

Stored in `data/` directory:

**jobs.json**
```json
[
  {
    "id": "job_123",
    "title": "Build DeFi Dashboard",
    "status": "in_progress",
    "employerAddress": "addr_test1...",
    "freelancerAddress": "addr_test1...",
    "escrowTxHash": "abc123...",
    "milestones": [...]
  }
]
```

**applications.json**
```json
[
  {
    "id": "app_456",
    "jobId": "job_123",
    "status": "accepted",
    "freelancerAddress": "addr_test1...",
    "proposal": "..."
  }
]
```

**escrows.json**
```json
[
  {
    "jobId": "job_123",
    "txHash": "abc123...",
    "totalAmount": "5000000000",
    "milestones": [...],
    "status": "active"
  }
]
```

### Onchain Data (Cardano Blockchain)

**Escrow UTxO Datum:**
```
{
  employer: <VerificationKeyHash>,
  freelancer: <VerificationKeyHash>,
  job_id: <ByteArray>,
  total_amount: <Int>,
  milestones: [
    {
      amount: <Int>,
      deadline: <POSIXTime>,
      released: <Bool>
    }
  ],
  current_milestone: <Int>,
  created_at: <POSIXTime>
}
```

## 🔐 Security Features

### Multi-Signature
- Both employer and freelancer must sign release transactions
- Prevents unilateral fund movement

### Auto-Release Protection
- If deadline passes, freelancer can claim without employer signature
- Prevents employer from withholding payment

### Escrow Lock
- Funds locked in smart contract
- Cannot be accessed except through contract logic

### Milestone Validation
- Each milestone can only be released once
- Amount must match locked amount
- Proper signatures required

## 🧪 Testing Workflow

### 1. Setup Test Environment

```bash
# Mint mock USDM
npm run mint-usdm 50000

# Check balances
npm run check-balance
```

### 2. Run Complete Workflow

```bash
# 1. Employer posts job
npm run post-job

# 2. Freelancer applies (note the job ID from previous output)
npm run apply-job job_1234567890_abcd1234

# 3. Employer accepts (note the application ID)
npm run accept-application app_1234567890_efgh5678

# 4. Release first milestone (note the job ID)
npm run release-milestone job_1234567890_abcd1234 0

# 5. Release second milestone
npm run release-milestone job_1234567890_abcd1234 1

# And so on...
```

### 3. Verify on Blockchain

Check transactions on Cardano explorer:
```
https://preprod.cardanoscan.io/transaction/<txHash>
```

## 📊 Example Complete Flow

```bash
# Setup
npm install
npm run build
npm run mint-usdm 10000
npm run check-balance

# Workflow
npm run post-job
# Output: Job ID: job_1701234567890_a1b2c3d4

npm run apply-job job_1701234567890_a1b2c3d4
# Output: Application ID: app_1701234567891_e5f6g7h8

npm run accept-application app_1701234567891_e5f6g7h8
# Output: Escrow Created! Tx: abc123...

# Wait for work completion...

npm run release-milestone job_1701234567890_a1b2c3d4 0
# Output: Milestone 1 released! Tx: def456...

npm run release-milestone job_1701234567890_a1b2c3d4 1
# Output: Milestone 2 released! Tx: ghi789...

# Continue for all milestones...
# Job automatically marked as complete after last milestone
```

## 🎉 Success!

You now have a fully functional milestone-based escrow system on Cardano!

For questions or issues, check:
- [Aiken Documentation](https://aiken-lang.org/)
- [Lucid Evolution](https://github.com/Anastasia-Labs/lucid-evolution)
- [Cardano Docs](https://docs.cardano.org/)
