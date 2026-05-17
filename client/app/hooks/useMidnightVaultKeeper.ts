"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToastContext } from "../contexts/ToastContext";
import { DEFAULT_MIDNIGHT_NETWORK, MIDNIGHT_NETWORKS, type MidnightNetworkId } from "../config/midnight-networks";
import { MIDNIGHT_CONTRACTS, ZERO_BYTES32 } from "../config/midnight-contracts";
import {
  createConnectedSession,
  createZkConfigProvider,
  waitForContractDeployment,
  toHex,
  type ConnectedSession,
} from "../lib/midnight";
import { ledger as vaultKeeperLedger, createCompiledVaultKeeperContract } from "../lib/contracts/vault-keeper";
import { ledger as vkprTokenLedger, createCompiledVkprTokenContract } from "../lib/contracts/vkpr-token";
import { coinPublicKeyToBytes } from "../lib/hex";

const ZERO = BigInt(0);
const YEAR_SECONDS = 31536000n;
const BPS_DENOM = 10000n;

export type VaultData = {
  id: number;
  name: string;
  riskLevel: number;
  minAPY: bigint;
  maxAPY: bigint;
  totalValueLocked: bigint;
  tokenAddress: string;
  active: boolean;
  userDeposit: bigint;
  userPendingRewards: bigint;
  userRewardsClaimed: bigint;
};

export type ContractStats = {
  ownerPubKey: string;
  rewardToken: string;
  vaultCount: bigint;
};

const EMPTY_STATS: ContractStats = {
  ownerPubKey: "",
  rewardToken: ZERO_BYTES32,
  vaultCount: ZERO,
};

export function shortAddress(value: string) {
  if (!value || value === ZERO_BYTES32) return "-";
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

export function formatToken(value: bigint, decimals: number, digits = 4) {
  try {
    const divisor = BigInt(10) ** BigInt(decimals);
    const intPart = value / divisor;
    const remainder = value % divisor;
    const rStr = remainder.toString().padStart(decimals, "0").slice(0, digits);
    return `${intPart.toLocaleString()}.${rStr}`;
  } catch { return "0"; }
}

export function formatPercentFromBps(bps: bigint, digits = 2) {
  return `${(Number(bps) / 100).toFixed(digits)}%`;
}

export function riskName(risk: number) {
  if (risk === 0) return "Low";
  if (risk === 1) return "Medium";
  if (risk === 2) return "High";
  return `Unknown (${risk})`;
}

type OneAmInitialApi = {
  connect: (networkId: string) => Promise<any>;
  name: string;
  apiVersion: string;
};

function detectWallet(): Promise<OneAmInitialApi | null> {
  return new Promise((resolve) => {
    const wallet = (window as any).midnight?.["1am"];
    if (wallet?.connect) { resolve(wallet); return; }
    let attempts = 0;
    const interval = setInterval(() => {
      const w = (window as any).midnight?.["1am"];
      if (w?.connect) { clearInterval(interval); resolve(w); }
      else if (++attempts > 50) { clearInterval(interval); resolve(null); }
    }, 100);
  });
}

async function getCurrentTime(): Promise<bigint> {
  return BigInt(Math.floor(Date.now() / 1000));
}

export function calcPendingReward(
  amount: bigint,
  maxAPYBps: bigint,
  lastTimestamp: bigint,
  currentTimestamp: bigint,
): bigint {
  if (amount <= 0n || maxAPYBps <= 0n || currentTimestamp <= lastTimestamp) return ZERO;
  const elapsed = currentTimestamp - lastTimestamp;
  return (amount * maxAPYBps * elapsed) / (YEAR_SECONDS * BPS_DENOM);
}

function flattenLedgerState(ledger: any, coinPublicKey: string, currentTimestamp: bigint) {
  const ownerHex = toHex(ledger.ownerPubKey);
  const rewardToken = ledger.rewardToken?.is_some
    ? toHex(ledger.rewardToken.value)
    : ZERO_BYTES32;

  const vaultCount = Number(ledger.vaultCount);
  const vaults: VaultData[] = [];
  const userKey = coinPublicKeyToBytes(coinPublicKey);

  const userVaultId = ledger.userVaults.member(userKey) ? ledger.userVaults.lookup(userKey) : null;
  const userDeposit = ledger.userAmounts.member(userKey) ? ledger.userAmounts.lookup(userKey) : ZERO;
  const userTimestamp = ledger.userTimestamps.member(userKey) ? ledger.userTimestamps.lookup(userKey) : ZERO;
  const userRewardsClaimed = ledger.userRewardsClaimed.member(userKey) ? ledger.userRewardsClaimed.lookup(userKey) : ZERO;

  if (typeof window !== "undefined") {
    const pkPrefix = coinPublicKey.slice(0, 16);
    const ownerPrefix = ownerHex.slice(0, 16);
    const ownerMatch = ownerPrefix === pkPrefix;
    console.log(`[flatten] pk=${pkPrefix}... owner=${ownerPrefix}... isOwner=${ownerMatch} vaultCount=${vaultCount} member=${ledger.userVaults.member(userKey)} userVaultId=${userVaultId} userDeposit=${userDeposit}`);
  }

  for (let i = 0; i < vaultCount; i++) {
    const id = BigInt(i);
    const name = ledger.vaultNames.member(id) ? ledger.vaultNames.lookup(id) : `Vault ${i}`;
    const riskLevel = Number(ledger.vaultRisks.member(id) ? ledger.vaultRisks.lookup(id) : ZERO);
    const minAPY = ledger.vaultMinAPYs.member(id) ? ledger.vaultMinAPYs.lookup(id) : ZERO;
    const maxAPY = ledger.vaultMaxAPYs.member(id) ? ledger.vaultMaxAPYs.lookup(id) : ZERO;
    const tvl = ledger.vaultTVLs.member(id) ? ledger.vaultTVLs.lookup(id) : ZERO;
    const tokenAddr = ledger.vaultTokens.member(id) ? toHex(ledger.vaultTokens.lookup(id)) : ZERO_BYTES32;
    const active = ledger.vaultActives.member(id) ? ledger.vaultActives.lookup(id) : false;

    const isUserVault = userVaultId !== null && id === userVaultId;
    const depositForVault = isUserVault ? userDeposit : ZERO;
    const rewardsClaimed = isUserVault ? userRewardsClaimed : ZERO;
    const pendingReward = isUserVault
      ? calcPendingReward(depositForVault, maxAPY, userTimestamp, currentTimestamp)
      : ZERO;

    vaults.push({
      id: i, name, riskLevel, minAPY, maxAPY,
      totalValueLocked: tvl, tokenAddress: tokenAddr, active,
      userDeposit: depositForVault,
      userPendingRewards: pendingReward,
      userRewardsClaimed: rewardsClaimed,
    });
  }

  return { ownerPubKey: ownerHex, rewardToken, vaultCount: BigInt(vaultCount), vaults, userDeposit, userPendingRewards: vaults.reduce((s, v) => s + v.userPendingRewards, ZERO) };
}

async function readContractLedger(indexerUrl: string, contractAddress: string, ledgerFn: (data: any) => any) {
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
  if (!res.ok) throw new Error(`Indexer HTTP ${res.status}`);
  const payload = await res.json();
  if (payload.errors?.length) throw new Error(payload.errors.map((e: any) => e.message).join("; "));
  const stateHex = payload?.data?.contractAction?.state;
  if (!stateHex) return null;
  const { ContractState } = await import("@midnight-ntwrk/compact-runtime");
  const cs = ContractState.deserialize(
    new Uint8Array((stateHex.startsWith("0x") ? stateHex.slice(2) : stateHex).match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16))),
  );
  return { ledger: ledgerFn(cs.data), raw: cs };
}

export function useMidnightVaultKeeper() {
  const { showError, showInfo, showSuccess } = useToastContext();

  const [networkId, setNetworkId] = useState<MidnightNetworkId>(DEFAULT_MIDNIGHT_NETWORK);
  const [coinPublicKey, setCoinPublicKey] = useState("");
  const [coinPublicKeyBech32, setCoinPublicKeyBech32] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<ContractStats>(EMPTY_STATS);
  const [vaults, setVaults] = useState<VaultData[]>([]);
  const [selectedVaultId, setSelectedVaultId] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unshieldedAddress, setUnshieldedAddress] = useState("");
  const sessionRef = useRef<ConnectedSession | null>(null);
  const indexerUrlRef = useRef("");

  const loadAddress = (key: string, fallback: string) => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(key) || fallback || "";
  };

  const [vaultKeeperAddress, setVaultKeeperAddress] = useState(
    loadAddress("vk_vaultKeeperAddress", MIDNIGHT_CONTRACTS[networkId].vaultKeeper)
  );
  const [vkprTokenAddress, setVkprTokenAddress] = useState(
    loadAddress("vk_vkprTokenAddress", MIDNIGHT_CONTRACTS[networkId].vkprToken)
  );

  const saveAddress = (key: string, value: string) => {
    if (typeof window !== "undefined") localStorage.setItem(key, value);
  };

  useEffect(() => {
    setVaultKeeperAddress(prev => prev || loadAddress("vk_vaultKeeperAddress", MIDNIGHT_CONTRACTS[networkId].vaultKeeper));
    setVkprTokenAddress(prev => prev || loadAddress("vk_vkprTokenAddress", MIDNIGHT_CONTRACTS[networkId].vkprToken));
  }, [networkId]);

  const normalizeKey = (k: string) => k.replace(/^0x/i, "").toLowerCase();
  const isAdmin = !!coinPublicKey && !!stats.ownerPubKey && normalizeKey(coinPublicKey) === normalizeKey(stats.ownerPubKey);

  const selectedVault = useMemo(
    () => vaults.find((v) => v.id === selectedVaultId) ?? null,
    [selectedVaultId, vaults],
  );

  const connectWallet = useCallback(async () => {
    const walletApi = await detectWallet();
    if (!walletApi) {
      showError("1AM wallet extension not found. Install from 1am.xyz.");
      return;
    }
    try {
      const api = await walletApi.connect("preview");
      const config = await api.getConfiguration();
      setNetworkId(config.networkId);
      const session = await createConnectedSession(api, "/contract/vault-keeper");
      sessionRef.current = session;
      indexerUrlRef.current = session.config.indexerUri;
      setCoinPublicKey(session.coinPublicKeyHex);
      setCoinPublicKeyBech32(session.coinPublicKey);
      setUnshieldedAddress(session.unshieldedAddress);
      setIsConnected(true);
      console.log(`[connect] bech32=${session.coinPublicKey.slice(0, 20)}... hex=${session.coinPublicKeyHex.slice(0, 20)}...`);
      showSuccess(`Connected: ${shortAddress(session.coinPublicKey)}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Connection rejected by 1AM wallet");
    }
  }, [showError, showSuccess]);

  const getSession = useCallback(async () => {
    if (sessionRef.current) return sessionRef.current;
    const walletApi = await detectWallet();
    if (!walletApi) throw new Error("1AM wallet not found");
    const api = await walletApi.connect(networkId);
    const session = await createConnectedSession(api, "/contract/vault-keeper");
    sessionRef.current = session;
    indexerUrlRef.current = session.config.indexerUri;
    setUnshieldedAddress(session.unshieldedAddress);
    return session;
  }, [networkId]);

  const refreshAll = useCallback(async () => {
    if (!vaultKeeperAddress) {
      setStats(EMPTY_STATS);
      setVaults([]);
      return;
    }
    if (!coinPublicKey) {
      console.log("[refreshAll] skipping - no coinPublicKey");
      return;
    }
    console.log(`[refreshAll] fetching state for ${vaultKeeperAddress.slice(0, 16)}... pk=${coinPublicKey.slice(0, 16)}...`);
    setIsRefreshing(true);
    try {
      const url = indexerUrlRef.current || MIDNIGHT_NETWORKS[networkId]?.indexerHttp;
      if (!url) { showError("No indexer URL available"); setStats(EMPTY_STATS); setVaults([]); return; }
      const now = await getCurrentTime();
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query: `query($address: HexEncoded!) {
            contractAction(address: $address) { state }
          }`,
          variables: { address: vaultKeeperAddress },
        }),
      });
      if (!res.ok) throw new Error(`Indexer HTTP ${res.status}`);
      const payload = await res.json();
      if (payload.errors?.length) throw new Error(payload.errors.map((e: any) => e.message).join("; "));
      const stateHex = payload?.data?.contractAction?.state;
      if (!stateHex) {
        setStats(EMPTY_STATS); setVaults([]);
        return;
      }
      const { ContractState } = await import("@midnight-ntwrk/compact-runtime");
      const cs = ContractState.deserialize(
        new Uint8Array((stateHex.startsWith("0x") ? stateHex.slice(2) : stateHex).match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16))),
      );
      const l = vaultKeeperLedger(cs.data);
      const flat = flattenLedgerState(l, coinPublicKey, now);
      console.log(`[refreshAll] vaultCount=${flat.vaultCount} userDeposit=${flat.userDeposit} vaultsWithDeposit=${flat.vaults.filter(v => v.userDeposit > 0n).length}`);
      setStats({ ownerPubKey: flat.ownerPubKey, rewardToken: flat.rewardToken, vaultCount: flat.vaultCount });
      setVaults(flat.vaults);
      if (flat.vaults.length > 0 && !flat.vaults.find((v) => v.id === selectedVaultId)) {
        setSelectedVaultId(flat.vaults[0].id);
      }
    } catch (err) {
      console.error("refreshAll error:", err);
      showError(err instanceof Error ? err.message : "Failed to refresh contract state");
    } finally {
      setIsRefreshing(false);
    }
  }, [networkId, vaultKeeperAddress, coinPublicKey, selectedVaultId, showError]);

  useEffect(() => {
    if (!vaultKeeperAddress) return;
    refreshAll();
    const timer = setInterval(refreshAll, 15000);
    return () => clearInterval(timer);
  }, [vaultKeeperAddress, refreshAll]);

  const deployVaultKeeper = useCallback(async () => {
    const session = await getSession();
    setIsSubmitting(true);
    try {
      showInfo("Building unproven deploy tx...");
      const [{ createUnprovenDeployTx, submitTxAsync }, { sampleSigningKey }] = await Promise.all([
        import("@midnight-ntwrk/midnight-js-contracts"),
        import("@midnight-ntwrk/compact-runtime"),
      ]);
      const compiledContract = createCompiledVaultKeeperContract(coinPublicKey);
      const deployTxData = await createUnprovenDeployTx(
        { zkConfigProvider: session.providers.zkConfigProvider, walletProvider: session.providers.walletProvider },
        { compiledContract, args: [coinPublicKeyToBytes(coinPublicKey)], signingKey: sampleSigningKey() } as any,
      );
      const contractAddress = deployTxData.public.contractAddress;

      showInfo(`Submitting deploy tx for ${contractAddress}...`);
      await submitTxAsync(session.providers as any, { unprovenTx: deployTxData.private.unprovenTx });

      await session.providers.privateStateProvider.setContractAddress(contractAddress);
      await session.providers.privateStateProvider.setSigningKey(contractAddress, deployTxData.private.signingKey);

      showInfo("Waiting for indexer...");
      await waitForContractDeployment(session.providers.publicDataProvider, contractAddress);

      setVaultKeeperAddress(contractAddress);
      saveAddress("vk_vaultKeeperAddress", contractAddress);
      showSuccess(`VaultKeeper deployed: ${shortAddress(contractAddress)}`);
      refreshAll();
      return contractAddress;
    } catch (err) {
      showError(`Deploy failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [getSession, coinPublicKey, refreshAll, showError, showInfo, showSuccess]);

  const deployVkprToken = useCallback(async () => {
    const session = await getSession();
    setIsSubmitting(true);
    try {
      showInfo("Deploying VKPR Token...");
      const name = new TextEncoder().encode("VaultKeeper Reward Token");
      const symbol = new TextEncoder().encode("VKPR");
      const [{ createUnprovenDeployTx, submitTxAsync }, { sampleSigningKey }] = await Promise.all([
        import("@midnight-ntwrk/midnight-js-contracts"),
        import("@midnight-ntwrk/compact-runtime"),
      ]);
      const compiledContract = createCompiledVkprTokenContract(coinPublicKey);
      const vkprZkProvider = createZkConfigProvider("/contract/vkpr-token");
      const deployTxData = await createUnprovenDeployTx(
        { zkConfigProvider: vkprZkProvider, walletProvider: session.providers.walletProvider },
        { compiledContract, args: [name, symbol, 18n, coinPublicKeyToBytes(coinPublicKey)], signingKey: sampleSigningKey() } as any,
      );
      const contractAddress = deployTxData.public.contractAddress;
      await submitTxAsync(session.providers as any, { unprovenTx: deployTxData.private.unprovenTx });
      await session.providers.privateStateProvider.setContractAddress(contractAddress);
      await session.providers.privateStateProvider.setSigningKey(contractAddress, deployTxData.private.signingKey);
      await waitForContractDeployment(session.providers.publicDataProvider, contractAddress);
      setVkprTokenAddress(contractAddress);
      saveAddress("vk_vkprTokenAddress", contractAddress);
      showSuccess(`VKPR Token deployed: ${shortAddress(contractAddress)}`);
      return contractAddress;
    } catch (err) {
      showError(`Deploy failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [getSession, coinPublicKey, showError, showInfo, showSuccess]);

  const callCircuit = useCallback(async (
    circuitId: string,
    args: any[],
    successText: string,
    snapshotPred?: () => Promise<boolean>,
  ) => {
    if (!vaultKeeperAddress) { showError("No contract address set."); return; }
    const session = await getSession();
    setIsSubmitting(true);
    try {
      showInfo(`Building ${circuitId} proof via 1AM...`);
      const { createUnprovenCallTx, submitTxAsync } = await import("@midnight-ntwrk/midnight-js-contracts");
      const compiledContract = createCompiledVaultKeeperContract(coinPublicKey);
      const callTxData = await createUnprovenCallTx(session.providers as any, {
        compiledContract,
        contractAddress: vaultKeeperAddress,
        circuitId,
        args,
      } as any);
      await submitTxAsync(session.providers as any, { unprovenTx: callTxData.private.unprovenTx, circuitId } as any);
      if (snapshotPred) {
        const { waitForStateAdvance } = await import("../lib/midnight");
        await waitForStateAdvance(session.providers.publicDataProvider, async (provider) => {
          const s = await provider.queryContractState(vaultKeeperAddress);
          return s?.data ? !!snapshotPred() : false;
        });
      }
      showSuccess(successText);
      await refreshAll();
    } catch (err) {
      showError(err instanceof Error ? err.message : `${circuitId} failed`);
    } finally {
      setIsSubmitting(false);
    }
  }, [vaultKeeperAddress, coinPublicKey, getSession, refreshAll, showError, showInfo, showSuccess]);

  const callVkprCircuit = useCallback(async (
    circuitId: string,
    args: any[],
    successText: string,
  ) => {
    if (!vkprTokenAddress) { showError("VKPR token not deployed"); return; }
    const session = await getSession();
    setIsSubmitting(true);
    try {
      showInfo(`Building VKPR ${circuitId} proof...`);
      const [{ createUnprovenCallTx, submitTxAsync }] = await Promise.all([
        import("@midnight-ntwrk/midnight-js-contracts"),
      ]);
      const vkprZkProvider = createZkConfigProvider("/contract/vkpr-token");
      const compiledVkpr = createCompiledVkprTokenContract(coinPublicKey);

      const vkprProvingProvider = await session.api.getProvingProvider(vkprZkProvider);
      const vkprProofProvider = {
        async proveTx(unprovenTx: any, _config: any) {
          const { CostModel } = await import("@midnight-ntwrk/ledger-v8");
          return unprovenTx.prove(vkprProvingProvider, CostModel.initialCostModel());
        },
      };
      const vkprProviders = { ...session.providers, zkConfigProvider: vkprZkProvider, proofProvider: vkprProofProvider };

      const callTxData = await createUnprovenCallTx(vkprProviders as any, {
        compiledContract: compiledVkpr,
        contractAddress: vkprTokenAddress,
        circuitId,
        args,
      } as any);
      await submitTxAsync(vkprProviders as any, { unprovenTx: callTxData.private.unprovenTx, circuitId } as any);
      showSuccess(successText);
    } catch (err) {
      showError(err instanceof Error ? err.message : `VKPR ${circuitId} failed`);
    } finally {
      setIsSubmitting(false);
    }
  }, [vkprTokenAddress, coinPublicKey, getSession, showError, showInfo, showSuccess]);

  const deposit = useCallback(async (amountHuman: string) => {
    if (!selectedVault) { showInfo("Select a vault first."); return; }
    if (!selectedVault.active) { showInfo("Vault is not active."); return; }
    const displayAmount = parseFloat(amountHuman);
    const vaultAmount = BigInt(Math.floor(displayAmount * 1e18));
    const tnightStars = BigInt(Math.floor(displayAmount * 1_000_000));
    const currentTime = await getCurrentTime();
    const session = await getSession();

    const { nativeToken } = await import("@midnight-ntwrk/ledger-v8");
    showInfo(`Sending ${amountHuman} tNIGHT (self-transfer)...`);
    const result = await session.api.makeTransfer([
      { recipient: session.unshieldedAddress, type: nativeToken().raw, value: tnightStars, kind: "unshielded" },
    ]);
    if (!result?.tx && !result?.tx_id) {
      showError("tNIGHT transfer failed");
      return;
    }

    await callCircuit("deposit", [BigInt(selectedVault.id), vaultAmount, currentTime], "Deposit submitted.");
  }, [callCircuit, getSession, selectedVault, showError, showInfo]);

  const withdraw = useCallback(async (amountHuman: string) => {
    if (!selectedVault) { showInfo("Select a vault first."); return; }
    const amount = BigInt(Math.floor(parseFloat(amountHuman) * 1e18));
    const currentTime = await getCurrentTime();
    await callCircuit("withdraw", [amount, currentTime], "Withdraw submitted.");
  }, [callCircuit, selectedVault, showInfo]);

  const claimRewards = useCallback(async (_vaultId?: number) => {
    const targetId = _vaultId ?? selectedVault?.id;
    if (targetId === undefined) { showInfo("Select a vault first."); return; }
    const currentTime = await getCurrentTime();
    const session = await getSession();

    const url = indexerUrlRef.current;
    const prevRewardsClaimed = url && vaultKeeperAddress
      ? await readContractLedger(url, vaultKeeperAddress, vaultKeeperLedger).then(async (r) => {
          if (!r) return ZERO;
          const userKey = coinPublicKeyToBytes(coinPublicKey);
          return r.ledger.userRewardsClaimed.member(userKey) ? r.ledger.userRewardsClaimed.lookup(userKey) : ZERO;
        }).catch(() => ZERO)
      : ZERO;

    await callCircuit("claimRewards", [BigInt(targetId), currentTime], "Rewards claimed.");

    if (vkprTokenAddress) {
      try {
        const { waitForStateAdvance } = await import("../lib/midnight");
        await waitForStateAdvance(session.providers.publicDataProvider, async () => {
          const s = await session.providers.publicDataProvider.queryContractState(vaultKeeperAddress);
          if (!s?.data) return false;
          const ledger = vaultKeeperLedger(s.data);
          const userKey = coinPublicKeyToBytes(coinPublicKey);
          const newClaimed = ledger.userRewardsClaimed.member(userKey)
            ? ledger.userRewardsClaimed.lookup(userKey)
            : ZERO;
          return newClaimed > prevRewardsClaimed;
        });

        const newState = await readContractLedger(url!, vaultKeeperAddress, vaultKeeperLedger);
        if (newState) {
          const userKey = coinPublicKeyToBytes(coinPublicKey);
          const newClaimed = newState.ledger.userRewardsClaimed.member(userKey)
            ? newState.ledger.userRewardsClaimed.lookup(userKey)
            : ZERO;
          const reward = newClaimed - prevRewardsClaimed;
          if (reward > 0n) {
            showInfo(`Minting ${reward.toString()} VKPR tokens...`);
            await callVkprCircuit("mint", [userKey, reward], "VKPR rewards minted.");
          }
        }
      } catch (err) {
        console.error("[claimRewards] auto-mint failed:", err);
        showInfo("Reward recorded. VKPR mint failed — mint manually from Admin page.");
      }
    }
  }, [callCircuit, callVkprCircuit, coinPublicKey, selectedVault, showInfo, vaultKeeperAddress, vkprTokenAddress]);

  const mintVkpr = useCallback(async (toAddressHex: string, amountHuman: string) => {
    const toBytes = coinPublicKeyToBytes(toAddressHex);
    const amount = BigInt(Math.floor(parseFloat(amountHuman) * 1e18));
    await callVkprCircuit("mint", [toBytes, amount], "VKPR minted.");
  }, [callVkprCircuit]);

  const transferVkpr = useCallback(async (toAddressHex: string, amountHuman: string) => {
    const toBytes = coinPublicKeyToBytes(toAddressHex);
    const amount = BigInt(Math.floor(parseFloat(amountHuman) * 1e18));
    await callVkprCircuit("transfer", [toBytes, amount], "VKPR transferred.");
  }, [callVkprCircuit]);

  const setRewardToken = useCallback(async (address: string) => {
    const addrBytes = (address.startsWith("0x") ? address.slice(2) : address).padStart(64, "0");
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) bytes[i] = parseInt(addrBytes.slice(i * 2, i * 2 + 2), 16);
    await callCircuit("setRewardToken", [bytes], "Reward token set.");
  }, [callCircuit]);

  const createVault = useCallback(async (payload: { name: string; riskLevel: string; minAPY: string; maxAPY: string; tokenAddress: string }) => {
    const { waitForStateAdvance } = await import("../lib/midnight");
    await callCircuit("createVault", [
      payload.name,
      BigInt(payload.riskLevel),
      BigInt(payload.minAPY),
      BigInt(payload.maxAPY),
      new Uint8Array((payload.tokenAddress.startsWith("0x") ? payload.tokenAddress.slice(2) : payload.tokenAddress).padStart(64, "0").match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16))),
    ], "Vault created.");
  }, [callCircuit]);

  const updateApy = useCallback(async (payload: { vaultId: string; minAPY: string; maxAPY: string }) => {
    await callCircuit("updateAPY", [BigInt(payload.vaultId), BigInt(payload.minAPY), BigInt(payload.maxAPY)], "APY updated.");
  }, [callCircuit]);

  const toggleVaultActive = useCallback(async (vaultId: number) => {
    await callCircuit("toggleVaultActive", [BigInt(vaultId)], `Vault ${vaultId} toggled.`);
  }, [callCircuit]);

  const emergencyWithdraw = useCallback(async (_payload: { vaultId: string }) => {
    await callCircuit("emergencyWithdraw", [BigInt(_payload.vaultId)], "Emergency withdraw done.");
  }, [callCircuit]);

  const setContractAddress = useCallback((address: string) => {
    setVaultKeeperAddress(address);
    saveAddress("vk_vaultKeeperAddress", address);
  }, []);

  return {
    coinPublicKey, coinPublicKeyBech32, isConnected, networkId, isAdmin, stats, vaults,
    selectedVault, selectedVaultId, setSelectedVaultId,
    isRefreshing, isSubmitting, unshieldedAddress,
    connectWallet, refreshAll,
    deployVaultKeeper, deployVkprToken,
    deposit, withdraw, claimRewards,
    mintVkpr, transferVkpr,
    setRewardToken, createVault, updateApy, toggleVaultActive, emergencyWithdraw,
    vaultKeeperAddress, vkprTokenAddress,
    setContractAddress,
    session: sessionRef.current,
  };
}
