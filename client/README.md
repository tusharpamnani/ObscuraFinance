# Polkadot Hub TestNet Staking Frontend

Next.js frontend for the Polkadot Hub TestNet vault client.

## Network
- Chain: Polkadot Hub TestNet
- Chain ID: `420420417`
- RPC: `https://eth-rpc-testnet.polkadot.io/`
- Explorer: `https://blockscout-testnet.polkadot.io/`

## Integrated Contracts
- Staking Contract: `0x05e5Fd41B82A368f5E3c158200996a9E42deF869`
- Staking Token: `0x534b2f3A21130d7a60830c2Df862319e593943A3`
- Reward Token: `0x40D419F6aE98cF4726825f59718dc2cDB4F43bf5`

## Features
- Wallet connect
- Polkadot Hub TestNet network switch/add in wallet
- Read staking state (`owner`, `duration`, `finishAt`, `rewardRate`, `totalSupply`)
- User actions: approve+stake, withdraw, claim rewards
- Owner actions: set duration, fund rewards, notify reward amount

## Run
```bash
npm install
npm run dev
```

## Main Files
- `app/page.tsx`: staking dashboard UI + contract interactions
- `app/config/chains.ts`: Polkadot Hub TestNet network config
- `app/config/staking_config.ts`: contract addresses + ABI
- `app/components/Navigation.tsx`: top navigation and contract explorer link
