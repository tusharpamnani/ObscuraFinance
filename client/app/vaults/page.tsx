"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, ExternalLink, Loader2, Wallet, X } from "lucide-react";
import {
  formatPercentFromBps,
  formatToken,
  riskName,
  shortAddress,
  useMidnightVaultKeeper,
} from "../hooks/useMidnightVaultKeeper";
import { DEFAULT_MIDNIGHT_NETWORK, MIDNIGHT_NETWORKS } from "../config/midnight-networks";
import { useToastContext } from "../contexts/ToastContext";

export default function VaultsMidnightPage() {
  const {
    coinPublicKey,
    coinPublicKeyBech32,
    isConnected,
    networkId,
    vaults,
    selectedVault,
    selectedVaultId,
    setSelectedVaultId,
    stats,
    isRefreshing,
    isSubmitting,
    connectWallet,
    refreshAll,
    deposit,
    withdraw,
    claimRewards,
    vaultKeeperAddress,
    setContractAddress,
  } = useMidnightVaultKeeper();

  const { showInfo } = useToastContext();

  const network = MIDNIGHT_NETWORKS[networkId];
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositModalVaultId, setDepositModalVaultId] = useState<number | null>(null);
  const [withdrawModalVaultId, setWithdrawModalVaultId] = useState<number | null>(null);
  const [claimModalVaultId, setClaimModalVaultId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [sortBy, setSortBy] = useState<"none" | "apr-desc" | "apr-asc" | "tvl-desc" | "tvl-asc">("none");
  const [isVaultDrawerOpen, setIsVaultDrawerOpen] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [availableContracts, setAvailableContracts] = useState<any[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);

  useEffect(() => {
    if (vaultKeeperAddress) return;
    setLoadingContracts(true);
    fetch(`/api/contracts?network=${networkId}`)
      .then((r) => r.json())
      .then((data) => setAvailableContracts(data.contracts || []))
      .catch(() => {})
      .finally(() => setLoadingContracts(false));
  }, [vaultKeeperAddress, networkId]);

  const userDepositTotal = useMemo(() => vaults.reduce((s, v) => s + v.userDeposit, 0n), [vaults]);

  const depositModalVault = vaults.find((v) => v.id === depositModalVaultId) ?? null;
  const withdrawModalVault = vaults.find((v) => v.id === withdrawModalVaultId) ?? null;
  const claimModalVault = vaults.find((v) => v.id === claimModalVaultId) ?? null;

  const openDepositModal = (vaultId: number) => {
    setSelectedVaultId(vaultId);
    setIsVaultDrawerOpen(true);
    setDepositAmount("");
    setDepositModalVaultId(vaultId);
  };

  const openWithdrawModal = (vaultId: number) => {
    setSelectedVaultId(vaultId);
    setIsVaultDrawerOpen(true);
    setWithdrawAmount("");
    setWithdrawModalVaultId(vaultId);
  };

  const openClaimModal = (vaultId: number) => {
    setSelectedVaultId(vaultId);
    setIsVaultDrawerOpen(true);
    setClaimModalVaultId(vaultId);
  };

  const selectVault = (vaultId: number) => {
    setSelectedVaultId(vaultId);
    setIsVaultDrawerOpen(true);
  };

  const filteredVaults = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = vaults.filter((vault) => {
      const matchesName = q.length === 0 || vault.name.toLowerCase().includes(q);
      const matchesRisk =
        riskFilter === "all" ||
        (riskFilter === "low" && vault.riskLevel === 0) ||
        (riskFilter === "medium" && vault.riskLevel === 1) ||
        (riskFilter === "high" && vault.riskLevel === 2);
      return matchesName && matchesRisk;
    });
    if (sortBy === "apr-desc") list.sort((a, b) => Number(b.maxAPY) - Number(a.maxAPY));
    else if (sortBy === "apr-asc") list.sort((a, b) => Number(a.maxAPY) - Number(b.maxAPY));
    else if (sortBy === "tvl-desc") list.sort((a, b) => Number(b.totalValueLocked) - Number(a.totalValueLocked));
    else if (sortBy === "tvl-asc") list.sort((a, b) => Number(a.totalValueLocked) - Number(b.totalValueLocked));
    return list;
  }, [riskFilter, searchTerm, sortBy, vaults]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-2xl border border-card-border bg-card/80 p-6 shadow-2xl">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Vault Operations</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Vaults <span className="text-xs text-zinc-500">Midnight {networkId}</span>
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Contract: {shortAddress(vaultKeeperAddress || "")}
              {vaultKeeperAddress && network.explorerUrl && (
                <a
                  href={`${network.explorerUrl}/contract/${vaultKeeperAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 inline-flex items-center gap-1 text-monad-purple hover:text-white"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isConnected ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                {shortAddress(coinPublicKeyBech32 || coinPublicKey)}
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="inline-flex items-center gap-2 rounded-lg bg-monad-purple px-4 py-2 text-sm font-semibold text-white hover:bg-monad-purple/80"
              >
                <Wallet className="h-4 w-4" /> Connect 1AM
              </button>
            )}

            <button
              onClick={refreshAll}
              disabled={isRefreshing}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {!vaultKeeperAddress && (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-zinc-800 bg-black/35 p-6">
              <p className="text-sm font-semibold text-zinc-300">Pick a deployed vault contract</p>
              {loadingContracts ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading contracts...
                </div>
              ) : availableContracts.length === 0 ? (
                <p className="mt-3 text-xs text-zinc-500">No contracts found. Ask the admin to deploy one, or paste an address below.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {availableContracts.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setContractAddress(c.vault_keeper_address)}
                      className="w-full rounded-xl border border-zinc-800 bg-black/50 p-3 text-left hover:border-monad-purple/50 hover:bg-monad-purple/5"
                    >
                      <p className="text-sm font-medium text-white">{c.name || "Untitled Vault"}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-zinc-500">{shortAddress(c.vault_keeper_address)}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-600">Deployed on {c.network_id} &middot; {new Date(c.created_at).toLocaleDateString()}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/35 p-6">
              <p className="text-sm font-semibold text-zinc-300">Or enter a contract address manually</p>
              <div className="mt-3 flex gap-3">
                <input
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="Paste contract hex address..."
                  className="flex-1 rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm font-mono text-white outline-none focus:border-monad-purple"
                />
                <button
                  onClick={() => { if (manualAddress.trim()) setContractAddress(manualAddress.trim()); }}
                  className="rounded-lg bg-monad-purple px-4 py-2 text-sm font-semibold text-white hover:bg-monad-purple/80"
                >
                  Set Address
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <section className="mt-6 rounded-2xl border border-card-border bg-card/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Available Vaults</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDebug((v) => !v)}
              className="rounded-lg border border-zinc-700 px-2 py-2 text-[10px] text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
            >
              Debug
            </button>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-200 hover:border-zinc-500"
            >
              Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 grid gap-3 rounded-lg border border-zinc-800 bg-black/35 p-3 md:grid-cols-4">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by vault name"
              className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-monad-purple"
            />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as "all" | "low" | "medium" | "high")}
              className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-monad-purple"
            >
              <option value="all">Risk: All</option>
              <option value="low">Risk: Low</option>
              <option value="medium">Risk: Medium</option>
              <option value="high">Risk: High</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "none" | "apr-desc" | "apr-asc" | "tvl-desc" | "tvl-asc")}
              className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-monad-purple"
            >
              <option value="none">Sort: None</option>
              <option value="apr-desc">APR: High to Low</option>
              <option value="apr-asc">APR: Low to High</option>
              <option value="tvl-desc">TVL: High to Low</option>
              <option value="tvl-asc">TVL: Low to High</option>
            </select>
            <button
              onClick={() => { setSearchTerm(""); setRiskFilter("all"); setSortBy("none"); }}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500"
            >
              Reset
            </button>
          </div>
        )}

        {showDebug && (
          <div className="mt-4 rounded-lg border border-yellow-600/30 bg-black/35 p-3 text-[11px] font-mono text-zinc-400">
            <p>pk: {coinPublicKey.slice(0, 20)}... | addr: {shortAddress(vaultKeeperAddress || "")}</p>
            <p>vaults: {vaults.length} | total userDeposit: {userDepositTotal.toString()}</p>
            <p>vault userDeposits: [{vaults.map(v => `${v.id}:${v.userDeposit}`).join(", ")}]</p>
          </div>
        )}

        {filteredVaults.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-400">
            No vaults deployed on {networkId}. Deploy the VaultKeeper compact contract first.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {filteredVaults.map((vault) => (
              <div
                key={vault.id}
                onClick={() => selectVault(vault.id)}
                className={`rounded-lg border p-4 text-left transition ${
                  selectedVaultId === vault.id
                    ? "border-monad-purple bg-monad-purple/10"
                    : "border-zinc-800 bg-black/35 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">#{vault.id} {vault.name}</p>
                  <span className={`text-xs ${vault.active ? "text-emerald-300" : "text-red-300"}`}>
                    {vault.active ? "Active" : "Paused"}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-md border border-zinc-700 bg-black/40 px-2 py-1 text-zinc-200">
                    Risk: {riskName(vault.riskLevel)}
                  </span>
                  <span className="rounded-md border border-zinc-700 bg-black/40 px-2 py-1 text-zinc-200">
                    APY: {formatPercentFromBps(vault.minAPY)} - {formatPercentFromBps(vault.maxAPY)}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <ConfigItem label="TVL" value={formatToken(vault.totalValueLocked, 18)} />
                  <ConfigItem label="Active" value={vault.active ? "Yes" : "No"} />
                  <ConfigItem label="Your Deposit" value={formatToken(vault.userDeposit, 18)} />
                  <ConfigItem label="Pending Yield" value={formatToken(vault.userPendingRewards, 18)} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => openDepositModal(vault.id)}
                    disabled={!vault.active || isSubmitting}
                    className="rounded-lg bg-monad-purple px-3 py-2 text-xs font-semibold text-white hover:bg-monad-purple/80 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Deposit
                  </button>
                  <button
                    onClick={() => openWithdrawModal(vault.id)}
                    disabled={isSubmitting}
                    className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Withdraw
                  </button>
                  <button
                    onClick={() => openClaimModal(vault.id)}
                    disabled={isSubmitting}
                    className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Claim Rewards
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div
        onClick={() => setIsVaultDrawerOpen(false)}
        className={`fixed inset-0 z-40 bg-black/70 transition-opacity duration-300 ${
          isVaultDrawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-card-border bg-card/95 p-5 shadow-2xl transition-transform duration-300 ${
          isVaultDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Selected Vault</p>
            <h2 className="text-lg font-semibold text-white">
              {selectedVault ? `#${selectedVault.id} ${selectedVault.name}` : "No vault selected"}
            </h2>
          </div>
          <button onClick={() => setIsVaultDrawerOpen(false)} className="border border-zinc-700 p-2 text-zinc-300 hover:border-zinc-500 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {selectedVault ? (
          <div className="mt-5 space-y-3">
            <DataRow label="Risk" value={riskName(selectedVault.riskLevel)} />
            <DataRow label="APY" value={`${formatPercentFromBps(selectedVault.minAPY)} - ${formatPercentFromBps(selectedVault.maxAPY)}`} />
            <DataRow label="Status" value={selectedVault.active ? "Active" : "Paused"} />
            <DataRow label="TVL" value={formatToken(selectedVault.totalValueLocked, 18)} />
            <DataRow label="Your Deposit" value={formatToken(selectedVault.userDeposit, 18)} />
            <DataRow label="Pending Rewards" value={formatToken(selectedVault.userPendingRewards, 18)} />

            <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-3">
              <button
                onClick={() => openDepositModal(selectedVault.id)}
                disabled={!selectedVault.active || isSubmitting}
                className="bg-monad-purple px-3 py-2 text-xs font-semibold text-white hover:bg-monad-purple/80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Deposit
              </button>
              <button
                onClick={() => openWithdrawModal(selectedVault.id)}
                disabled={isSubmitting}
                className="border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Withdraw
              </button>
              <button
                onClick={() => openClaimModal(selectedVault.id)}
                disabled={isSubmitting}
                className="border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Claim
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-5 text-sm text-zinc-400">Select a vault from the list.</p>
        )}
      </aside>

      {depositModalVault && (
        <Modal title={`Deposit`} onClose={() => setDepositModalVaultId(null)}>
          <input
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="0.0"
            className="mt-4 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-monad-purple"
          />
          <button
            onClick={async () => { await deposit(depositAmount); setDepositAmount(""); setDepositModalVaultId(null); }}
            disabled={isSubmitting}
            className="mt-4 w-full rounded-lg bg-monad-purple px-4 py-2 text-sm font-semibold text-white hover:bg-monad-purple/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Deposit"}
          </button>
        </Modal>
      )}

      {withdrawModalVault && (
        <Modal title={`Withdraw`} onClose={() => setWithdrawModalVaultId(null)}>
          <p className="text-sm text-zinc-300">
            Available: <span className="font-semibold text-white">{formatToken(withdrawModalVault.userDeposit, 18)}</span>
          </p>
          <input
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="0.0"
            className="mt-4 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-monad-purple"
          />
          <button
            onClick={async () => { await withdraw(withdrawAmount); setWithdrawAmount(""); setWithdrawModalVaultId(null); }}
            disabled={isSubmitting}
            className="mt-4 w-full rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Withdraw"}
          </button>
        </Modal>
      )}

      {claimModalVault && (
        <Modal title="Claim Yield" onClose={() => setClaimModalVaultId(null)}>
          <p className="text-sm text-zinc-300">
            Claimable: <span className="font-semibold text-white">{formatToken(claimModalVault.userPendingRewards, 18)}</span>
          </p>
          <button
            onClick={async () => { await claimRewards(claimModalVault.id); setClaimModalVaultId(null); }}
            disabled={isSubmitting}
            className="mt-4 w-full rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Claim"}
          </button>
        </Modal>
      )}
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-black/35 px-3 py-2">
      <dt className="text-zinc-400">{label}</dt>
      <dd className="text-right text-white">{value}</dd>
    </div>
  );
}

function ConfigItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-black/30 px-2 py-2">
      <p className="text-[10px] uppercase tracking-[0.08em] text-zinc-500">{label}</p>
      <p className="mt-1 text-xs text-white">{value}</p>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-card-border bg-card/95 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-sm text-zinc-400 hover:text-white">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}
