"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Moon, Shield, Target, TrendingUp, Zap, Users } from "lucide-react";

const features = [
  {
    icon: Moon,
    title: "Midnight ZK Privacy",
    detail: "Zero-knowledge proofs ensure vault deposits and reward claims are private by default.",
  },
  {
    icon: Shield,
    title: "Compact Smart Contracts",
    detail: "ZK-compiled Compact contracts on Midnight Network replace Solidity on EVM.",
  },
  {
    icon: TrendingUp,
    title: "On-Chain Yield with ZK",
    detail: "Track rewards with verified private computations — no data leakage.",
  },
  {
    icon: Zap,
    title: "1AM Wallet Integration",
    detail: "Connect via 1AM browser extension for dust-free sponsored transactions.",
  },
  {
    icon: Target,
    title: "Multi-Network Ready",
    detail: "Deploy on undeployed (local), preprod, preview, or mainnet with one codebase.",
  },
  {
    icon: Users,
    title: "Familiar UX, New Backend",
    detail: "Same vault UI with Midnight's privacy, security, and ZK proving infrastructure.",
  },
];

export default function Home() {
  const [heroLogoSrc, setHeroLogoSrc] = useState("/vault.gif");

  return (
    <div className="min-h-screen overflow-x-hidden">
      <section className="relative z-10 flex min-h-[92vh] flex-col items-center justify-center px-4 pb-28 pt-20 text-center">
        <div className="mx-auto max-w-6xl space-y-8 animate-fade-in">
          <div className="space-y-6">
            <div className="relative flex items-center justify-center">
              <img
                src={heroLogoSrc}
                alt="ObscuraFinance"
                onError={() => setHeroLogoSrc("/loadr.gif")}
                className="h-auto w-[280px] object-contain sm:w-[420px] md:w-[560px] lg:w-[720px]"
              />
            </div>
            <p className="text-3xl font-light tracking-wide text-zinc-300 md:text-4xl">
              Obscura Finance
            </p>
          </div>

          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-zinc-400">
            Deposit into structured vaults, earn yield, and manage your full position lifecycle with
            privacy-preserving ZK on-chain mechanics.
          </p>

          <div className="flex flex-col items-center justify-center gap-5 pt-6 sm:flex-row">
            <Link
              href="/vaults"
              className="group relative bg-white px-10 py-4 text-lg font-bold text-black transition-all hover:scale-105 hover:bg-zinc-200"
            >
              <span className="relative flex items-center gap-2">
                Open Vaults
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            <Link
              href="/admin"
              className="group border border-zinc-600 bg-zinc-900 px-10 py-4 text-lg font-semibold text-white transition-all hover:scale-105 hover:bg-zinc-800"
            >
              <span className="flex items-center gap-2">
                Admin Panel
              </span>
            </Link>
          </div>

          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-monad-purple/40 bg-monad-purple/10 px-4 py-2 text-sm text-monad-purple">
            <Moon className="h-4 w-4" />
            Powered by Midnight Network — Zero-Knowledge Smart Contracts
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 pt-14 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-white">ZK</div>
              <div className="text-sm text-zinc-400">Zero-Knowledge Proofs</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-white">Dust</div>
              <div className="text-sm text-zinc-400">Sponsored Fees</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-white">3</div>
              <div className="text-sm text-zinc-400">Risk Segments</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-white">24/7</div>
              <div className="text-sm text-zinc-400">On-Chain Access</div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-5xl font-bold text-white">Why ObscuraFinance on Midnight?</h2>
            <p className="mx-auto max-w-2xl text-xl text-zinc-400">
              Privacy-first vault operations with zero-knowledge smart contracts.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="border border-card-border bg-card/80 p-6 transition hover:border-monad-purple/70">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center bg-zinc-900">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold text-white">{feature.title}</h3>
                  <p className="leading-relaxed text-zinc-400">{feature.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-card-border bg-black/30 px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-5xl font-bold text-white">How It Works</h2>
            <p className="mx-auto max-w-2xl text-xl text-zinc-400">
              From wallet connection to rewards, end-to-end with ZK privacy.
            </p>
          </div>
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Connect 1AM", detail: "Install the 1AM browser extension and connect to Midnight Network." },
              { title: "Get NIGHT", detail: "Fund your wallet from the faucet (preprod) or use sponsored fees (preview/mainnet)." },
              { title: "Deposit Into Vault", detail: "Choose a vault and complete a ZK-proven deposit transaction." },
              { title: "Track, Claim, Withdraw", detail: "Watch rewards accrue via the Indexer, claim yield, or withdraw." },
            ].map((step, idx) => (
              <div key={step.title} className="border border-card-border bg-card/70 p-5">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center border border-monad-purple text-lg font-bold text-monad-purple">
                  {idx + 1}
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">{step.title}</h3>
                <p className="text-zinc-400">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-24">
        <div className="mx-auto max-w-5xl border border-card-border bg-card/80 p-8">
          <h2 className="mb-8 text-center text-4xl font-bold text-white">Go To Modules</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/vaults" className="border border-zinc-800 bg-black/35 p-5 text-white transition hover:border-monad-purple">
              <p className="text-xl font-semibold">Vaults</p>
              <p className="mt-2 text-sm text-zinc-400">Deposit, withdraw, claim rewards via 1AM wallet.</p>
            </Link>
            <Link href="/admin" className="border border-zinc-800 bg-black/35 p-5 text-white transition hover:border-monad-purple">
              <p className="text-xl font-semibold">Admin</p>
              <p className="mt-2 text-sm text-zinc-400">Owner controls for token, vault creation, APY, and emergency actions.</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
