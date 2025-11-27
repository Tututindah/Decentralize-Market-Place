# Decentralize Market Place  
**Fully On-Chain Freelance & Jobs Marketplace on Cardano**  
Catalyst Fund 15 Proposal – Real World Adoption Challenge  

> 100% on-chain freelance platform where jobs, bids, reputation, identity, escrow, and payments live forever on Cardano.powered by Aiken + Atala PRISM.

[![Cardano](https://img.shields.io/badge/Powered_by-Cardano-0033AD?style=flat&logo=cardano)](https://cardano.org)
[![Atala PRISM](https://img.shields.io/badge/Atala_PRISM-DID-blue)](https://atalaprism.io)
[![Aiken](https://img.shields.io/badge/Smart_Contracts-Aiken-FF6D00)](https://aiken-lang.org)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_14-000000?logo=next.js)](https://nextjs.org)

## Problems We Solve
- 90%+ of the world’s 1.57 billion freelancers have never touched blockchain  
- Centralized platforms take 10–20% fees and own your data  
- Fake reviews, identity fraud, and chargeback scams are rampant  
- Cross-border payments cost 6–12% and take days  
- Reputation cannot be ported between platforms  

## Solution – 100% On-Chain Freelance Marketplace
Everything that matters lives on Cardano. No databases, no admins, no custody.

### Core Features (All On-Chain)
| Feature                      | Description                                                                 | On-Chain |
|------------------------------|-----------------------------------------------------------------------------|----------|
| Job Posting & Bidding        | Post jobs, receive bids with proposals                                      | Yes      |
| Atala PRISM DID + Selective KYC | Verifiable Credentials for identity & skills                           | Yes      |
| Permanent Reputation System  | Score = (jobs completed × avg rating × timeliness) – immutable         | Yes      |
| Proof-of-Work Verification   | Deliverable hash submitted → employer verifies → auto-release          | Yes      |
| Milestone Escrow             | Funds locked in Aiken validator, released only on milestone approval   | Yes      |
| Dispute Resolution           | Community jury staking or appointed arbitrators                        | Yes      |
| Private Reviews              | Only winning bidder can review (zero-knowledge proof)                  | Yes      |


**Full Tech Stack**
- Blockchain: Cardano Mainnet  
- Smart Contracts: Aiken (functional, safe, low-cost)  
- Frontend: Next.js 14, TypeScript, TailwindCSS, shadcn/ui  
- Wallet: Mesh.js + Lucid  
- Identity: Atala PRISM Pioneer Program  
- Storage: IPFS via web3.storage  
- Indexing: Blockfrost + custom Carp queries  
- Analytics: On-chain Dune-style dashboard (Next.js + Recharts)

## Smart Contracts (Aiken)
```
/contracts/
  escrow.ak
  milestone.ak
  reputation.ak
  dispute.ak
  proof_of_work.ak
```

## Public On-Chain Metrics Dashboard

| Metric                          | Source                  | Frequency  |
|---------------------------------|-------------------------|------------|
| Total Jobs Posted               | Job script datum        | Real-time  |
| Total Escrow Volume             | Escrow validator        | Real-time  |
| Verified DIDs                   | PRISM credential count  | Daily      |
| Average Completion Time         | Timestamp analysis      | Real-time  |
| Top Freelancers by Reputation   | Reputation validator    | Real-time  |
| Dispute Rate                    | Dispute validator           | Real-time  |

## Funding Request – Catalyst Fund 15
**125,000 ADA** (~$65,000 at time of writing)

## Why This Project Must Be Funded
- Largest real-world use case still missing on Cardano  
- 100% on-chain (not hybrid) – true decentralization  
- First production-grade use of Aiken at scale  
- Atala PRISM integration – flagship showcase for decentralized identity  
- Mainnet launch within 12 months of funding  

## Links
- **GitHub Repository:** [DeCentGigs](https://github.com/Surabaya-Blockchain-Alliance/Decentralize-Market-Place)  
- **MockUp and WireFrame:** [View Here](https://decentralize-market-place.vercel.app)
- **Decentral Peers to Peers Chat:** [Peers To Peers Decentralized Chat](https://github.com/Surabaya-Blockchain-Alliance/p2p-Chat)
- **Test Contracts on Aiken Playground:** [Aiken Playgroun](https://play.aiken-lang.org?code=G8oMQByHsXtkUo5sRJk-dvk11a-nqd5l5JArj6XLuWZWZq2PAnhgZecGUWDpW05Y96396GJZQySECLOzN1_cEuY7d_e1fed1QieLR4iBTk2yiVvAi4H31hCxFe2efaNPDHIN-6lSbNNJDodSu4I5Fc97CZPrGzXvXpRmsViN5gCb0pnxo1_5fDed4sPnj3pobojbMzAIlKCrAvkwtZk6UEqgfigPlQhMrnNeFEv0YNy2f3Cxe1mU5QzYrSFXUGzfSMLLcKYote9L4Hn-SyjfkfQdrgoeqTEwrtHbRqLf_7X3W4c9x8TStyni-vU-pmoxC2xw-5b8Fkmtc17oXYYjLh-sQ2mcXXtzFp5fHX06x3gPD_iQz0cln2cL8C_94jq5SL4ZffX_33ff0TA-8JZT8LZYa7-EEns8Y64rSVpADv1la4b5WrdzvleMLeNlBzw2Ho87ng5z7IIaBtdUO4-AK5iSTSxsl1fO-hRJiI7TusfrXhvlxIqBNKK6s5lx4U0IrdzwtJk3HijhRgTIJTCCOexRk9iLkaAVRLXGBPpYsVgeN2SANoBgALJ28YOPi8ymVgl2E5-9vAdZRuROw4JwUykGxqxdDyIenaP15s7rYM8Qkak4Jq_igWKfYN300H4FVFFE4tSTg2VfkQ9QmYizZhu54qg4ahWQdU4is8cEsIQ8V88Rd2nNOTNsjjvrqUwlXyG0tn1nlICgS7MRCWof3fpJ8uKABIZIJNpkYeRM2GmmxeOdyTjtI3sIlvBTcwhBPn70JnE6jHsAbzfktM4ujpGnbJrIOy4NtdQXtO4obXiR-IiZLpk_nPFWy2nivJpANxLMf0XRMdGg2zREQ3nOsQ931espDMkRAnPaoygXfeZDhH2A_0IdQb9P2xiOnfMXkquysHcfAH_c8pa9VK5Kuk-2Mwqzq9Tfof39Cq_Bts2mZsf6n_B2bXJ1rBgH9XG3poToGxFU33KsmZGO-GLsUreZHGRxPc2CHFNHDjlN9ke7qbAraGgKEGNJuESEz9F9xkVAb51P_D1TJLWehl7gH3lLp4mKvDtrHFFedZmx1QjIk25pxE6gDWGjEZf5jQYPG0WahQWOduAmGru-NQefbJH5hebajIzGIZAHaVhOpu0z4lW8KzEEEMVNI0E-dsywKqcJJ5tJcqrwn_zbN4kTatcQGrY9-TNB7DgrBbx7TTGnzuQrWNe0A6B0h4uuQ8OgTqj1zD3o-XPDYU1vLXOfIlc1petZpbQG_hPeSe9_npeiHkyuEfLXrLEhGGvI_8xyy50Uz2B8jY4Kx7YD)
- **Catalyst Proposal Link:** [Proposals](https://app.projectcatalyst.io/proposal/019a95e2-c7cc-745c-9ed5-f410543e643e)

