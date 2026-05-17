# VaultKeeper Platform

VaultKeeper is a multi-vault yield platform on **Midnight Network** — powered by Compact ZK-SNARK smart contracts.

It enables users to deposit into risk-segmented vaults, earn VKPR token rewards, and manage positions with privacy-preserving on-chain mechanics.

The repository contains:
- Compact smart contracts (`vault-keeper.compact`, `vkpr-token.compact`)
- CLI deployment + owner operation scripts for preprod/local
- A production-oriented Next.js frontend with separate pages for Vaults, Profile, Admin, and Analytics

## Why This Product Exists

Most yield products are either:
- Too opaque for users (unclear APY/reward mechanics), or
- Too manual for operators (hard to manage vault parameters safely), or
- Too fragmented (users/admins need different tools)

VaultKeeper addresses this by providing:
- Structured vaults by risk profile
- On-chain APY + deposit/reward accounting (zero-knowledge verified)
- Built-in owner controls for lifecycle management
- A unified frontend for users and admins

## Why Midnight?

- **ZK Privacy** — deposits and reward claims are private by default with selective disclosure
- **Compact Contracts** — ZK-compiled smart contracts instead of public EVM bytecode
- **1AM Wallet** — browser extension handles proving, fee sponsorship, and DUST — no CLI needed
- **Multi-Network** — single codebase targets undeployed (local), preprod, preview, and mainnet

## Product Goals

- Make yield participation straightforward for users
- Make vault operations controlled and auditable for admins
- Keep all critical financial actions on-chain with zero-knowledge proofs
- Expose real-time operational status (TVL, deposits, rewards, activity)

## Core Features

### User Features
- Browse all vaults with risk/APY/TVL/token details
- Deposit tNIGHT into any active vault
- Withdraw deposited tokens
- View pending rewards per vault
- Claim VKPR rewards from vaults
- See personal balances, deposits, and share

### Admin Features
- Deploy VaultKeeper + VKPR token contracts from the browser (Admin page)
- Set platform reward token
- Create vaults dynamically (name, risk, APY, token)
- Update APY bands per vault
- Toggle vault active/paused status
- Emergency withdraw for vault operations
- Mint and transfer VKPR tokens

### Product UX Features
- Dedicated pages (not a single overloaded dashboard):
  - `/vaults`
  - `/profile`
  - `/admin`
  - `/analytics`
- Wallet-aware admin gating (admin actions appear only for deployer wallet)
- Modal-driven transactional actions (deposit/withdraw/claim/admin actions)
- Success toasts + confetti feedback on successful operations
- Filtering/search/sort in vault listings (name, risk, APR, TVL)

## System Architecture

### Contracts
- `contracts/vault-keeper.compact`
  - Multi-vault storage and lifecycle management
  - Deposit/withdraw/reward claim circuits (zero-knowledge)
  - APY updates, reward token config, vault status control
- `contracts/vkpr-token.compact`
  - Mintable FungibleToken (VKPR reward token)

### Backend/Tooling
- TypeScript scripts for deployment and owner operations (in `scripts-midnight/`)
- Midnight.js SDK for provider setup, wallet integration, and contract interaction
- Docker Compose stack for local development (node + indexer + proof server)

### Frontend
- Next.js app in `client/` directory
- Shared hook-based contract integration (`useMidnightVaultKeeper`)
- Config-driven network + contract discovery with NeonDB registry + localStorage fallback
- 1AM wallet extension for browser-based proving and fee sponsorship

## Smart Contract Mechanics (High Level)

1. Owner deploys VaultKeeper + VKPR token from the browser
2. Owner sets `rewardToken` to VKPR contract address
3. Owner creates vaults with:
   - Risk level (Low/Medium/High)
   - APY range (minAPY, maxAPY in basis points)
   - Deposit token address (tNIGHT or whitelisted token)
4. User deposits tNIGHT into selected vault (ZK-shielded)
5. Yield accrues over time (amount × maxAPY × elapsed / year)
6. User claims rewards (auto-mints VKPR) and/or withdraws principal
7. Owner can adjust APY or pause vault if needed
8. Contract discovery via NeonDB registry — any wallet can find deployed contracts

## Network Configuration

| Network | ID | Fee Model |
|---|---|---|
| Local (undeployed) | `undeployed` | Manual DUST registration |
| Preprod | `preprod` | Manual DUST registration |
| Preview | `preview` | Sponsored by 1AM |
| Mainnet | `mainnet` | Sponsored by 1AM |

## Repository Structure

- `contracts/` — Compact smart contracts (`vault-keeper.compact`, `vkpr-token.compact`)
- `contracts/managed/` — Compiled contract outputs
- `scripts-midnight/` — Deployment and owner ops scripts (TypeScript)
- `client/` — Next.js app
- `client/app/` — Next.js pages (admin, vaults, profile, analytics, api)
- `client/app/lib/` — SDK helpers, provider setup, contract registry, Prisma client
- `client/app/hooks/` — `useMidnightVaultKeeper` main dApp hook
- `client/prisma/` — Prisma schema for NeonDB contract registry
- `compose.yml` — Local Docker stack (node + indexer + proof server)
- `config.ts` — Network-specific provider routing and contract addresses

## Owner Operation Scripts

### Deployment
- `npm run deploy:vk` — deploy VaultKeeper on preprod
- `npm run deploy:vk:local` — deploy VaultKeeper on local stack
- `npm run deploy:token` — deploy VKPR token on preprod
- `npm run deploy:token:local` — deploy VKPR token on local stack
- `npm run deploy:all:local` — deploy both to local stack

### Vault Management
- `npm run vaults:set-reward-token`
- `npm run vaults:create`
- `npm run vaults:update-apy`
- `npm run vaults:toggle`
- `npm run vaults:emergency-withdraw`

### Ordered Owner Setup Flow
- `npm run owner:1:deploy`
- `npm run owner:2:set-reward-token`
- `npm run owner:3:create-stable`
- `npm run owner:4:create-growth`
- `npm run owner:5:create-turbo`

### Local Stack
- `npm run local:up` — start Midnight local Docker stack
- `npm run local:down` — stop stack
- `npm run local:logs` — tail logs

## Required Environment Variables

For deployment scripts (root `.env`):
| Variable | Purpose |
|---|---|
| `MNEMONIC` | Wallet seed phrase for contract deployment |
| `DATABASE_URL` | NeonDB connection string for contract registry (optional) |

For vault setup scripts:
| Variable | Purpose |
|---|---|
| `VAULT_KEEPER_ADDRESS` | Deployed VaultKeeper contract address |
| `REWARD_TOKEN_ADDRESS` | Deployed VKPR token address |
| `VAULT_NAME` | Name for the new vault |
| `VAULT_RISK_LEVEL` | Risk level (`0`=Low, `1`=Medium, `2`=High) |
| `VAULT_MIN_APY_BPS` | Minimum APY in basis points |
| `VAULT_MAX_APY_BPS` | Maximum APY in basis points |
| `VAULT_TOKEN_ADDRESS` | Deposit token address for the vault |

## Local Development

### Prerequisites
```bash
node --version   # 22+
docker --version
```

### Midnight Local Stack
```bash
docker compose up -d --wait
```

### Frontend
```bash
cd client
npm install
npm run dev
```

Open `http://localhost:3000/admin` → connect 1AM wallet → deploy VaultKeeper + VKPR.

### Contract Compilation
```bash
npm run compact:all
```

## Security Notes

- Do not commit production mnemonics or private keys
- Rotate keys immediately if exposed
- Restrict deployer wallet usage to admin operations only
- Validate contract addresses before running owner scripts
- Understand Midnight's guaranteed vs. fallible transaction phases — partial success can occur
- Review public transcript data: even with ZK privacy, some metadata is visible on-chain

