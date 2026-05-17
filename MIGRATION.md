# VaultKeeper: Polkadot Hub → Midnight Network Migration

VaultKeeper was originally built on **Polkadot Hub TestNet** (EVM/Solidity) and has been fully migrated to **Midnight Network** (Compact/ZK-SNARKs). All Polkadot/EVM code has been removed. This document records the migration for reference.

## Architecture Comparison

| Layer | Before (Polkadot Hub) | After (Midnight Network) |
|---|---|---|
| Contract language | Solidity `^0.8.28` | Compact `>= 0.22` |
| Execution model | Public EVM bytecode | ZK-SNARK circuit proofs |
| Privacy | Fully transparent | Selective disclosure via `disclose()` |
| Token standard | ERC-20 (`SafeERC20`) | Contract tokens (`Map<Bytes<32>, Uint<128>>`) |
| Wallet | MetaMask (EIP-1193) | 1AM browser extension |
| Fee token | PAS (native, required) | DUST (sponsored on preview/mainnet) |
| Dev tooling | Hardhat, ethers, wagmi | Compact compiler, Midnight.js SDK |
| State reads | RPC `eth_call` | Indexer GraphQL API v4 |
| Account auth | `msg.sender` (tx origin) | `witness caller()` (ZK proof of key) |
| Time source | `block.timestamp` | Kernel block time (circuit argument) |

## Contract Migration

### Solidity → Compact Keyword Mapping

| Solidity | Compact | Notes |
|---|---|---|
| `msg.sender` | `witness caller(): Bytes<32>` | Private ZK input, not tx metadata |
| `block.timestamp` | `currentTime: Uint<64>` | Circuit argument from Kernel |
| `address` | `Bytes<32>` | Public key hashes, not 20-byte |
| `mapping(uint => T)` | `Map<Uint<64>, T>` | Flat maps per field |
| `require(x, "msg")` | `assert(x, "msg")` | ZK circuit constraint |
| `event` | Ledger state (Indexer) | No event system; state IS the event |
| `SafeERC20` | `Map<Bytes<32>, Uint<128>>` | Internal balance book |
| `Ownable` | `ownerPubKey` + `witness ownerKey()` | Hash-based key auth |
| `string` | `Opaque<"string">` | Variable-length opaque data |
| `uint256` | `Uint<64>` / `Uint<128>` | Fixed-width unsigned ints |
| `enum` | `export enum` | Same concept |
| `constructor()` | `constructor()` | Same, runs on deploy |

### Files Changed

| Before | After |
|---|---|
| `contracts/VaultKeeper.sol` | `contracts/vault-keeper.compact` |
| `contracts/USDT.sol` | `contracts/vkpr-token.compact` |
| `scripts/` (Hardhat) | `scripts-midnight/` (Midnight.js) |
| `hardhat.config.ts` | `compose.yml` + `scripts-midnight/config.ts` |
| `test/` (Hardhat) | Removed (Compact tests via vitest) |
| `deployments/` (JSON records) | Removed (on-chain via Indexer) |
| `ignition/` (Hardhat Ignition) | Removed |

## Backend Migration

### Wallet

| Before | After |
|---|---|
| `ethers.Wallet` (private key) | `WalletFacade` (HD seed → Zswap + NightExternal + Dust) |
| `new ethers.Wallet(pk)` | `HDWallet.fromSeed()` → `deriveKeysAt(0)` |
| `signer.sendTransaction(tx)` | `wallet.submitTransaction(finalized)` |

### Deploy

| Before | After |
|---|---|
| `hardhat run deploy.ts` | `tsx deploy-vault-keeper.ts` |
| `ethers.ContractFactory` | `CompiledContract.make()` + `deployContract()` |
| `await contract.waitForDeployment()` | `await deployContract(providers, { compiledContract, ... })` |

### Contract Interaction

| Before | After |
|---|---|
| `contract.deposit(id, amount)` | `deployed.callTx.deposit(id, amount)` |
| `contract.vaults(id)` | Indexer GraphQL `queryContractState()` |
| `await tx.wait()` (receipt) | `result.public.txId` + `result.public.blockHeight` |

## Frontend Migration

### Wallet Connection

**Before** (MetaMask):
```typescript
const accounts = await ethereum.request({ method: "eth_requestAccounts" });
const provider = new ethers.BrowserProvider(ethereum);
const signer = await provider.getSigner();
```

**After** (1AM):
```typescript
const accounts = await window.midnight["1am"].enable();
const config = await window.midnight["1am"].getConfiguration();
const coinPublicKey = await window.midnight["1am"].getCoinPublicKey();
```

### State Reads

**Before**: `eth_call` via ethers contract instance
**After**: Indexer GraphQL query
```typescript
const res = await fetch(indexerUrl, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    query: `query($address: HexEncoded!) {
      contractAction(address: $address) { state }
    }`,
    variables: { address: contractAddress },
  }),
});
```

### Contract Calls

**Before**: Direct ethers function call with tx signing
**After**: Midnight.js `callTx` with ZK proof generation
```typescript
const result = await deployed.callTx.deposit(vaultId, amount);
```

### Files Changed

| Before | After |
|---|---|
| `config/vault_config.ts` (ABI) | `config/midnight-contracts.ts` (addresses) |
| `config/chains.ts` (Polkadot) | `config/midnight-networks.ts` (4 networks) |
| `hooks/useVaultKeeper.ts` (ethers) | `hooks/useMidnightVaultKeeper.ts` (1AM) |
| `vaults/` (EVM page) | `vaults/` (Midnight page) |
| `admin/` (EVM page) | `admin/` (Midnight page) |
| `profile/`, `analytics/`, `leaderboard/` | Removed (not ported) |
| `api/faucet/usdt/` | Removed (no EVM faucet needed) |

## Infrastructure Migration

| Before | After |
|---|---|
| `hardhat.config.ts` network config | `compose.yml` (Docker stack) |
| RPC: `eth-rpc-testnet.polkadot.io` | Indexer: `indexer.*.midnight.network` |
| Explorer: `blockscout-testnet.polkadot.io` | Explorer: `explorer.*.midnight.network` |
| Single testnet | 4 networks (undeployed, preprod, preview, mainnet) |
| No local node | Full local stack via Docker |

## Token Model

**Before** (Polkadot Hub):
- USDT: ERC-20 mock token, `SafeERC20` transfers
- VaultKeeper holds token balance, transfers on deposit/withdraw

**After** (Midnight):
- VKPR: Contract token, `Map<Bytes<32>, Uint<128>>` balance book
- VaultKeeper manages internal balance, reward calculation via circuits
- No external token contract needed for vault deposits

## DUST & Fees

| Network | DUST Mode | How to get DUST |
|---|---|---|
| `undeployed` (local) | Manual | Genesis wallet, register NIGHT UTXOs |
| `preview` | Sponsored (1AM) | None needed |
| `preprod` | Manual | Faucet NIGHT → register for DUST |
| `mainnet` | Sponsored (1AM) | None needed |

## Key Technical Differences

1. **ZK Circuits, not Functions** — Compact circuit calls require proof generation. The client prepares a proof before submission.
2. **Private State** — User positions managed via private state providers (LevelDB or in-memory), not on-chain.
3. **No `block.timestamp`** — Time supplied as a circuit argument from the node's Kernel.
4. **No Events** — State changes read by polling the Indexer GraphQL endpoint.
5. **No `require()`** — Use `assert()`; if condition fails, the proof is invalid and the tx is rejected.
6. **Account Model** — No EOA/contract distinction. Users authenticate via ZK proof of secret key possession.
