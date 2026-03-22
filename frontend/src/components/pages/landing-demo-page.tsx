"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Layers,
  Radar,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Radar,
    title: "Intent-first analysis",
    body: "Tell OwlSight what you want to do in plain English. It finds every viable route and ranks them by real execution quality.",
  },
  {
    icon: BarChart3,
    title: "Monte Carlo simulation",
    body: "500 simulated execution paths. Every route is stress-tested against slippage variance, latency, and price drift before you commit.",
  },
  {
    icon: Layers,
    title: "Full cost transparency",
    body: "Bridge fees, trading fees, slippage costs, and latency penalties — all modelled before capital moves.",
  },
  {
    icon: ShieldCheck,
    title: "Decision guardrails",
    body: "Hard thresholds on net profit, confidence, and slippage filter bad trades automatically. Only viable routes reach execution.",
  },
  {
    icon: TrendingUp,
    title: "Execution scoring",
    body: "Each route gets a confidence score and risk-adjusted recommendation. Separate interesting from actually executable.",
  },
  {
    icon: Zap,
    title: "Hummingbot execution",
    body: "Approved routes hand off to Hummingbot paper trading. The full stack, safely simulated.",
  },
];

const stats = [
  { value: "500", label: "Simulated paths per route" },
  { value: "< 5s", label: "Full simulation latency" },
  { value: "6+", label: "Live cross-chain routes" },
  { value: "4", label: "Bridge protocols modelled" },
];

const examples = [
  "Swap 2 ETH to SOL with best execution",
  "Bridge $1000 USDC from Ethereum to Base",
  "Find the best SOL → USDC route",
  "Convert ETH to SOL with lowest slippage",
];

export function LandingDemoPage() {
  return (
    <main className="relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-64 -top-32 h-[600px] w-[600px] rounded-full bg-solviolet opacity-[0.08] blur-[120px]" />
        <div className="absolute -right-64 top-64 h-[500px] w-[500px] rounded-full bg-solmint opacity-[0.06] blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-solviolet opacity-[0.05] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ── Hero ── */}
        <section className="relative flex min-h-[90vh] flex-col items-center justify-center py-24 text-center">
          {/* Dot grid */}
          <div className="pointer-events-none absolute inset-0 bg-grid bg-[size:28px_28px] opacity-100" />

          <h1 className="animate-fade-in-up delay-100 relative mx-auto max-w-5xl text-5xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-white">Institutional execution</span>{" "}
            <br className="hidden sm:block" />
            <span className="gradient-text">intelligence</span>
            <span className="text-white">,</span>
            <br />
            <span className="text-white/70">accessible to every trader.</span>
          </h1>

          <div className="animate-fade-in-up delay-300 mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/app"
              className="btn-gradient inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-semibold text-white"
            >
              Start analysing routes
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/how-it-works"
              className="btn-ghost inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
            >
              How it works
            </Link>
          </div>

          {/* Example intent suggestions */}
          <div className="animate-fade-in-up delay-400 mt-14 flex flex-wrap items-center justify-center gap-2.5">
            <span className="text-xs text-white/30">Try asking:</span>
            {examples.map((ex) => (
              <Link
                key={ex}
                href={`/app?intent=${encodeURIComponent(ex)}`}
                className="rounded-full border border-white/[0.09] bg-white/[0.04] px-3.5 py-1.5 text-xs text-white/55 transition hover:border-solviolet/40 hover:bg-solviolet/10 hover:text-white/80"
              >
                {ex}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Stats bar ── */}
        <section className="animate-fade-in-up delay-100 mb-16">
          <div className="panel grid grid-cols-2 gap-px overflow-hidden sm:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`px-8 py-7 text-center ${i > 0 ? "border-l border-white/[0.07]" : ""}`}
              >
                <div className="gradient-text text-3xl font-semibold tabular-nums">
                  {s.value}
                </div>
                <div className="mt-1 text-xs text-white/40">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How OwlSight works — three-step ── */}
        <section className="mb-20">
          <div className="mb-12 text-center">
            <p className="text-xs uppercase tracking-[0.32em] text-white/35">How it works</p>
            <h2 className="mt-4 text-3xl font-semibold text-white">
              From intent to execution in seconds
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {[
              {
                step: "01",
                title: "Express your intent",
                body: "Type what you want to do — swap, bridge, convert. OwlSight understands natural language and finds every viable route.",
                accent: "from-solviolet/20 to-transparent",
                dot: "bg-solviolet",
              },
              {
                step: "02",
                title: "Simulation runs",
                body: "500 Monte Carlo paths stress-test slippage, latency, and price drift. You see the probability of profit, not just a surface-level price gap.",
                accent: "from-purple-600/20 to-transparent",
                dot: "bg-purple-400",
              },
              {
                step: "03",
                title: "Decide with confidence",
                body: "OwlSight surfaces a risk-adjusted recommendation, execution score, and full cost breakdown. Then execute — or don't.",
                accent: "from-solmint/15 to-transparent",
                dot: "bg-solmint",
              },
            ].map((item) => (
              <div
                key={item.step}
                className={`card-lift panel relative overflow-hidden p-7`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${item.accent} opacity-50`}
                />
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${item.dot}`} />
                    <span className="font-mono text-xs text-white/30">
                      Step {item.step}
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/50">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature grid ── */}
        <section className="mb-20">
          <div className="mb-12 text-center">
            <p className="text-xs uppercase tracking-[0.32em] text-white/35">
              What OwlSight does
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white">
              Execution intelligence at every layer
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/45">
              Built for traders who want to understand execution, not just react
              to price movement.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className={`card-lift panel p-6 delay-${(i + 1) * 100} animate-fade-in-up`}
                >
                  <div className="inline-flex rounded-xl border border-solviolet/25 bg-solviolet/10 p-2.5">
                    <Icon className="h-4 w-4 text-solviolet" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">
                    {feat.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-7 text-white/50">{feat.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── CTA section ── */}
        <section className="mb-20">
          <div className="panel relative overflow-hidden p-10 text-center lg:p-16">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-20 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-solviolet opacity-10 blur-[80px]" />
              <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-solmint opacity-[0.07] blur-[60px]" />
            </div>
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.32em] text-white/35">
                Get started
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                Analyse your first trade
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-white/45">
                Launch OwlSight, type what you want to do, and see a full
                execution simulation in under five seconds.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/app"
                  className="btn-gradient inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-sm font-semibold text-white"
                >
                  Open OwlSight
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/how-it-works"
                  className="btn-ghost rounded-full px-6 py-4 text-sm font-semibold"
                >
                  Explore architecture
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
