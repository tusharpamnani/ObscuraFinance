"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Wallet, RefreshCw, TrendingUp, BarChart3, PieChart, Shield } from "lucide-react";
import {
  formatToken,
  formatPercentFromBps,
  riskName,
  shortAddress,
  useMidnightVaultKeeper,
} from "../hooks/useMidnightVaultKeeper";
import { DEFAULT_MIDNIGHT_NETWORK, MIDNIGHT_NETWORKS } from "../config/midnight-networks";

export default function AnalyticsMidnightPage() {
  const {
    coinPublicKey,
    coinPublicKeyBech32,
    isConnected,
    networkId,
    vaults,
    stats,
    isRefreshing,
    connectWallet,
    refreshAll,
    vaultKeeperAddress,
  } = useMidnightVaultKeeper();

  const network = MIDNIGHT_NETWORKS[networkId];

  const totalTVL = useMemo(() => vaults.reduce((s, v) => s + v.totalValueLocked, 0n), [vaults]);
  const activeVaults = useMemo(() => vaults.filter((v) => v.active), [vaults]);
  const totalRewardsDistributed = useMemo(
    () => vaults.reduce((s, v) => s + v.userRewardsClaimed, 0n),
    [vaults],
  );

  const sortedByTVL = useMemo(
    () => [...vaults].sort((a, b) => Number(b.totalValueLocked - a.totalValueLocked)),
    [vaults],
  );
  const maxTVL = useMemo(
    () => (sortedByTVL.length > 0 ? sortedByTVL[0].totalValueLocked : 1n),
    [sortedByTVL],
  );

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Shield className="mx-auto h-12 w-12 text-zinc-500" />
        <h1 className="mt-4 text-2xl font-semibold text-white">Analytics</h1>
        <p className="mt-2 text-sm text-zinc-400">Connect your 1AM wallet to view platform analytics.</p>
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Platform Overview</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Analytics <span className="text-xs text-zinc-500">Midnight {networkId}</span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {coinPublicKey && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                {shortAddress(coinPublicKeyBech32 || coinPublicKey)}
              </div>
            )}
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
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Total TVL" value={`${formatToken(totalTVL, 18)} tNIGHT`} />
        <StatCard icon={<BarChart3 className="h-5 w-5" />} label="Active Vaults" value={`${activeVaults.length} / ${vaults.length}`} accent="emerald" />
        <StatCard icon={<PieChart className="h-5 w-5" />} label="Avg APY (Max)" value={vaults.length > 0 ? formatPercentFromBps(vaults.reduce((s, v) => s + v.maxAPY, 0n) / BigInt(vaults.length || 1)) : "0%"} accent="purple" />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Rewards Distributed" value={formatToken(totalRewardsDistributed, 18)} />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-card-border bg-card/80 p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">TVL by Vault</h2>
          {sortedByTVL.length === 0 ? (
            <p className="text-sm text-zinc-400">No vaults deployed.</p>
          ) : (
            <div className="space-y-3">
              {sortedByTVL.map((vault) => {
                const pct = maxTVL > 0n ? Number((vault.totalValueLocked * 100n) / maxTVL) : 0;
                return (
                  <div key={vault.id} className="rounded-lg border border-zinc-800 bg-black/35 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-white">#{vault.id} {vault.name}</span>
                      <span className="text-xs text-zinc-400">{formatToken(vault.totalValueLocked, 18)} tNIGHT</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-monad-purple transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[11px] text-zinc-500">
                      <span>{riskName(vault.riskLevel)}</span>
                      <span>{formatPercentFromBps(vault.minAPY)} - {formatPercentFromBps(vault.maxAPY)} APY</span>
                      <span className={vault.active ? "text-emerald-400" : "text-red-400"}>
                        {vault.active ? "Active" : "Paused"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-card-border bg-card/80 p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">Vault Distribution</h2>
          {vaults.length === 0 ? (
            <p className="text-sm text-zinc-400">No vaults deployed.</p>
          ) : (
            <div className="space-y-3">
              {vaults.map((vault) => {
                const pct = totalTVL > 0n ? Number((vault.totalValueLocked * 10000n) / totalTVL) / 100 : 0;
                return (
                  <div key={vault.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white">#{vault.id} {vault.name}</span>
                        <span className="text-xs text-zinc-400">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-monad-purple/70 transition-all"
                          style={{ width: `${Math.max(pct, 1)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-card-border bg-card/80 p-5">
        <h2 className="mb-3 text-lg font-semibold text-white">All Vaults</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-[0.1em] text-zinc-500">
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Risk</th>
                <th className="px-3 py-2 text-left">APY</th>
                <th className="px-3 py-2 text-left">TVL</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {vaults.map((v) => (
                <tr key={v.id} className="border-b border-zinc-800/50 text-zinc-300">
                  <td className="px-3 py-2">{v.id}</td>
                  <td className="px-3 py-2 font-medium text-white">{v.name}</td>
                  <td className="px-3 py-2">{riskName(v.riskLevel)}</td>
                  <td className="px-3 py-2">{formatPercentFromBps(v.minAPY)} - {formatPercentFromBps(v.maxAPY)}</td>
                  <td className="px-3 py-2 font-mono">{formatToken(v.totalValueLocked, 18)}</td>
                  <td className="px-3 py-2">
                    <span className={`${v.active ? "text-emerald-400" : "text-red-400"}`}>
                      {v.active ? "Active" : "Paused"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
