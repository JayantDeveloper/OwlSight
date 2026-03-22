import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Layers3,
  Radar,
  ShieldCheck,
  TrendingUp,
  Waves,
} from "lucide-react";

const pipeline = [
  {
    title: "Market signals",
    detail:
      "Live-aware price inputs from CoinGecko, Birdeye, or stable mock snapshots anchor the product to reality.",
    icon: Waves,
  },
  {
    title: "Opportunity detection",
    detail:
      "Cross-chain routes are scanned for price gaps before any execution decision is made.",
    icon: Radar,
  },
  {
    title: "Execution simulation",
    detail:
      "Fees, slippage, bridge latency, and route decay are modelled. 500 Monte Carlo paths quantify the outcome distribution.",
    icon: Layers3,
  },
  {
    title: "Decision engine",
    detail:
      "Each route is scored and filtered. Bad trades are blocked before they reach execution.",
    icon: TrendingUp,
  },
  {
    title: "Execution handoff",
    detail:
      "Approved trades route to Hummingbot paper trading or graceful mock fallback while preserving the product flow.",
    icon: Bot,
  },
];

const explainerCards = [
  {
    title: "Why live data matters",
    body: "CoinGecko and Birdeye keep the product aware of current prices while a stable internal market matrix keeps the simulation reliable.",
    icon: Waves,
  },
  {
    title: "Why Monte Carlo matters",
    body: "A price gap is not enough. 500 simulated execution paths reveal the actual probability distribution of outcome before you commit.",
    icon: BarChart3,
  },
  {
    title: "Why failover matters",
    body: "If a provider or execution surface disappears, the product degrades gracefully rather than collapsing mid-flow.",
    icon: ShieldCheck,
  },
];

const marketProviders = [
  {
    name: "CoinGecko",
    logoSrc: "/coingeckologo.png",
    usage:
      "Broad live-price anchor across major assets, so route discovery starts from current market reality.",
  },
  {
    name: "Birdeye",
    logoSrc: "/birdeyelogo.png",
    usage:
      "Chain-native price anchor that sharpens route-level inputs for tighter cross-chain comparisons.",
  },
];

export function ArchitecturePage() {
  return (
    <main className="relative overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-48 top-0 h-[500px] w-[500px] rounded-full bg-solviolet opacity-[0.07] blur-[120px]" />
        <div className="absolute -right-32 top-1/2 h-[400px] w-[400px] rounded-full bg-solmint opacity-[0.05] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Hero ── */}
        <section className="animate-fade-in-up panel p-8 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-4xl">
              <p className="text-[10px] uppercase tracking-[0.32em] text-white/35">
                How It Works
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                A smarter execution flow built around probabilistic intelligence
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-white/45">
                OwlSight does not just react to price differences. It asks
                whether the trade is still worth making after 500 simulated
                execution paths have modelled all the friction.
              </p>
            </div>
            <Link
              href="/app"
              className="btn-gradient inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white"
            >
              Analyse a trade
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* ── Pipeline ── */}
        <section className="animate-fade-in-up delay-100 panel p-6 lg:p-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">
              Product pipeline
            </p>
            <h2 className="mt-4 text-2xl font-semibold text-white">
              Five stages from market movement to execution
            </h2>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-5">
            {pipeline.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className={`card-lift animate-fade-in-up relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 delay-${index * 100 + 100}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex rounded-xl border border-solviolet/25 bg-solviolet/10 p-2">
                      <Icon className="h-4 w-4 text-solviolet" />
                    </div>
                    <span className="text-[9px] uppercase tracking-[0.24em] text-white/25">
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-white/80">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-white/40">{step.detail}</p>
                  {index < pipeline.length - 1 && (
                    <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-white/15 xl:block" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Market + Safety ── */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="animate-fade-in-up delay-100 panel p-6">
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">
              Live market intelligence
            </p>
            <h2 className="mt-4 text-xl font-semibold text-white">
              How CoinGecko and Birdeye are used
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/45">
              Both providers anchor live prices, and OwlSight falls back to
              deterministic mock data if either feed is unavailable.
            </p>
            <div className="mt-5 grid gap-3">
              {marketProviders.map((provider) => (
                <div
                  key={provider.name}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-4"
                >
                  <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white/75">
                        {provider.name}
                      </p>
                      <p className="mt-1.5 text-xs leading-6 text-white/40">
                        {provider.usage}
                      </p>
                    </div>
                    <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] p-1.5">
                      <div className="relative h-full w-full">
                        <Image
                          src={provider.logoSrc}
                          alt={`${provider.name} logo`}
                          fill
                          sizes="112px"
                          className="object-contain object-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
              <p className="text-xs text-white/38">
                Deterministic internal snapshots keep simulation behavior stable
                during demos and local development.
              </p>
            </div>
          </div>

          <div className="animate-fade-in-up delay-200 panel p-6">
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">
              Execution safety
            </p>
            <h2 className="mt-4 text-xl font-semibold text-white">
              Paper trade when ready, graceful failover when not
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/40">
              When a route survives the decision engine, it can hand to
              Hummingbot paper execution. If unavailable, the platform falls
              back cleanly and shows what would have happened.
            </p>
            <div className="mt-5 grid gap-3">
              {[
                {
                  title: "Paper-trade-first",
                  body: "Keeps execution safe while still showing a credible trading stack.",
                },
                {
                  title: "Safety net built in",
                  body: "Provider and execution failover are resilience features, not broken states.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-4">
                  <p className="text-xs font-semibold text-white/65">{item.title}</p>
                  <p className="mt-1.5 text-xs text-white/35">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Explainer cards ── */}
        <section className="grid gap-4 md:grid-cols-3">
          {explainerCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={`card-lift animate-fade-in-up panel p-6 delay-${i * 100 + 100}`}
              >
                <div className="inline-flex rounded-xl border border-solviolet/25 bg-solviolet/10 p-2.5">
                  <Icon className="h-4 w-4 text-solviolet" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">{card.title}</h3>
                <p className="mt-2.5 text-sm leading-7 text-white/45">{card.body}</p>
              </div>
            );
          })}
        </section>

      </div>
    </main>
  );
}
