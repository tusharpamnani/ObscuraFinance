"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ExternalLink, Loader2, Rocket, Shield, Coins, Send } from "lucide-react";
import {
  formatPercentFromBps,
  riskName,
  shortAddress,
  useMidnightVaultKeeper,
} from "../hooks/useMidnightVaultKeeper";

export default function AdminMidnightPage() {
  const {
    coinPublicKey, isConnected, isAdmin, vaults, stats,
    isRefreshing, isSubmitting, connectWallet, refreshAll,
    setRewardToken, createVault, updateApy, toggleVaultActive,
    emergencyWithdraw, deployVaultKeeper, deployVkprToken,
    vaultKeeperAddress, vkprTokenAddress, networkId, coinPublicKeyBech32,
    mintVkpr, transferVkpr,
  } = useMidnightVaultKeeper();

  const [rewardAddr, setRewardAddr] = useState("");
  useEffect(() => { if (vkprTokenAddress) setRewardAddr(vkprTokenAddress); }, [vkprTokenAddress]);
  const [cName, setCName] = useState("");
  const [cRisk, setCRisk] = useState("0");
  const [cMin, setCMin] = useState("500");
  const [cMax, setCMax] = useState("800");
  const [cToken, setCToken] = useState("");
  const [uVaultId, setUVaultId] = useState("");
  const [uMin, setUMin] = useState("500");
  const [uMax, setUMax] = useState("800");
  const [eVaultId, setEVaultId] = useState("");

  const [deployName, setDeployName] = useState("");
  const [mintTo, setMintTo] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [xferTo, setXferTo] = useState("");
  const [xferAmount, setXferAmount] = useState("");

  const saveToNeonDb = useCallback(async (vaultAddr: string, tokenAddr: string | null, name: string) => {
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          networkId,
          vaultKeeperAddress: vaultAddr,
          vkprTokenAddress: tokenAddr || "",
          ownerKey: coinPublicKey,
          name: name || "Untitled Vault",
        }),
      });
      if (!res.ok) console.warn("NeonDB save failed:", await res.text());
      else console.log("NeonDB: contract saved");
    } catch (e) {
      console.warn("NeonDB save error:", e);
    }
  }, [networkId, coinPublicKey]);

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Shield className="mx-auto h-12 w-12 text-zinc-500" />
        <h1 className="mt-4 text-2xl font-semibold text-white">Admin Panel</h1>
        <p className="mt-2 text-sm text-zinc-400">Connect your 1AM wallet to continue.</p>
        <button onClick={connectWallet} className="mt-4 rounded-lg bg-monad-purple px-6 py-2 text-sm font-semibold text-white hover:bg-monad-purple/80">
          Connect 1AM
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Administration</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Admin Panel</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Network: <span className="text-zinc-300">{networkId}</span> &mdash;
          Connected: {shortAddress(coinPublicKeyBech32 || coinPublicKey)}
          {isAdmin && <span className="ml-2 text-emerald-400">(Owner)</span>}
        </p>
        {vaultKeeperAddress && (
          <p className="mt-1 text-xs text-zinc-500">
            VK: {shortAddress(vaultKeeperAddress)}
          </p>
        )}
        {vkprTokenAddress && (
          <p className="mt-1 text-xs text-zinc-500">
            VKPR: {shortAddress(vkprTokenAddress)}
          </p>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={refreshAll} disabled={isRefreshing} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500">
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {(!vaultKeeperAddress || isAdmin) && (
        <>
          <Card title="Deployment Name">
            <p className="mb-3 text-xs text-zinc-400">Set a name for this deployment so others can find it.</p>
            <input value={deployName} onChange={(e) => setDeployName(e.target.value)} placeholder="e.g. Midnight Vault Keeper v1" className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-monad-purple" />
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card title="Deploy VaultKeeper">
              <p className="mb-3 text-xs text-zinc-400">Deploy the main VaultKeeper contract from browser via 1AM.</p>
              <button onClick={async () => { const addr = await deployVaultKeeper(); if (addr) saveToNeonDb(addr, null, deployName); }} disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-monad-purple px-4 py-2 text-sm font-semibold text-white hover:bg-monad-purple/80 disabled:opacity-60">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                Deploy VaultKeeper
              </button>
            </Card>

            <Card title="Deploy VKPR Token">
              <p className="mb-3 text-xs text-zinc-400">Deploy the VKPR reward token contract from browser via 1AM.</p>
              <button onClick={async () => { const addr = await deployVkprToken(); if (addr && vaultKeeperAddress) { try { await fetch("/api/contracts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vaultKeeperAddress, vkprTokenAddress: addr }) }); } catch {} } }} disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-500 disabled:opacity-60">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                Deploy VKPR Token
              </button>
            </Card>
          </div>
        </>
      )}

      {vaultKeeperAddress && !isAdmin && (
        <div className="mb-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5 text-center">
          <p className="text-sm text-yellow-200">This vault contract is owned by another wallet.</p>
          <p className="mt-1 text-xs text-zinc-500">Admin controls require owner authentication. Deploy your own contract above or use the Vaults page to interact.</p>
        </div>
      )}

      {isAdmin && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card title="Set Reward Token">
              <input value={rewardAddr} onChange={(e) => setRewardAddr(e.target.value)} placeholder="Reward token address (hex)" className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-monad-purple" />
              <button onClick={() => setRewardToken(rewardAddr)} disabled={isSubmitting} className="mt-3 w-full rounded-lg bg-monad-purple px-4 py-2 text-sm font-semibold text-white hover:bg-monad-purple/80 disabled:opacity-60">
                {isSubmitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Set Reward Token"}
              </button>
            </Card>

            <Card title="Create Vault">
              <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Vault name" className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-monad-purple" />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <select value={cRisk} onChange={(e) => setCRisk(e.target.value)} className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none">
                  <option value="0">Low Risk</option>
                  <option value="1">Medium Risk</option>
                  <option value="2">High Risk</option>
                </select>
                <input value={cToken} onChange={(e) => setCToken(e.target.value)} placeholder="Token address (hex)" className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-monad-purple" />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input value={cMin} onChange={(e) => setCMin(e.target.value)} placeholder="Min APY (bps)" className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-monad-purple" />
                <input value={cMax} onChange={(e) => setCMax(e.target.value)} placeholder="Max APY (bps)" className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-monad-purple" />
              </div>
              <button onClick={() => createVault({ name: cName, riskLevel: cRisk, minAPY: cMin, maxAPY: cMax, tokenAddress: cToken })} disabled={isSubmitting} className="mt-3 w-full rounded-lg bg-monad-purple px-4 py-2 text-sm font-semibold text-white hover:bg-monad-purple/80 disabled:opacity-60">
                {isSubmitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Create Vault"}
              </button>
            </Card>

            <Card title="Update APY">
              <div className="grid grid-cols-3 gap-2">
                <input value={uVaultId} onChange={(e) => setUVaultId(e.target.value)} placeholder="Vault ID" className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-monad-purple" />
                <input value={uMin} onChange={(e) => setUMin(e.target.value)} placeholder="Min APY" className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-monad-purple" />
                <input value={uMax} onChange={(e) => setUMax(e.target.value)} placeholder="Max APY" className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-monad-purple" />
              </div>
              <button onClick={() => updateApy({ vaultId: uVaultId, minAPY: uMin, maxAPY: uMax })} disabled={isSubmitting} className="mt-3 w-full rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-500 disabled:opacity-60">
                {isSubmitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Update APY"}
              </button>
            </Card>

            <Card title="Toggle Vault">
              <input value={uVaultId} onChange={(e) => setUVaultId(e.target.value)} placeholder="Vault ID" className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-monad-purple" />
              <button onClick={() => toggleVaultActive(Number(uVaultId))} disabled={isSubmitting} className="mt-3 w-full rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/20 disabled:opacity-60">
                {isSubmitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Toggle Active/Inactive"}
              </button>
            </Card>

            <Card title="Emergency Withdraw">
              <input value={eVaultId} onChange={(e) => setEVaultId(e.target.value)} placeholder="Vault ID" className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-monad-purple" />
              <button onClick={() => emergencyWithdraw({ vaultId: eVaultId })} disabled={isSubmitting} className="mt-3 w-full rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-60">
                {isSubmitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Emergency Withdraw"}
              </button>
            </Card>

            <Card title="Mint VKPR Rewards">
              <p className="mb-2 text-xs text-zinc-400">Mint VKPR tokens to a user. Amount in human-readable units.</p>
              <input value={mintTo} onChange={(e) => setMintTo(e.target.value)} placeholder="Recipient address (hex, 0x...)" className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-monad-purple" />
              <input value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} placeholder="Amount" className="mt-2 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-monad-purple" />
              <button onClick={() => mintVkpr(mintTo, mintAmount)} disabled={isSubmitting || !mintTo || !mintAmount} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-60">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coins className="h-4 w-4" />}
                Mint VKPR
              </button>
            </Card>

            <Card title="Transfer VKPR">
              <p className="mb-2 text-xs text-zinc-400">Transfer VKPR tokens from your wallet to another address.</p>
              <input value={xferTo} onChange={(e) => setXferTo(e.target.value)} placeholder="Recipient address (hex, 0x...)" className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-monad-purple" />
              <input value={xferAmount} onChange={(e) => setXferAmount(e.target.value)} placeholder="Amount" className="mt-2 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-monad-purple" />
              <button onClick={() => transferVkpr(xferTo, xferAmount)} disabled={isSubmitting || !xferTo || !xferAmount} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-500 disabled:opacity-60">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Transfer VKPR
              </button>
            </Card>
          </div>
        )}

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-white">Current Vaults</h2>
        {vaults.length === 0 ? (
          <p className="text-sm text-zinc-400">No vaults deployed. Deploy the contract first, then create vaults.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase tracking-[0.1em] text-zinc-500">
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Risk</th>
                  <th className="px-3 py-2 text-left">APY</th>
                  <th className="px-3 py-2 text-left">TVL</th>
                  <th className="px-3 py-2 text-left">Active</th>
                </tr>
              </thead>
              <tbody>
                {vaults.map((v) => (
                  <tr key={v.id} className="border-b border-zinc-800/50 text-zinc-300">
                    <td className="px-3 py-2">{v.id}</td>
                    <td className="px-3 py-2 font-medium text-white">{v.name}</td>
                    <td className="px-3 py-2">{riskName(v.riskLevel)}</td>
                    <td className="px-3 py-2">{formatPercentFromBps(v.minAPY)} - {formatPercentFromBps(v.maxAPY)}</td>
                    <td className="px-3 py-2">{v.totalValueLocked.toString()}</td>
                    <td className="px-3 py-2">{v.active ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-card-border bg-card/80 p-5 shadow-xl">
      <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
      {children}
    </div>
  );
}
