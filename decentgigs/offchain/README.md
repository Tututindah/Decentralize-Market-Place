# DecentGigs Smart Contract - Offchain Code

Comprehensive offchain implementation for the DecentGigs escrow smart contract on Cardano blockchain.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Testing](#testing)
- [Scripts](#scripts)
- [API Reference](#api-reference)

## 🎯 Overview

DecentGigs is a decentralized escrow system for freelance jobs on Cardano. It uses PlutusV3 smart contracts to lock funds until both employer and freelancer agree to release or cancel the job.

### Key Features

- **Escrow System**: Lock USDM stablecoin for job payments
- **Multi-Signature**: Both parties must sign to release or cancel
- **On-Chain Logic**: Smart contract enforces business rules
- **Preprod Testnet**: Fully tested on Cardano preprod network

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DecentGigs Architecture                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                │
│  │   Employer   │         │  Freelancer  │                │
│  └──────┬───────┘         └──────┬───────┘                │
│         │                        │                         │
│         │   1. Create Job        │                         │
│         ├───────────────────────►│                         │
│         │                        │                         │
│         │   2. Lock Funds        │                         │
│         ├──────────┐             │                         │
│         │          ▼             │                         │
│         │    ┌──────────────┐   │                         │
│         │    │   Plutus V3  │   │                         │
│         │    │   Contract   │   │                         │
│         │    │   (Escrow)   │   │                         │
│         │    └──────────────┘   │                         │
│         │          │             │                         │
│         │   3a. Release Payment  │                         │
│         ├──────────┴─────────────┤                         │
│         │   (Both Sign)          │                         │
│         │          │             │                         │
│         │          ▼             │                         │
│         │    Freelancer Gets $   │                         │
│         │                        │                         │
│         │   3b. Cancel Job       │                         │
│         ├──────────┬─────────────┤                         │
│         │   (Both Sign)          │                         │
│         │          │             │                         │
│         ▼          ▼             │                         │
│    Employer Gets $ Back          │                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Installation

### Prerequisites

- Node.js v18 or higher
- npm or yarn
- Aiken v1.1.17+
- Blockfrost API key ([Get here](https://blockfrost.io))

### Install Dependencies

```bash
cd decentgigs/offchain
npm install
```

### Build TypeScript

```bash
npm run build
```

### Build Aiken Contract

```bash
npm run build:aiken
```

## ⚙️ Configuration

Edit `src/config.ts` with your settings:

```typescript
// Blockfrost API Configuration
export const BLOCKFROST_API_KEY = "preprodYOUR_KEY_HERE";

// Wallet Mnemonics (24 words each)
export const EMPLOYER_MNEMONIC = "your 24 word seed phrase...";
export const FREELANCER_MNEMONIC = "your 24 word seed phrase...";

// USDM Token Configuration
export const USDM_POLICY_ID = "c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad";
export const USDM_ASSET_NAME = "0014df105553444d";

// Lock Amount (5 USDM = 5,000,000 units)
export const LOCK_AMOUNT = 5_000_000n;
```

### Get Test Funds

1. **Testnet ADA**: https://docs.cardano.org/cardano-testnet/tools/faucet/
2. **USDM Tokens**: Contact USDM on preprod testnet

## 🚀 Usage

### Quick Start

1. **Check Balances**
   ```bash
   npm run check-balance
   ```

2. **Deploy Contract (Create Job)**
   ```bash
   npm run deploy
   ```

3. **List Active Jobs**
   ```bash
   npm run list-jobs
   ```

4. **Release Payment**
   ```bash
   npm run release-payment
   ```

5. **Cancel Job**
   ```bash
   npm run cancel-job
   ```

### Advanced Usage

#### Query Script UTxOs

```bash
npm run query-script
```

#### Release Specific Job

```bash
node dist/scripts/release-payment.js <txHash> <outputIndex>
```

#### Cancel Specific Job

```bash
node dist/scripts/cancel-job.js <txHash> <outputIndex>
```

## 🧪 Testing

### Run All Tests

```bash
npm run test:all
```

This runs both Aiken and TypeScript tests.

### Aiken Contract Tests

```bash
npm run test:aiken
```

Output:
```
✓ must_be_signed_by_finds_signer
✓ must_be_signed_by_rejects_missing_signer

Summary: 2 passed, 0 failed
```

### TypeScript Unit Tests

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

## 📜 Scripts

### Utility Scripts

| Script | Description |
|--------|-------------|
| `check-balance.ts` | Check wallet balances (ADA & USDM) |
| `list-jobs.ts` | List all active escrow jobs |
| `query-script.ts` | Query all UTxOs at script address |
| `release-payment.ts` | Release payment to freelancer |
| `cancel-job.ts` | Cancel job and return funds to employer |

### Main Script

- `index.ts`: Full deployment demo with both release and cancel scenarios

## 📚 API Reference

### Core Functions

#### `readValidator()`

Reads and parses the Plutus validator from `plutus.json`.

```typescript
const validator = readValidator();
// Returns: SpendingValidator
```

#### `createJobDatum(employerPkh, freelancerPkh, jobId?)`

Creates a job datum for the escrow.

```typescript
const datum = createJobDatum(
  "aabbccdd...",  // Employer PKH
  "11223344...",  // Freelancer PKH
  "job_001"       // Optional job ID
);
```

#### `redeemerRelease`

Redeemer for releasing payment to freelancer.

```typescript
const redeemer = redeemerRelease;
```

#### `redeemerCancel`

Redeemer for cancelling job and returning funds.

```typescript
const redeemer = redeemerCancel;
```

### Data Types

#### JobDatum

```typescript
type JobDatum = {
  employer: string;      // Verification key hash
  freelancer: string;    // Verification key hash
  job_id: ByteArray;    // Job identifier
}
```

#### JobAction

```typescript
type JobAction =
  | { ReleasePayment: [] }
  | { CancelJob: [] }
```

## 🔐 Security

### Multi-Signature Requirements

- **Release Payment**: Requires signatures from both employer and freelancer
- **Cancel Job**: Requires signatures from both employer and freelancer

### Smart Contract Validation

The Plutus contract validates:

1. ✅ Both parties have signed the transaction
2. ✅ Correct amount is sent to the recipient
3. ✅ Funds match the locked amount

### Best Practices

- Never share your seed phrases
- Use hardware wallets for mainnet
- Test thoroughly on preprod before mainnet deployment
- Always verify transaction details before signing

## 🐛 Troubleshooting

### Common Issues

#### "Insufficient funds"

- Get testnet ADA from the faucet
- Ensure you have at least 10 ADA for transactions

#### "UTxO not found"

- Make sure you've created a job first
- Check that you're using the correct txHash and outputIndex

#### "Invalid signature"

- Verify both wallet mnemonics are correct
- Ensure both parties sign the transaction

#### "Blockfrost API error"

- Check your API key is valid
- Verify you're using the preprod API endpoint

## 📊 Testing Coverage

Current test coverage:

- **Aiken Tests**: 2/2 passing (100%)
- **TypeScript Tests**: Unit, Integration, E2E, Performance
- **Coverage**: Utils, Scripts, Integration flows

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

Apache-2.0

## 🔗 Links

- [Cardano Docs](https://docs.cardano.org/)
- [Aiken Language](https://aiken-lang.org/)
- [Lucid Evolution](https://github.com/Anastasia-Labs/lucid-evolution)
- [Blockfrost API](https://blockfrost.io/)

## 📞 Support

For issues and questions:

- Open an issue on GitHub
- Join our Discord community
- Check the documentation

---

Built with ❤️ on Cardano
