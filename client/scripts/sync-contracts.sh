#!/usr/bin/env bash
set -euo pipefail

ROOT="$(dirname "$0")/../.."
CLIENT="$(dirname "$0")/.."

# Copy compiled contract JS + type declarations
mkdir -p "$CLIENT/app/lib/contracts/vault-keeper"
mkdir -p "$CLIENT/app/lib/contracts/vkpr-token"

cp "$ROOT/contracts/managed/vault-keeper/contract/index.js" "$CLIENT/app/lib/contracts/vault-keeper/index.js"
cp "$ROOT/contracts/managed/vault-keeper/contract/index.d.ts" "$CLIENT/app/lib/contracts/vault-keeper/index.d.ts"
cp "$ROOT/contracts/managed/vault-keeper/contract/index.js.map" "$CLIENT/app/lib/contracts/vault-keeper/index.js.map" 2>/dev/null || true

cp "$ROOT/contracts/managed/vkpr-token/contract/index.js" "$CLIENT/app/lib/contracts/vkpr-token/index.js"
cp "$ROOT/contracts/managed/vkpr-token/contract/index.d.ts" "$CLIENT/app/lib/contracts/vkpr-token/index.d.ts"
cp "$ROOT/contracts/managed/vkpr-token/contract/index.js.map" "$CLIENT/app/lib/contracts/vkpr-token/index.js.map" 2>/dev/null || true

# Sync ZK assets to public/
mkdir -p "$CLIENT/public/contract/vault-keeper"
mkdir -p "$CLIENT/public/contract/vkpr-token"

cp -r "$ROOT/contracts/managed/vault-keeper/keys" "$CLIENT/public/contract/vault-keeper/keys"
cp -r "$ROOT/contracts/managed/vault-keeper/zkir" "$CLIENT/public/contract/vault-keeper/zkir"
cp "$ROOT/contracts/managed/vault-keeper/compiler/contract-info.json" "$CLIENT/public/contract/vault-keeper/"

cp -r "$ROOT/contracts/managed/vkpr-token/keys" "$CLIENT/public/contract/vkpr-token/keys"
cp -r "$ROOT/contracts/managed/vkpr-token/zkir" "$CLIENT/public/contract/vkpr-token/zkir"
cp "$ROOT/contracts/managed/vkpr-token/compiler/contract-info.json" "$CLIENT/public/contract/vkpr-token/"

echo "✅ Contracts synced to client/"
