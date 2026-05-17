"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Wallet, RefreshCw, TrendingUp, Clock, Award, Shield } from "lucide-react";
import {
  formatToken,
  formatPercentFromBps,
  riskName,
  shortAddress,
  useMidnightVaultKeeper,
} from "../hooks/useMidnightVaultKeeper";
import { DEFAULT_MIDNIGHT_NETWORK, MIDNIGHT_NETWORKS, type MidnightNetworkId } from "../config/midnight-networks";
import { ZERO_BYTES32 } from "../config/midnight-contracts";

export default function ProfileMidnightPage() {
  const {
    coinPublicKey,
    coinPublicKeyBech32,
    isConnected,
    networkId,
    vaults,
    isRefreshing,
    connectWallet,
    refreshAll,
    vaultKeeperAddress,
    stats,
  } = useMidnightVaultKeeper();

  const network = MIDNIGHT_NETWORKS[networkId];

  const userVaults = useMemo(() => vaults.filter((v) => v.userDeposit > 0n), [vaults]);
  const totalDeposited = useMemo(() => userVaults.reduce((s, v) => s + v.userDeposit, 0n), [userVaults]);
  const totalPendingRewards = useMemo(() => userVaults.reduce((s, v) => s + v.userPendingRewards, 0n), [userVaults]);
  const totalRewardsClaimed = useMemo(() => userVaults.reduce((s, v) => s + v.userRewardsClaimed, 0n), [userVaults]);

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Shield className="mx-auto h-12 w-12 text-zinc-500" />
        <h1 className="mt-4 text-2xl font-semibold text-white">Profile</h1>
        <p className="mt-2 text-sm text-zinc-400">Connect your 1AM wallet to view your portfolio.</p>
        <button
          onClick={connectWallet}
          className="mt-4 rounded-lg bg-monad-purple px-6 py-2 text-sm font-semibold text-white hover:bg-monad-purple/80"
        >
          <Wallet className="mr-2 inline-block h-4 w-4" /> Connect 1AM
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-2xl border border-card-border bg-card/80 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Your Portfolio</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Profile <span className="text-xs text-zinc-500">Midnight {networkId}</span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              {shortAddress(coinPublicKeyBech32 || coinPublicKey)}
            </div>
            <button
              onClick={refreshAll}
              disabled={isRefreshing}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRefreshing ? <RefreshCw className="mr-1 inline-block h-3 w-3 animate-spin" /> : null}
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard icon={<Wallet className="h-5 w-5" />} label="Total Deposited" value={formatToken(totalDeposited, 18)} />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Pending Rewards" value={formatToken(totalPendingRewards, 18)} accent="emerald" />
        <StatCard icon={<Award className="h-5 w-5" />} label="Rewards Claimed" value={formatToken(totalRewardsClaimed, 18)} accent="purple" />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Active Vaults" value={String(userVaults.length)} />
      </div>

      <section className="mt-6 rounded-2xl border border-card-border bg-card/80 p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">Your Vault Positions</h2>
        {vaults.length > 0 && userVaults.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-black/35 p-6 text-center">
            <p className="text-sm text-zinc-400">No active deposits. Go to Vaults to make your first deposit.</p>
          </div>
        ) : vaults.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-black/35 p-6 text-center">
            <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-zinc-500" />
            <p className="text-sm text-zinc-400">{isRefreshing ? "Loading vault state..." : "Waiting for indexer..."}</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {userVaults.map((vault) => (
              <div key={vault.id} className="rounded-lg border border-zinc-800 bg-black/35 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">#{vault.id} {vault.name}</p>
                  <span className={`text-xs ${vault.active ? "text-emerald-300" : "text-red-300"}`}>
                    {vault.active ? "Active" : "Paused"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-zinc-500">Deposited</p>
                    <p className="mt-0.5 font-medium text-white">{formatToken(vault.userDeposit, 18)} tNIGHT</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Pending Yield</p>
                    <p className="mt-0.5 font-medium text-emerald-300">{formatToken(vault.userPendingRewards, 18)} VKPR</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Claimed</p>
                    <p className="mt-0.5 font-medium text-zinc-300">{formatToken(vault.userRewardsClaimed, 18)} VKPR</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">APY Range</p>
                    <p className="mt-0.5 font-medium text-zinc-300">{formatPercentFromBps(vault.minAPY)} - {formatPercentFromBps(vault.maxAPY)}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-md border border-zinc-700 bg-black/40 px-2 py-1 text-[11px] text-zinc-200">
                    Risk: {riskName(vault.riskLevel)}
                  </span>
                  <span className="rounded-md border border-zinc-700 bg-black/40 px-2 py-1 text-[11px] text-zinc-200">
                    TVL: {formatToken(vault.totalValueLocked, 18)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-card-border bg-card/80 p-5">
        <h2 className="mb-3 text-lg font-semibold text-white">Contract Info</h2>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-black/35 px-3 py-2">
            <span className="text-zinc-400">VaultKeeper</span>
            <span className="font-mono text-zinc-200">
              {shortAddress(vaultKeeperAddress || "")}
              {vaultKeeperAddress && network.explorerUrl && (
                <a href={`${network.explorerUrl}/contract/${vaultKeeperAddress}`} target="_blank" rel="noreferrer" className="ml-2 inline-block text-monad-purple hover:text-white">
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-black/35 px-3 py-2">
            <span className="text-zinc-400">Reward Token</span>
            <span className="font-mono text-zinc-200">{stats.rewardToken !== ZERO_BYTES32 ? shortAddress(stats.rewardToken) : "Not set"}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-black/35 px-3 py-2">
            <span className="text-zinc-400">Total Vaults</span>
            <span className="text-zinc-200">{stats.vaultCount.toString()}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  const accentColor = accent === "emerald" ? "text-emerald-400" : accent === "purple" ? "text-monad-purple" : "text-white";
  return (
    <div className="rounded-2xl border border-card-border bg-card/80 p-4 shadow-xl">
      <div className="mb-2 text-zinc-400">{icon}</div>
      <p className="text-xs uppercase tracking-[0.1em] text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accentColor}`}>{value}</p>
    </div>
  );
}
