"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ── Sidebar nav ───────────────────────────────────────────────────────────────

const sections = [
  { id: "overview",    label: "Overview" },
  { id: "architecture", label: "Architecture" },
  { id: "signals",     label: "Signal Detection" },
  { id: "feasibility", label: "Feasibility Engine" },
  { id: "execution",   label: "Execution Layer" },
  { id: "guardrails",  label: "Safety & Guardrails" },
  { id: "dashboard",   label: "Dashboard & History" },
];

function DocSidebar({ active }: { active: string }) {
  return (
    <nav className="flex flex-col gap-0.5">
      <p className="mb-3 text-[10px] uppercase tracking-[0.26em]" style={{ color: "var(--txt-4)" }}>
        On this page
      </p>
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className="rounded-lg px-3 py-1.5 text-sm transition-colors"
          style={{
            color: active === s.id ? "var(--txt-1)" : "var(--txt-3)",
            background: active === s.id ? "var(--surface-3)" : "transparent",
            fontWeight: active === s.id ? 600 : 400,
          }}
        >
          {s.label}
        </a>
      ))}
    </nav>
  );
}

// ── Shared doc primitives ─────────────────────────────────────────────────────

function SectionHeader({ num, title, subtitle }: { num: string; title: string; subtitle: string }) {
  return (
    <div className="mb-8 flex items-start gap-5">
      <span className="shrink-0 select-none font-mono text-6xl font-bold leading-none" style={{ color: "var(--txt-4)", opacity: 0.18 }}>
        {num}
      </span>
      <div className="pt-1">
        <h2 className="text-2xl font-semibold" style={{ color: "var(--txt-1)" }}>{title}</h2>
        <p className="mt-1.5 text-sm" style={{ color: "var(--txt-3)" }}>{subtitle}</p>
      </div>
    </div>
  );
}

function Callout({ tone = "neutral", children }: { tone?: "neutral" | "positive" | "warning"; children: React.ReactNode }) {
  const colors = {
    neutral:  { border: "rgba(153,69,255,0.35)", bg: "rgba(153,69,255,0.06)", bar: "#9945FF" },
    positive: { border: "rgba(20,241,149,0.3)",  bg: "rgba(20,241,149,0.05)", bar: "#14F195" },
    warning:  { border: "rgba(245,158,11,0.3)",  bg: "rgba(245,158,11,0.06)", bar: "#F59E0B" },
  }[tone];
  return (
    <div
      className="flex gap-3 rounded-xl px-4 py-3 text-sm leading-7"
      style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: "var(--txt-2)" }}
    >
      <span className="mt-2 h-[calc(100%-1rem)] w-0.5 shrink-0 rounded-full" style={{ background: colors.bar, alignSelf: "stretch" }} />
      <div>{children}</div>
    </div>
  );
}

function DocTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "var(--surface-3)", borderBottom: "1px solid var(--border)" }}>
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--txt-4)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{
                background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
                borderBottom: i < rows.length - 1 ? "1px solid var(--border-sm)" : "none",
              }}
            >
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3" style={{ color: j === 0 ? "var(--txt-1)" : "var(--txt-2)" }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre
      className="overflow-x-auto rounded-xl px-4 py-3 font-mono text-xs leading-6"
      style={{ background: "var(--terminal-bg)", border: "1px solid var(--border)", color: "var(--txt-2)" }}
    >
      {children}
    </pre>
  );
}

function DocSection({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-16 scroll-mt-24">
      {children}
    </section>
  );
}

// ── Architecture page ─────────────────────────────────────────────────────────

export function ArchitecturePage() {
  const [active, setActive] = useState("overview");

  // IntersectionObserver to track which section is in view
  const observerRef = useRef<IntersectionObserver | null>(null);
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <main className="relative overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-48 top-0 h-[500px] w-[500px] rounded-full bg-solviolet opacity-[0.06] blur-[120px]" />
        <div className="absolute -right-32 top-1/2 h-[400px] w-[400px] rounded-full bg-solmint opacity-[0.04] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Page hero */}
        <div className="mb-10 flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight" style={{ color: "var(--txt-1)" }}>
              How OwlSight Works
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7" style={{ color: "var(--txt-3)" }}>
              A complete walkthrough of the execution intelligence pipeline — from market signal
              ingestion to Hummingbot trade handoff.
            </p>
          </div>
          <Link
            href="/app"
            className="btn-gradient inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white"
          >
            Open OwlSight
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-12">

          {/* Sticky sidebar */}
          <aside className="hidden shrink-0 md:block md:w-44 lg:w-52">
            <div className="sticky top-24">
              <DocSidebar active={active} />
            </div>
          </aside>

          {/* Content */}
          <div className="min-w-0 flex-1">

            {/* § Overview */}
            <DocSection id="overview">
              <SectionHeader
                num="01"
                title="Overview"
                subtitle="What OwlSight does and why it exists"
              />
              <div className="space-y-4 text-sm leading-7" style={{ color: "var(--txt-2)" }}>
                <p>
                  Cross-chain arbitrage is opaque. A visible price gap between two chains does not
                  tell a trader whether the trade is worth making after bridge fees, slippage, and
                  latency are accounted for. Most tooling stops at the surface spread — OwlSight
                  starts there.
                </p>
                <p>
                  OwlSight is an execution intelligence layer that sits <em>above</em> a trading
                  engine. It detects route candidates, scores them against real cost models, runs
                  probabilistic simulation, and only hands approved trades to the execution layer.
                </p>
                <Callout tone="positive">
                  <strong>Core principle:</strong> OwlSight never touches funds. It reasons, then routes.
                  Capital movement is always delegated to Hummingbot, which operates in paper-trade
                  mode by default.
                </Callout>
                <p>
                  The pipeline has four distinct stages: <strong>detect</strong> (find price dislocations),
                  {" "}<strong>score</strong> (run feasibility simulation), <strong>decide</strong> (apply
                  guardrails), and <strong>execute</strong> (hand off to Hummingbot). Each stage is a
                  hard gate — a route that fails scoring never reaches execution.
                </p>
              </div>
            </DocSection>

            {/* § Architecture */}
            <DocSection id="architecture">
              <SectionHeader
                num="02"
                title="Architecture"
                subtitle="System layers and ownership boundaries"
              />
              <div className="space-y-6">
                <Code>{`Market Data Providers
          │
          ▼
  Opportunity Engine       ← detects price dislocations across chains
          │
          ▼
  Feasibility Engine       ← models bridge costs, slippage, latency
          │
          ▼
  Decision Gate            ← applies guardrails, produces approve/reject
          │
          ▼
  Hummingbot Adapter       ← builds TradeExecutionRequest, submits to HB
          │
          ▼
  Hummingbot (paper trade) ← executes on binance_paper_trade connector`}</Code>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div
                    className="rounded-xl p-4"
                    style={{ background: "rgba(153,69,255,0.06)", border: "1px solid rgba(153,69,255,0.2)" }}
                  >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "#c084fc" }}>OwlSight owns</p>
                    <ul className="space-y-1 text-sm" style={{ color: "var(--txt-2)" }}>
                      <li>· Market data ingestion and normalisation</li>
                      <li>· Cross-chain opportunity detection</li>
                      <li>· Monte Carlo feasibility simulation</li>
                      <li>· Confidence scoring and guardrail filtering</li>
                      <li>· Trade request construction</li>
                    </ul>
                  </div>
                  <div
                    className="rounded-xl p-4"
                    style={{ background: "rgba(20,241,149,0.05)", border: "1px solid rgba(20,241,149,0.18)" }}
                  >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "#14F195" }}>Hummingbot owns</p>
                    <ul className="space-y-1 text-sm" style={{ color: "var(--txt-2)" }}>
                      <li>· Order placement and market interaction</li>
                      <li>· Exchange connectivity (paper or live)</li>
                      <li>· Position and balance management</li>
                      <li>· Bridge and DEX transaction submission</li>
                      <li>· Settlement and confirmation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </DocSection>

            {/* § Signal Detection */}
            <DocSection id="signals">
              <SectionHeader
                num="03"
                title="Signal Detection"
                subtitle="How market data enters the system"
              />
              <div className="space-y-5 text-sm leading-7" style={{ color: "var(--txt-2)" }}>
                <p>
                  OwlSight ingests prices from one of three providers, selected at startup via the
                  {" "}<code className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--surface-3)" }}>MARKET_DATA_PROVIDER</code> environment variable.
                  Each provider is an interchangeable adapter — the opportunity engine receives a
                  normalised quote regardless of source.
                </p>
                <DocTable
                  headers={["Provider", "Type", "Refresh", "Used For"]}
                  rows={[
                    ["CoinGecko", "REST API", "20s (configurable)", "Broad live price anchor across major assets"],
                    ["Birdeye",   "REST API", "20s (configurable)", "Chain-native Solana / Solana-ecosystem prices"],
                    ["Mock",      "Internal", "Deterministic",      "Stable demo snapshots with realistic jitter"],
                  ]}
                />
                <Callout>
                  Live providers apply a small deterministic jitter to mock chain-level quotes so that
                  the spread between venues stays realistic even when the external price feed is a
                  single aggregate number.
                </Callout>
                <p>
                  Four chains are supported: <strong>Solana</strong>, <strong>Base</strong>,{" "}
                  <strong>Ethereum</strong>, and <strong>Arbitrum</strong>. Venues covered include
                  Jupiter (Solana), Aerodrome (Base), Uniswap V3 (Ethereum / Base), and Camelot
                  (Arbitrum). Assets tracked: SOL, ETH, WBTC.
                </p>
              </div>
            </DocSection>

            {/* § Feasibility Engine */}
            <DocSection id="feasibility">
              <SectionHeader
                num="04"
                title="Feasibility Engine"
                subtitle="How OwlSight turns a spread into an expected net profit"
              />
              <div className="space-y-5 text-sm leading-7" style={{ color: "var(--txt-2)" }}>
                <p>
                  A raw price gap between two chains is necessary but not sufficient for a profitable
                  trade. The feasibility engine deducts trading fees, bridge fees, slippage, and a
                  latency penalty from the gross spread to produce an <strong>expected net profit</strong>.
                </p>

                <h3 className="text-base font-semibold" style={{ color: "var(--txt-1)" }}>Bridge cost profiles</h3>
                <DocTable
                  headers={["Bridge", "Route", "Latency", "Fee (bps)", "Reliability"]}
                  rows={[
                    ["Wormhole", "Solana → Ethereum",  "240s", "13", "0.84"],
                    ["Wormhole", "Solana → Base",       "95s",  "10", "0.93"],
                    ["Wormhole", "Solana → Arbitrum",   "135s", "11", "0.90"],
                    ["Across",   "Base → Ethereum",     "75s",  "8",  "0.95"],
                    ["Across",   "Arbitrum → Ethereum", "90s",  "9",  "0.92"],
                  ]}
                />

                <h3 className="text-base font-semibold" style={{ color: "var(--txt-1)" }}>Monte Carlo simulation</h3>
                <p>
                  For every candidate route, the engine runs 500 simulated execution paths. Each path
                  samples from a slippage distribution (seeded from the route&apos;s liquidity depth),
                  applies bridge latency variance, and models price drift over the expected execution
                  window. The output is a profit distribution with three key percentiles:
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "P10", desc: "Pessimistic outcome — 10% of paths are worse than this", color: "#F59E0B" },
                    { label: "P50", desc: "Median expected outcome across all simulated paths",       color: "#9945FF" },
                    { label: "P90", desc: "Optimistic outcome — 10% of paths are better than this",  color: "#14F195" },
                  ].map((p) => (
                    <div
                      key={p.label}
                      className="rounded-xl px-4 py-3"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                    >
                      <p className="text-lg font-bold" style={{ color: p.color }}>{p.label}</p>
                      <p className="mt-1 text-xs leading-5" style={{ color: "var(--txt-3)" }}>{p.desc}</p>
                    </div>
                  ))}
                </div>

                <h3 className="text-base font-semibold" style={{ color: "var(--txt-1)" }}>Confidence score</h3>
                <p>
                  The confidence score (0–1) is a composite of three factors: the probability that
                  net profit exceeds the minimum threshold (P(profit)), the bridge reliability score
                  for the route&apos;s bridge pair, and a slippage penalty that reduces confidence as
                  estimated slippage rises. A score of 0.68 or above is required for approval.
                </p>
              </div>
            </DocSection>

            {/* § Execution Layer */}
            <DocSection id="execution">
              <SectionHeader
                num="05"
                title="Execution Layer"
                subtitle="How approved routes reach Hummingbot"
              />
              <div className="space-y-5 text-sm leading-7" style={{ color: "var(--txt-2)" }}>
                <p>
                  Hummingbot is the executor, not the strategist. OwlSight&apos;s adapter converts an
                  approved opportunity into a <code className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--surface-3)" }}>TradeExecutionRequest</code> — a structured
                  payload that contains everything Hummingbot needs to act, along with guardrail
                  constraints it must respect.
                </p>

                <DocTable
                  headers={["Mode", "Behaviour", "Hummingbot required"]}
                  rows={[
                    ["mock",            "Writes request artifact to disk, simulates execution lifecycle locally",  "No"],
                    ["paper_hummingbot","Submits to Hummingbot Gateway at configured URL; falls back to mock",      "Yes (Gateway)"],
                    ["live (future)",   "Real capital execution via live connector",                               "Yes (live keys)"],
                  ]}
                />

                <h3 className="text-base font-semibold" style={{ color: "var(--txt-1)" }}>The handoff contract</h3>
                <Code>{`TradeExecutionRequest {
  request_id          // unique ID written to hummingbot/requests/
  opportunity_id      // links back to the scored route
  asset_symbol        // SOL | ETH | WBTC
  symbol              // trading pair, e.g. "SOL-USDT"
  side                // "buy_then_bridge_then_sell"
  source_chain        // where the buy happens
  source_venue        // DEX on source chain
  destination_chain   // where the sell happens
  destination_venue   // DEX on destination chain
  bridge_name         // Wormhole | Across
  notional_usd        // trade size in USD
  asset_amount        // asset quantity
  paper_trade         // always true in current deployment
  guardrails {
    max_slippage_bps       // hard cap on acceptable slippage
    min_net_profit_usd     // reject if expected profit below this
    min_confidence_score   // reject if confidence below this
  }
}`}</Code>

                <Callout tone="positive">
                  <strong>Graceful fallback:</strong> If Hummingbot is unreachable or no compatible
                  endpoint accepts the request, the adapter automatically falls back to mock execution.
                  The frontend shows a FALLBACK badge and explains why. The demo never breaks.
                </Callout>
              </div>
            </DocSection>

            {/* § Safety & Guardrails */}
            <DocSection id="guardrails">
              <SectionHeader
                num="06"
                title="Safety & Guardrails"
                subtitle="Hard filters that protect capital and maintain demo integrity"
              />
              <div className="space-y-5 text-sm leading-7" style={{ color: "var(--txt-2)" }}>
                <p>
                  Three mandatory guardrails are evaluated before any route reaches the execution
                  adapter. A route that fails any single guardrail is marked <strong>rejected</strong>
                  — it appears in the UI with a rejection reason but is never submitted to Hummingbot.
                </p>

                <DocTable
                  headers={["Guardrail", "Default", "What it prevents"]}
                  rows={[
                    ["Minimum confidence score", "0.68",   "Statistically weak or high-variance routes"],
                    ["Minimum net profit",        "$75 USD", "Trades where costs consume the opportunity"],
                    ["Maximum slippage",          "Route bps + 4 buffer", "Execution that exceeds liquidity depth"],
                  ]}
                />

                <Callout tone="warning">
                  A <strong>rejected</strong> route is not an error — it is the system working correctly.
                  OwlSight surfaces rejections in the UI so traders understand exactly which threshold
                  a route failed and by how much.
                </Callout>

                <h3 className="text-base font-semibold" style={{ color: "var(--txt-1)" }}>Paper-trade-first policy</h3>
                <p>
                  All executions in the current deployment use <code className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--surface-3)" }}>binance_paper_trade</code> as
                  the Hummingbot connector. This means no real capital is ever at risk. The full
                  execution stack — intent, simulation, decision, handoff — runs as a credible, safe
                  demonstration of what live trading would look like.
                </p>
                <p>
                  The configuration flag <code className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--surface-3)" }}>HUMMINGBOT_PAPER_TRADE=true</code> must be set for
                  execution to proceed. The backend refuses to submit to a live connector unless
                  paper-trade mode is explicitly disabled by an operator.
                </p>
              </div>
            </DocSection>

            {/* § Dashboard & History */}
            <DocSection id="dashboard">
              <SectionHeader
                num="07"
                title="Dashboard & History"
                subtitle="Persistent record of every simulation and execution run"
              />
              <div className="space-y-5 text-sm leading-7" style={{ color: "var(--txt-2)" }}>
                <p>
                  OwlSight persists every execution automatically. When a trade reaches a terminal
                  state — approved, rejected, or fallback — the frontend saves both the opportunity
                  snapshot and the execution record to a local database via Prisma. No backend
                  changes are required; the Next.js layer handles all persistence.
                </p>

                <h3 className="text-base font-semibold" style={{ color: "var(--txt-1)" }}>Auto-save on execution</h3>
                <p>
                  The runtime hook monitors execution state. The moment <code className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--surface-3)" }}>terminal: true</code> is
                  received from the backend, two records are written:
                </p>
                <DocTable
                  headers={["Record", "Trigger", "What is stored"]}
                  rows={[
                    ["SavedSimulation", "Execution becomes terminal", "Asset, route, confidence, P&L, Monte Carlo result, cost breakdown"],
                    ["ExecutionRecord",  "Execution becomes terminal", "Execution ID, mode, status, timeline events, fallback reason"],
                  ]}
                />

                <Callout tone="neutral">
                  A deduplication ref (<code className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--surface-3)" }}>savedExecutionIds</code>) prevents
                  the same execution from being written twice if polling briefly fires after terminal
                  state is reached.
                </Callout>

                <h3 className="text-base font-semibold" style={{ color: "var(--txt-1)" }}>Bookmarking from Mission Control</h3>
                <p>
                  In addition to auto-save, traders can bookmark any opportunity card manually using
                  the <strong>Save Simulation</strong> button in the right panel. The button
                  confirms with a green checkmark and the simulation appears immediately in the
                  Simulation Library.
                </p>

                <h3 className="text-base font-semibold" style={{ color: "var(--txt-1)" }}>Dashboard overview</h3>
                <p>
                  The dashboard at <code className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--surface-3)" }}>/dashboard</code> renders a command-center
                  summary:
                </p>
                <DocTable
                  headers={["Widget", "Description"]}
                  rows={[
                    ["Hero stats bar",        "Total simulations saved, executions run, approval rate, estimated net P&L"],
                    ["Recent Executions",     "Last 5 records with asset, route, P&L (color-coded), status badge, and relative timestamp"],
                    ["Pinned Simulations",    "Up to 3 pinned route cards for quick comparison"],
                    ["Quick Actions",         "Direct links: Mission Control, History, Simulations, Wallets, Settings"],
                  ]}
                />

                <h3 className="text-base font-semibold" style={{ color: "var(--txt-1)" }}>Execution History</h3>
                <p>
                  The full history at <code className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--surface-3)" }}>/dashboard/history</code> provides a
                  filterable table with progressive disclosure — rows are collapsed by default.
                  Clicking any row expands a detail panel showing the full timeline, cost breakdown,
                  and rejection or fallback reason.
                </p>
                <p>
                  Filters are all client-side for instant feedback: status (completed / rejected /
                  fallback), asset symbol, date range, and sort order. An <strong>Export CSV</strong>{" "}
                  button downloads the visible rows as <code className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--surface-3)" }}>owlsight-executions.csv</code> for
                  tax or P&L analysis.
                </p>

                <h3 className="text-base font-semibold" style={{ color: "var(--txt-1)" }}>Simulation Library</h3>
                <p>
                  The library at <code className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--surface-3)" }}>/dashboard/simulations</code> shows all saved
                  route snapshots as cards. Each card shows a confidence bar, color-coded net P&L,
                  slippage, fees, bridge latency, and approval status.
                </p>
                <DocTable
                  headers={["Feature", "Behaviour"]}
                  rows={[
                    ["Pin / unpin",     "Marks a simulation as pinned; pinned cards appear in the dashboard overview"],
                    ["Notes",           "Free-text annotation saved on blur via PATCH /api/simulations/[id]"],
                    ["Delete",          "Removes the card with a confirmation prompt; cascades to linked execution records"],
                    ["Export CSV",      "Downloads all visible simulations as owlsight-simulations.csv"],
                  ]}
                />

                <Callout tone="positive">
                  P&L values are consistently color-coded throughout the dashboard: positive profit
                  renders in <strong style={{ color: "#14F195" }}>solmint green</strong>, zero or
                  negative values render in muted text. This makes the financial impact of each
                  route immediately scannable.
                </Callout>
              </div>
            </DocSection>

          </div>
        </div>
      </div>
    </main>
  );
}
