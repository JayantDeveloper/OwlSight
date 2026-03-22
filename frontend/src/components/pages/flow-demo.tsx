"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ── Stage data ────────────────────────────────────────────────────────────────

const STAGES = [
  { id: "wallet",    num: "01", title: "Connect Wallet",         sub: "Link Solana or EVM wallet" },
  { id: "intent",    num: "02", title: "Express Intent",         sub: "Type what you want to trade" },
  { id: "signals",   num: "03", title: "Signal Detection",       sub: "Live prices across chains" },
  { id: "routes",    num: "04", title: "Route Discovery",        sub: "Ranking viable cross-chain routes" },
  { id: "simulate",  num: "05", title: "Simulation",             sub: "500 Monte Carlo paths running" },
  { id: "matrix",    num: "06", title: "Route Intelligence",     sub: "Multi-metric convergence analysis" },
  { id: "decision",  num: "07", title: "Decision Engine",        sub: "Guardrails applied, verdict issued" },
  { id: "execution", num: "08", title: "Execution Handoff",      sub: "Trade submitted to Hummingbot" },
];

const INTERVAL_MS = 3800;

// ── Stage mockups ─────────────────────────────────────────────────────────────

// ── Wallet Connect stage ──────────────────────────────────────────────────────

function WalletStage() {
  const [phase, setPhase] = useState<"select" | "connecting" | "connected">("select");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("connecting"), 900);
    const t2 = setTimeout(() => setPhase("connected"),  2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const wallets = [
    { name: "Phantom",   chain: "Solana", color: "#9945FF", bg: "rgba(153,69,255,0.12)", initial: "P" },
    { name: "MetaMask",  chain: "EVM",    color: "#F6851B", bg: "rgba(246,133,27,0.12)",  initial: "M" },
    { name: "Rainbow",   chain: "EVM",    color: "#818CF8", bg: "rgba(129,140,248,0.12)", initial: "R" },
  ];

  const chains = ["Solana", "Ethereum", "Base", "Arbitrum"];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5">
      <div
        className="w-full max-w-xs rounded-2xl p-5"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <p className="mb-1 text-center text-sm font-semibold" style={{ color: "var(--txt-1)" }}>
          Connect Your Wallet
        </p>
        <p className="mb-5 text-center text-xs" style={{ color: "var(--txt-3)" }}>
          Supports Solana and EVM networks
        </p>

        {phase === "select" && (
          <div className="flex flex-col gap-2">
            {wallets.map((w) => (
              <div
                key={w.name}
                className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
                style={{ background: w.bg, border: `1px solid ${w.color}30` }}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{ background: w.color, color: "#fff" }}
                >
                  {w.initial}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--txt-1)" }}>{w.name}</p>
                  <p className="text-[10px]" style={{ color: "var(--txt-3)" }}>{w.chain}</p>
                </div>
                <div className="ml-auto">
                  <span className="text-[10px]" style={{ color: "var(--txt-4)" }}>→</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {phase === "connecting" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold"
              style={{ background: "rgba(153,69,255,0.15)", border: "1px solid rgba(153,69,255,0.4)" }}
            >
              P
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#9945FF" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <p className="text-sm" style={{ color: "var(--txt-2)" }}>Connecting to Phantom…</p>
            </div>
            <p className="text-xs" style={{ color: "var(--txt-4)" }}>Approve in your wallet extension</p>
          </div>
        )}

        {phase === "connected" && (
          <div className="flex flex-col gap-3">
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "rgba(20,241,149,0.07)", border: "1px solid rgba(20,241,149,0.25)" }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={{ background: "#9945FF", color: "#fff" }}
              >
                P
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold" style={{ color: "var(--txt-1)" }}>Phantom</span>
                  <span className="text-[10px]" style={{ color: "#14F195" }}>● Connected</span>
                </div>
                <p className="font-mono text-[10px]" style={{ color: "var(--txt-3)" }}>7xKX…9mQP</p>
              </div>
            </div>
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "rgba(246,133,27,0.07)", border: "1px solid rgba(246,133,27,0.2)" }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={{ background: "#F6851B", color: "#fff" }}
              >
                M
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold" style={{ color: "var(--txt-1)" }}>MetaMask</span>
                  <span className="text-[10px]" style={{ color: "#14F195" }}>● Connected</span>
                </div>
                <p className="font-mono text-[10px]" style={{ color: "var(--txt-3)" }}>0x4f2…8a3c</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {chains.map((c) => (
                <span
                  key={c}
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: "var(--surface-3)", color: "var(--txt-2)", border: "1px solid var(--border)" }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Intent Typing stage ───────────────────────────────────────────────────────

const INTENT_TEXT = "Swap 2 ETH from Ethereum to Solana with best execution";

function IntentStage() {
  const [displayed, setDisplayed] = useState("");
  const [analysing, setAnalysing] = useState(false);

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplayed(INTENT_TEXT.slice(0, i));
      if (i >= INTENT_TEXT.length) {
        clearInterval(t);
        setTimeout(() => setAnalysing(true), 500);
      }
    }, 42);
    return () => clearInterval(t);
  }, []);

  const suggestions = [
    "Bridge $1000 USDC from Ethereum to Base",
    "Find the best SOL → USDC route",
    "Convert ETH to SOL with lowest slippage",
  ];

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Intent input */}
      <div>
        <p className="mb-2 text-xs font-semibold" style={{ color: "var(--txt-2)" }}>What do you want to do?</p>
        <div
          className="relative min-h-[72px] rounded-xl px-4 py-3 font-mono text-sm"
          style={{
            background: "var(--surface-2)",
            border: "1.5px solid rgba(153,69,255,0.5)",
            boxShadow: "0 0 0 3px rgba(153,69,255,0.10)",
            color: "var(--txt-1)",
          }}
        >
          {displayed}
          {!analysing && (
            <span
              className="ml-px inline-block h-[1em] w-[2px] align-middle"
              style={{
                background: "#9945FF",
                animation: "cursorBlink 1s step-end infinite",
              }}
            />
          )}
        </div>
      </div>

      {/* Analysing state */}
      {analysing ? (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: "rgba(153,69,255,0.08)", border: "1px solid rgba(153,69,255,0.25)" }}
        >
          <svg className="h-4 w-4 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="#9945FF" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div>
            <p className="text-xs font-semibold" style={{ color: "#c084fc" }}>Analysing intent…</p>
            <p className="text-[10px]" style={{ color: "var(--txt-3)" }}>Scanning 6 routes across Ethereum, Solana, Base</p>
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-2 text-[10px]" style={{ color: "var(--txt-4)" }}>Try an example:</p>
          <div className="flex flex-col gap-1.5">
            {suggestions.map((s) => (
              <div
                key={s}
                className="rounded-lg px-3 py-2 text-xs"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--txt-3)" }}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parsed intent chips */}
      {analysing && (
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Asset", value: "ETH" },
            { label: "From",  value: "Ethereum" },
            { label: "To",    value: "Solana" },
            { label: "Amount", value: "2 ETH" },
            { label: "Routes", value: "6 found" },
          ].map((chip) => (
            <div
              key={chip.label}
              className="rounded-lg px-2.5 py-1.5"
              style={{ background: "var(--surface-3)", border: "1px solid var(--border)" }}
            >
              <p className="text-[9px] uppercase tracking-widest" style={{ color: "var(--txt-4)" }}>{chip.label}</p>
              <p className="text-xs font-semibold" style={{ color: "var(--txt-1)" }}>{chip.value}</p>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes cursorBlink { 0%,100% { opacity:1 } 50% { opacity:0 } }`}</style>
    </div>
  );
}

function Stage1() {
  const rows = [
    { asset: "SOL", chain: "Solana",   venue: "Jupiter",    price: "$172.84", highlight: true },
    { asset: "SOL", chain: "Base",     venue: "Aerodrome",  price: "$171.34", highlight: false },
    { asset: "SOL", chain: "Ethereum", venue: "Uniswap V3", price: "$170.91", highlight: true },
    { asset: "ETH", chain: "Ethereum", venue: "Uniswap V3", price: "$3,421.50", highlight: false },
    { asset: "ETH", chain: "Base",     venue: "Aerodrome",  price: "$3,418.20", highlight: false },
  ];
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold" style={{ color: "var(--txt-2)" }}>Live Market Feed</p>
        <div className="flex items-center gap-1.5">
          <span className="dot-pulse h-1.5 w-1.5 rounded-full bg-[#14F195]" />
          <span className="font-mono text-[10px]" style={{ color: "#14F195" }}>LIVE</span>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr style={{ background: "var(--surface-3)", borderBottom: "1px solid var(--border)" }}>
              {["Asset", "Chain", "Venue", "Price", "Feed"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium" style={{ color: "var(--txt-4)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                style={{
                  background: r.highlight ? "rgba(20,241,149,0.04)" : i % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
                  borderBottom: "1px solid var(--border-sm)",
                }}
              >
                <td className="px-3 py-2 font-semibold" style={{ color: r.highlight ? "#14F195" : "var(--txt-1)" }}>{r.asset}</td>
                <td className="px-3 py-2" style={{ color: "var(--txt-2)" }}>{r.chain}</td>
                <td className="px-3 py-2" style={{ color: "var(--txt-3)" }}>{r.venue}</td>
                <td className="px-3 py-2 tabular-nums" style={{ color: "var(--txt-1)" }}>{r.price}</td>
                <td className="px-3 py-2">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#14F195" }} />
                    <span style={{ color: "#14F195" }}>live</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        className="rounded-lg px-3 py-2 text-[11px]"
        style={{ background: "rgba(20,241,149,0.07)", border: "1px solid rgba(20,241,149,0.2)", color: "#14F195" }}
      >
        ↑ Dislocation detected — SOL spread +193 bps across Solana → Ethereum
      </div>
    </div>
  );
}

function Stage2() {
  const routes = [
    { asset: "SOL", from: "Solana", fromV: "Jupiter", to: "Ethereum", toV: "Uniswap V3", spread: "+193 bps", bridge: "Wormhole", score: 0.84, top: true },
    { asset: "ETH", from: "Base",   fromV: "Aerodrome", to: "Ethereum", toV: "Uniswap V3", spread: "+94 bps", bridge: "Across", score: 0.71, top: false },
    { asset: "WBTC", from: "Solana", fromV: "Jupiter", to: "Arbitrum", toV: "Camelot", spread: "+71 bps", bridge: "Wormhole", score: 0.63, top: false },
  ];
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold" style={{ color: "var(--txt-2)" }}>6 Routes Discovered</p>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-mono" style={{ background: "rgba(153,69,255,0.12)", color: "#c084fc", border: "1px solid rgba(153,69,255,0.25)" }}>Ranked by confidence</span>
      </div>
      <div className="flex flex-col gap-2">
        {routes.map((r) => (
          <div
            key={r.asset + r.from}
            className="rounded-xl px-4 py-3"
            style={{
              background: r.top ? "rgba(20,241,149,0.05)" : "var(--surface-2)",
              border: `1px solid ${r.top ? "rgba(20,241,149,0.2)" : "var(--border)"}`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold" style={{ color: "var(--txt-1)" }}>{r.asset}</span>
                <span className="text-[10px]" style={{ color: "var(--txt-3)" }}>{r.from} → {r.to}</span>
                <span className="text-[10px]" style={{ color: "var(--txt-4)" }}>via {r.bridge}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold" style={{ color: "#14F195" }}>{r.spread}</span>
                <span className="rounded px-1.5 py-0.5 text-[9px] font-mono" style={{ background: "var(--surface-3)", color: "var(--txt-3)" }}>
                  {r.score.toFixed(2)} conf
                </span>
              </div>
            </div>
            <div className="mt-1 text-[10px]" style={{ color: "var(--txt-4)" }}>
              {r.fromV} → {r.toV}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stage3() {
  const bars = [
    { label: "P90", sublabel: "optimistic", value: 412, pct: 100, color: "#14F195" },
    { label: "P50", sublabel: "median",     value: 247, pct: 60,  color: "#9945FF" },
    { label: "P10", sublabel: "pessimistic",value: 89,  pct: 22,  color: "#F59E0B" },
  ];
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold" style={{ color: "var(--txt-2)" }}>Monte Carlo — 500 paths</p>
        <span className="font-mono text-[10px]" style={{ color: "var(--txt-3)" }}>SOL  Solana → Ethereum</span>
      </div>
      <div className="flex flex-col gap-3">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-[10px] font-semibold" style={{ color: b.color }}>{b.label}</span>
              <span className="text-[10px]" style={{ color: "var(--txt-3)" }}>{b.sublabel}</span>
              <span className="font-mono text-xs font-semibold" style={{ color: "var(--txt-1)" }}>${b.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${b.pct}%`, background: b.color, opacity: 0.85 }}
              />
            </div>
          </div>
        ))}
      </div>
      <div
        className="mt-1 rounded-xl px-4 py-3"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px]" style={{ color: "var(--txt-3)" }}>Confidence score</span>
          <span className="font-mono text-xs font-bold" style={{ color: "#14F195" }}>0.84</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
          <div className="h-full rounded-full" style={{ width: "84%", background: "linear-gradient(90deg, #9945FF, #14F195)" }} />
        </div>
        <div className="mt-2 flex gap-4 text-[10px]" style={{ color: "var(--txt-4)" }}>
          <span>Slippage risk: <span style={{ color: "#14F195" }}>LOW</span></span>
          <span>P(profit): <span style={{ color: "#14F195" }}>91%</span></span>
          <span>Sharpe: <span style={{ color: "var(--txt-2)" }}>2.1</span></span>
        </div>
      </div>
    </div>
  );
}

// ── Stage 4: Route Intelligence Matrix (animated SVG line chart) ──────────────

const CHART_W = 480;
const CHART_H = 210;
const PAD = { top: 12, right: 48, bottom: 32, left: 44 };
const PLOT_W = CHART_W - PAD.left - PAD.right;
const PLOT_H = CHART_H - PAD.top - PAD.bottom;

// X: simulation path counts
const X_VALS = [0, 50, 100, 150, 200, 300, 500];
// Y left: net profit USD, domain 0–280
const Y_MAX = 280;
// Y right: confidence 0–1

const ROUTES = [
  { label: "SOL  Sol→Eth",  color: "#14F195", profits: [0, 148, 219, 232, 240, 244, 247], isBest: true },
  { label: "SOL  Sol→Base", color: "#818CF8", profits: [0, 118, 159, 172, 180, 184, 186], isBest: false },
  { label: "ETH  Base→Eth", color: "#9945FF", profits: [0,  96, 124, 132, 137, 140, 142], isBest: false },
  { label: "WBTC Sol→Arb",  color: "#F59E0B", profits: [0,  63,  81,  88,  93,  96,  98], isBest: false },
];
const CONF_VALS = [0, 0.62, 0.74, 0.79, 0.82, 0.83, 0.84];
const BAND_UPPER = [0, 178, 240, 250, 255, 258, 260];
const BAND_LOWER = [0, 118, 198, 214, 225, 230, 234];

function xPos(i: number) {
  return PAD.left + (i / (X_VALS.length - 1)) * PLOT_W;
}
function yProfit(v: number) {
  return PAD.top + PLOT_H - (v / Y_MAX) * PLOT_H;
}
function yConf(v: number) {
  return PAD.top + PLOT_H - v * PLOT_H;
}
function polyline(pts: [number, number][]) {
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}
function pathD(pts: [number, number][]) {
  return pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
}

function Stage4() {
  const lineRefs = useRef<(SVGPolylineElement | null)[]>([]);
  const confRef  = useRef<SVGPolylineElement | null>(null);

  useEffect(() => {
    // Animate each line by setting stroke-dasharray to its length then animating dashoffset to 0
    const animate = (el: SVGPolylineElement | null, delay: number) => {
      if (!el) return;
      const len = el.getTotalLength?.() ?? 300;
      el.style.strokeDasharray  = `${len}`;
      el.style.strokeDashoffset = `${len}`;
      el.style.transition = `stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1) ${delay}ms`;
      requestAnimationFrame(() => { el.style.strokeDashoffset = "0"; });
    };
    ROUTES.forEach((_, i) => animate(lineRefs.current[i], i * 130));
    animate(confRef.current, ROUTES.length * 130 + 80);
  }, []);

  const gridYs = [0, 50, 100, 150, 200, 250];

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Metric chips */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold" style={{ color: "var(--txt-2)" }}>Monte Carlo Convergence</p>
        <div className="flex items-center gap-2">
          {[
            { label: "Confidence", value: "0.84", color: "#14F195" },
            { label: "P50 Profit", value: "+$247",  color: "#14F195" },
            { label: "P(profit)",  value: "91%",    color: "#9945FF" },
          ].map((c) => (
            <span
              key={c.label}
              className="rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold"
              style={{ background: "var(--surface-3)", color: c.color, border: "1px solid var(--border)" }}
            >
              {c.label} {c.value}
            </span>
          ))}
        </div>
      </div>

      {/* SVG chart */}
      <div
        className="relative flex-1 overflow-hidden rounded-xl"
        style={{ background: "var(--terminal-bg)", border: "1px solid var(--border)" }}
      >
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Horizontal grid lines + Y labels */}
          {gridYs.map((v) => {
            const y = yProfit(v);
            return (
              <g key={v}>
                <line x1={PAD.left} y1={y} x2={CHART_W - PAD.right} y2={y}
                  stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <text x={PAD.left - 6} y={y + 4} textAnchor="end"
                  fontSize="9" fill="rgba(255,255,255,0.28)" fontFamily="monospace">
                  ${v}
                </text>
              </g>
            );
          })}

          {/* Right Y axis — confidence */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((v) => {
            const y = yConf(v);
            return (
              <text key={v} x={CHART_W - PAD.right + 6} y={y + 4} textAnchor="start"
                fontSize="9" fill="rgba(255,255,255,0.22)" fontFamily="monospace">
                {Math.round(v * 100)}%
              </text>
            );
          })}

          {/* X axis labels */}
          {X_VALS.map((v, i) => (
            <text key={v} x={xPos(i)} y={CHART_H - 4} textAnchor="middle"
              fontSize="9" fill="rgba(255,255,255,0.25)" fontFamily="monospace">
              {v === 0 ? "0" : v >= 1000 ? `${v / 1000}k` : `${v}`}
            </text>
          ))}
          <text x={CHART_W / 2} y={CHART_H} textAnchor="middle"
            fontSize="8" fill="rgba(255,255,255,0.18)" fontFamily="monospace">
            simulation paths
          </text>

          {/* Uncertainty band (top route) */}
          <polygon
            points={polyline([
              ...BAND_UPPER.map((v, i): [number, number] => [xPos(i), yProfit(v)]),
              ...[...BAND_LOWER].reverse().map((v, i): [number, number] => [xPos(BAND_LOWER.length - 1 - i), yProfit(v)]),
            ])}
            fill="rgba(20,241,149,0.07)"
          />

          {/* Area fill under top route */}
          <polygon
            points={polyline([
              ...ROUTES[0].profits.map((v, i): [number, number] => [xPos(i), yProfit(v)]),
              [xPos(X_VALS.length - 1), yProfit(0)],
              [xPos(0), yProfit(0)],
            ])}
            fill="rgba(20,241,149,0.05)"
          />

          {/* Route profit lines */}
          {ROUTES.map((r, ri) => (
            <polyline
              key={r.label}
              ref={(el) => { lineRefs.current[ri] = el; }}
              points={polyline(r.profits.map((v, i): [number, number] => [xPos(i), yProfit(v)]))}
              fill="none"
              stroke={r.color}
              strokeWidth={r.isBest ? 2 : 1.5}
              strokeOpacity={r.isBest ? 1 : 0.65}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {/* Confidence line (dashed, right axis) */}
          <polyline
            ref={confRef}
            points={polyline(CONF_VALS.map((v, i): [number, number] => [xPos(i), yConf(v)]))}
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* End-point dots */}
          {ROUTES.map((r) => {
            const last = r.profits.length - 1;
            return (
              <circle key={r.label}
                cx={xPos(last)} cy={yProfit(r.profits[last])}
                r={r.isBest ? 3 : 2.5}
                fill={r.color} fillOpacity={r.isBest ? 1 : 0.8}
              />
            );
          })}
          {/* Confidence end dot */}
          <circle
            cx={xPos(CONF_VALS.length - 1)} cy={yConf(CONF_VALS[CONF_VALS.length - 1])}
            r={2.5} fill="rgba(255,255,255,0.55)"
          />

          {/* Best route label at end */}
          <text
            x={xPos(X_VALS.length - 1) + 5}
            y={yProfit(ROUTES[0].profits[ROUTES[0].profits.length - 1]) + 4}
            fontSize="9" fill="#14F195" fontFamily="monospace" fontWeight="600"
          >
            $247
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3">
        {ROUTES.map((r) => (
          <div key={r.label} className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full" style={{ background: r.color, opacity: r.isBest ? 1 : 0.65 }} />
            <span className="text-[10px]" style={{ color: r.isBest ? r.color : "var(--txt-3)" }}>{r.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="h-px w-4" style={{ background: "rgba(255,255,255,0.4)", borderTop: "1px dashed rgba(255,255,255,0.4)" }} />
          <span className="text-[10px]" style={{ color: "var(--txt-4)" }}>Confidence</span>
        </div>
      </div>
    </div>
  );
}

function Stage5() {
  const costs = [
    { label: "Gross spread",   value: "+$286.40", positive: true },
    { label: "Trading fees",   value: "−$12.40",  positive: false },
    { label: "Bridge fee",     value: "−$18.60",  positive: false },
    { label: "Slippage est.",  value: "−$8.20",   positive: false },
  ];
  const guards = ["Min profit $75 ✓", "Confidence ≥ 0.68 ✓", "Slippage ≤ 16 bps ✓"];
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-3">
        <div
          className="rounded-lg px-3 py-1 text-xs font-semibold"
          style={{ background: "rgba(20,241,149,0.1)", border: "1px solid rgba(20,241,149,0.3)", color: "#14F195" }}
        >
          ✓ APPROVED
        </div>
        <p className="text-xs" style={{ color: "var(--txt-3)" }}>SOL — Solana → Ethereum</p>
      </div>
      <div
        className="rounded-xl px-4 py-3 text-center"
        style={{ background: "rgba(20,241,149,0.06)", border: "1px solid rgba(20,241,149,0.15)" }}
      >
        <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--txt-4)" }}>Net profit after costs</p>
        <p className="mt-1 text-2xl font-bold" style={{ color: "#14F195" }}>+$247.20</p>
      </div>
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        {costs.map((c, i) => (
          <div
            key={c.label}
            className="flex items-center justify-between px-4 py-2 text-[11px]"
            style={{
              background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
              borderBottom: i < costs.length - 1 ? "1px solid var(--border-sm)" : "none",
            }}
          >
            <span style={{ color: "var(--txt-3)" }}>{c.label}</span>
            <span className="font-mono font-semibold" style={{ color: c.positive ? "#14F195" : "var(--txt-2)" }}>{c.value}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {guards.map((g) => (
          <span
            key={g}
            className="rounded-full px-2.5 py-1 text-[10px] font-medium"
            style={{ background: "rgba(20,241,149,0.07)", border: "1px solid rgba(20,241,149,0.18)", color: "#14F195" }}
          >
            {g}
          </span>
        ))}
      </div>
    </div>
  );
}

function Stage6() {
  const steps = [
    { label: "Route approved",       detail: "Net profit +$247",    done: true },
    { label: "Request built",        detail: "hbreq-a4f2c1d8b9",    done: true },
    { label: "Submitted to Hummingbot", detail: "paper-demo instance", done: true },
    { label: "Awaiting settlement",  detail: "ETA 95s via Wormhole", done: false },
  ];
  const logs = [
    { time: "12:34:58", dot: "#14F195", lvl: "OK ", src: "exec.engine", msg: "Trade routed to Hummingbot paper-demo" },
    { time: "12:34:58", dot: "rgba(255,255,255,0.18)", lvl: "INF", src: "bridge",      msg: "Wormhole initiated — ETA 95s" },
    { time: "12:34:57", dot: "#14F195", lvl: "OK ", src: "feasibility", msg: "Route approved — confidence 0.84" },
  ];
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold" style={{ color: "var(--txt-2)" }}>Execution Timeline</p>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-mono"
          style={{ background: "rgba(153,69,255,0.12)", color: "#c084fc", border: "1px solid rgba(153,69,255,0.25)" }}
        >
          Paper Trade
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]"
              style={{
                background: s.done ? "rgba(20,241,149,0.15)" : "var(--surface-3)",
                border: `1px solid ${s.done ? "rgba(20,241,149,0.4)" : "var(--border)"}`,
                color: s.done ? "#14F195" : "var(--txt-4)",
              }}
            >
              {s.done ? "✓" : "○"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium" style={{ color: s.done ? "var(--txt-1)" : "var(--txt-3)" }}>{s.label}</p>
              <p className="text-[10px]" style={{ color: "var(--txt-4)" }}>{s.detail}</p>
            </div>
          </div>
        ))}
      </div>
      <div
        className="mt-1 rounded-xl overflow-hidden"
        style={{ background: "var(--terminal-bg)", border: "1px solid var(--border)" }}
      >
        <div className="border-b px-3 py-1.5 font-mono text-[10px]" style={{ borderColor: "var(--border-sm)", color: "var(--txt-4)" }}>
          $ owlsight --monitor activity.log
        </div>
        <div className="px-3 py-2 font-mono text-[10px] space-y-1">
          {logs.map((l, i) => (
            <div key={i} className="flex items-baseline gap-2.5">
              <span className="tabular-nums" style={{ color: "var(--txt-4)", minWidth: "3.25rem" }}>{l.time}</span>
              <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: l.dot }} />
              <span style={{ color: l.dot === "rgba(255,255,255,0.18)" ? "var(--txt-3)" : l.dot, minWidth: "1.5rem" }}>{l.lvl}</span>
              <span className="uppercase tracking-wide" style={{ color: "var(--txt-3)", minWidth: "4.5rem", fontSize: "9px" }}>{l.src}</span>
              <span style={{ color: "var(--txt-2)" }}>{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const STAGE_CONTENT = [WalletStage, IntentStage, Stage1, Stage2, Stage3, Stage4, Stage5, Stage6];

// ── FlowDemo ──────────────────────────────────────────────────────────────────

export function FlowDemo() {
  const [step, setStep] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback((next: number) => {
    setStep(next % STAGES.length);
    setAnimKey((k) => k + 1);
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setStep((s) => {
        const next = (s + 1) % STAGES.length;
        setAnimKey((k) => k + 1);
        return next;
      });
    }, INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  function goTo(i: number) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    advance(i);
    intervalRef.current = setInterval(() => {
      setStep((s) => {
        const next = (s + 1) % STAGES.length;
        setAnimKey((k) => k + 1);
        return next;
      });
    }, INTERVAL_MS);
  }

  const StageContent = STAGE_CONTENT[step];

  return (
    <section className="mb-20">
      {/* Section header */}
      <div className="mb-8 text-center">
        <p className="text-xs uppercase tracking-[0.32em] text-white/35">Live demo</p>
        <h2 className="mt-4 text-3xl font-semibold text-white">
          See every stage of the execution flow
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/40">
          From price dislocation to Hummingbot handoff — the full pipeline, running in under five seconds.
        </p>
      </div>

      {/* Demo frame */}
      <div
        className="panel overflow-hidden"
        style={{ background: "var(--surface)" }}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between border-b px-5 py-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          {/* Window dots */}
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          </div>
          {/* Stage label */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px]" style={{ color: "var(--txt-4)" }}>
              {STAGES[step].num}
            </span>
            <span className="text-xs font-semibold" style={{ color: "var(--txt-2)" }}>
              {STAGES[step].title}
            </span>
            <span className="text-[10px]" style={{ color: "var(--txt-4)" }}>
              — {STAGES[step].sub}
            </span>
          </div>
          {/* Spacer */}
          <div className="w-14" />
        </div>

        {/* Stage content — fixed height, crossfade transition */}
        <div className="relative" style={{ height: 340 }}>
          <div
            key={step}
            className="absolute inset-0 p-5 animate-fade-in"
          >
            <StageContent />
          </div>
        </div>

        {/* Stage indicator dots + progress bar */}
        <div
          className="flex flex-col items-center gap-3 border-t px-5 py-4"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          {/* Progress bar */}
          <div className="w-full overflow-hidden rounded-full" style={{ height: 2, background: "var(--surface-3)" }}>
            <div
              key={animKey}
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #9945FF, #14F195)",
                animation: `progressFill ${INTERVAL_MS}ms linear forwards`,
              }}
            />
          </div>

          {/* Dots */}
          <div className="flex items-center gap-3">
            {STAGES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goTo(i)}
                className="flex items-center gap-1.5 transition-opacity hover:opacity-100"
                style={{ opacity: i === step ? 1 : 0.4 }}
                aria-label={s.title}
              >
                <span
                  className="block rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? 20 : 6,
                    height: 6,
                    background: i === step ? "#9945FF" : "var(--txt-4)",
                  }}
                />
                {i === step && (
                  <span className="text-[10px] font-medium" style={{ color: "var(--txt-3)" }}>
                    {s.title}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Keyframe for progress bar */}
      <style>{`
        @keyframes progressFill {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </section>
  );
}
