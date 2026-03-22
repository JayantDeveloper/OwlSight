"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Filter,
  Flame,
  Loader2,
  Radar,
  TerminalSquare,
  TrendingDown,
  X,
} from "lucide-react";

import { MultiCoinChart, CHART_KNOWN_SYMBOLS } from "@/components/multi-coin-chart";

import { analyseIntent } from "@/lib/api";
import { useCopilotRuntime } from "@/lib/use-copilot-runtime";
import type { IntentResponse, Opportunity } from "@/lib/types";

import { EventLogPanel } from "@/components/event-log-panel";
import { ExecutionTimeline } from "@/components/execution-timeline";
import { MonteCarloPanel } from "@/components/monte-carlo-panel";
import { RouteInspector } from "@/components/route-inspector";
import { StatusSummaryBar } from "@/components/status-summary-bar";

// ─── Types ───────────────────────────────────────────────────────────────────

type MatrixView = "whisker" | "scatter" | "decompose" | "heat" | "markets";
type SortKey = "confidence" | "profit" | "fees" | "slippage" | "latency";

const CHAINS = [
  { name: "Solana", color: "#9945FF", bgClass: "bg-[#9945FF]", borderClass: "border-[#9945FF]" },
  { name: "Base", color: "#3B82F6", bgClass: "bg-blue-500", borderClass: "border-blue-500" },
  { name: "Ethereum", color: "#818CF8", bgClass: "bg-indigo-400", borderClass: "border-indigo-400" },
  { name: "Arbitrum", color: "#38BDF8", bgClass: "bg-sky-400", borderClass: "border-sky-400" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function routeLabel(opp: Opportunity): string {
  const from = opp.buy_chain.split(/[-_]/)[0].slice(0, 3).toUpperCase();
  const to = opp.sell_chain.split(/[-_]/)[0].slice(0, 3).toUpperCase();
  return `${from}/${to}`;
}

function fmtUsd(v: number): string {
  const sign = v >= 0 ? "+" : "";
  return `${sign}$${Math.abs(v).toFixed(2)}`;
}

function chainMatchesFilter(opp: Opportunity, filter: Set<string>): boolean {
  if (filter.size === 0) return true;
  const lower = (s: string) => s.toLowerCase();
  for (const chain of filter) {
    const c = lower(chain);
    if (lower(opp.buy_chain).includes(c) || lower(opp.sell_chain).includes(c)) return true;
  }
  return false;
}

function sortOpportunities(opps: Opportunity[], sort: SortKey): Opportunity[] {
  return [...opps].sort((a, b) => {
    switch (sort) {
      case "confidence": return b.confidence_score - a.confidence_score;
      case "profit": return b.expected_net_profit_usd - a.expected_net_profit_usd;
      case "fees": return a.estimated_fees_usd - b.estimated_fees_usd;
      case "slippage": return a.estimated_slippage_bps - b.estimated_slippage_bps;
      case "latency": return a.estimated_bridge_latency_sec - b.estimated_bridge_latency_sec;
      default: return 0;
    }
  });
}

function percentileRank(values: number[], value: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = sorted.findIndex((v) => v >= value);
  if (idx === -1) return 1;
  return sorted.length <= 1 ? 0.5 : idx / (sorted.length - 1);
}

function heatColor(rank: number, higherIsBetter: boolean): string {
  const r = higherIsBetter ? rank : 1 - rank;
  if (r >= 0.7) return "rgba(20,241,149,0.35)";
  if (r >= 0.4) return "rgba(245,158,11,0.35)";
  return "rgba(239,68,68,0.35)";
}

// ─── Chain Filter Badge ───────────────────────────────────────────────────────

function ChainFilterBadge({
  chain,
  count,
  isActive,
  onToggle,
}: {
  chain: typeof CHAINS[number];
  count: number;
  isActive: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-all duration-150 ${
        isActive
          ? "border-opacity-60 bg-opacity-15 text-white"
          : "border-white/[0.07] bg-white/[0.03] text-white/40 hover:text-white/70"
      }`}
      style={
        isActive
          ? { borderColor: chain.color + "99", backgroundColor: chain.color + "22" }
          : undefined
      }
    >
      <span
        className="h-1.5 w-1.5 rounded-full transition-all"
        style={{
          backgroundColor: chain.color,
          boxShadow: isActive ? `0 0 6px ${chain.color}` : undefined,
          opacity: isActive ? 1 : 0.4,
        }}
      />
      <span className="font-mono text-[10px] font-medium">{chain.name}</span>
      {count > 0 && (
        <span
          className="rounded-full px-1 font-mono text-[9px]"
          style={
            isActive
              ? { backgroundColor: chain.color + "33", color: chain.color }
              : { backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }
          }
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Matrix Toolbar ───────────────────────────────────────────────────────────

function MatrixToolbar({
  view,
  onViewChange,
  sort,
  onSortChange,
  showRejected,
  onToggleRejected,
  totalCount,
  visibleCount,
}: {
  view: MatrixView;
  onViewChange: (v: MatrixView) => void;
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
  showRejected: boolean;
  onToggleRejected: () => void;
  totalCount: number;
  visibleCount: number;
}) {
  const views: { key: MatrixView; label: string }[] = [
    { key: "whisker", label: "Whisker" },
    { key: "scatter", label: "Scatter" },
    { key: "decompose", label: "Decompose" },
    { key: "heat", label: "Heatmap" },
    { key: "markets", label: "Markets" },
  ];
  const sorts: { key: SortKey; label: string }[] = [
    { key: "confidence", label: "Confidence" },
    { key: "profit", label: "Net Profit" },
    { key: "fees", label: "Fees ↑" },
    { key: "slippage", label: "Slippage ↑" },
    { key: "latency", label: "Latency ↑" },
  ];

  return (
    <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-2">
      {/* View switcher */}
      <div className="flex items-center gap-0.5 rounded-lg border border-white/[0.07] bg-white/[0.03] p-0.5">
        {views.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => onViewChange(v.key)}
            className={`rounded-md px-3 py-1 font-mono text-[10px] font-medium transition-all duration-150 ${
              view === v.key
                ? "bg-solviolet text-white shadow-sm"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-1.5">
        <Filter className="h-3 w-3 text-white/25" />
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-white/55 focus:outline-none focus:ring-1 focus:ring-solviolet/50"
        >
          {sorts.map((s) => (
            <option key={s.key} value={s.key} className="bg-[#080B11]">
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Rejected toggle */}
      <button
        type="button"
        onClick={onToggleRejected}
        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] transition-all duration-150 ${
          showRejected
            ? "border-red-500/30 bg-red-500/10 text-red-400"
            : "border-white/[0.07] bg-white/[0.03] text-white/35 hover:text-white/60"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${showRejected ? "bg-red-400" : "bg-white/20"}`} />
        Rejected
      </button>

      {/* Route count */}
      <div className="ml-auto font-mono text-[10px] text-white/25">
        {visibleCount === totalCount
          ? `${totalCount} route${totalCount !== 1 ? "s" : ""}`
          : `${visibleCount} / ${totalCount} routes`}
      </div>
    </div>
  );
}

// ─── Box & Whisker Chart ──────────────────────────────────────────────────────

function BoxWhiskerChart({
  routes,
  selectedId,
  onSelect,
}: {
  routes: Opportunity[];
  selectedId: string | null;
  onSelect: (opp: Opportunity) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 600, height: 320 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; opp: Opportunity } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDims({ width: Math.max(width, 200), height: Math.max(height, 200) });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  if (!routes.length) {
    return (
      <div ref={containerRef} className="flex h-full items-center justify-center">
        <div className="text-center">
          <Radar className="mx-auto h-8 w-8 text-white/15" />
          <p className="mt-3 text-xs text-white/25">No routes to display</p>
        </div>
      </div>
    );
  }

  const ML = 64, MR = 24, MT = 28, MB = 80;
  const W = dims.width - ML - MR;
  const H = dims.height - MT - MB;

  // Compute Y domain from MC data or expected profit
  let yMin = Infinity, yMax = -Infinity;
  for (const r of routes) {
    const lo = r.monte_carlo?.worst_case_usd ?? r.expected_net_profit_usd;
    const hi = r.monte_carlo?.best_case_usd ?? r.expected_net_profit_usd;
    if (lo < yMin) yMin = lo;
    if (hi > yMax) yMax = hi;
  }
  const padding = Math.max(Math.abs(yMax - yMin) * 0.12, 1);
  yMin -= padding;
  yMax += padding;
  const yRange = yMax - yMin;

  const toY = (v: number) => MT + H - ((v - yMin) / yRange) * H;
  const zeroY = toY(0);

  // Nice Y-axis ticks
  const rawStep = yRange / 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(rawStep))));
  const step = Math.ceil(rawStep / magnitude) * magnitude;
  const ticks: number[] = [];
  for (let t = Math.ceil(yMin / step) * step; t <= yMax; t = Math.round((t + step) * 1e6) / 1e6) {
    ticks.push(t);
    if (ticks.length > 8) break;
  }

  const colW = Math.min(Math.max(W / routes.length, 30), 80);
  const colSpacing = W / routes.length;

  function colCenterX(i: number) {
    return ML + i * colSpacing + colSpacing / 2;
  }

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg
        width={dims.width}
        height={dims.height}
        className="overflow-visible"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Grid lines + Y-axis labels */}
        {ticks.map((t) => {
          const y = toY(t);
          return (
            <g key={t}>
              <line
                x1={ML} y1={y} x2={dims.width - MR} y2={y}
                stroke="rgba(255,255,255,0.06)" strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={ML - 6} y={y}
                textAnchor="end" dominantBaseline="middle"
                fill="rgba(255,255,255,0.3)" fontSize={9}
                fontFamily="monospace"
              >
                {t >= 0 ? `+$${t.toFixed(1)}` : `-$${Math.abs(t).toFixed(1)}`}
              </text>
            </g>
          );
        })}

        {/* Zero line */}
        {zeroY >= MT && zeroY <= MT + H && (
          <g>
            <line
              x1={ML} y1={zeroY} x2={dims.width - MR} y2={zeroY}
              stroke="#ef4444" strokeWidth={1} strokeOpacity={0.6}
            />
            <text
              x={ML - 6} y={zeroY}
              textAnchor="end" dominantBaseline="middle"
              fill="#ef4444" fontSize={8} fontFamily="monospace" fillOpacity={0.7}
            >
              $0
            </text>
          </g>
        )}

        {/* Chart clips */}
        <clipPath id="chart-clip">
          <rect x={ML} y={MT} width={W} height={H} />
        </clipPath>

        {/* Per-route box-whisker */}
        {routes.map((opp, i) => {
          const cx = colCenterX(i);
          const approved = opp.approval_stage === "approved";
          const isSelected = opp.id === selectedId;
          const mc = opp.monte_carlo;

          const worst = mc?.worst_case_usd ?? opp.expected_net_profit_usd;
          const best = mc?.best_case_usd ?? opp.expected_net_profit_usd;
          const p10 = mc?.p10_usd ?? opp.expected_net_profit_usd;
          const p90 = mc?.p90_usd ?? opp.expected_net_profit_usd;
          const p50 = mc?.p50_usd ?? opp.expected_net_profit_usd;
          const ev = mc?.expected_profit_usd ?? opp.expected_net_profit_usd;

          const yWorst = toY(worst);
          const yBest = toY(best);
          const yP10 = toY(p10);
          const yP90 = toY(p90);
          const yP50 = toY(p50);
          const yEV = toY(ev);

          const boxW = colW * 0.55;
          const strokeColor = approved ? "#9945FF" : "#ef4444";
          const fillColor = approved ? "rgba(153,69,255,0.25)" : "rgba(239,68,68,0.15)";
          const evFill = approved ? "#14F195" : "#f59e0b";

          const handleEnter = (e: React.MouseEvent<SVGElement>) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, opp });
          };

          return (
            <g
              key={opp.id}
              style={{ cursor: "pointer" }}
              onClick={() => onSelect(opp)}
              onMouseEnter={handleEnter}
              onMouseMove={handleEnter}
            >
              {/* Hover background */}
              <rect
                x={cx - colSpacing / 2} y={MT}
                width={colSpacing} height={H}
                fill={isSelected ? "rgba(153,69,255,0.08)" : "transparent"}
                className="transition-all duration-100"
              />
              {/* Whisker line */}
              <line
                x1={cx} y1={yWorst} x2={cx} y2={yBest}
                stroke={strokeColor} strokeWidth={1} strokeOpacity={0.35}
              />
              {/* Whisker end caps */}
              <line x1={cx - 4} y1={yWorst} x2={cx + 4} y2={yWorst} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.4} />
              <line x1={cx - 4} y1={yBest} x2={cx + 4} y2={yBest} stroke={strokeColor} strokeWidth={1} strokeOpacity={0.4} />
              {/* Box (P10–P90) */}
              <rect
                x={cx - boxW / 2} y={Math.min(yP10, yP90)}
                width={boxW} height={Math.abs(yP10 - yP90)}
                fill={fillColor} stroke={strokeColor} strokeWidth={isSelected ? 1.5 : 0.8}
                rx={3}
              />
              {/* Median line */}
              <line
                x1={cx - boxW / 2} y1={yP50} x2={cx + boxW / 2} y2={yP50}
                stroke={strokeColor} strokeWidth={isSelected ? 2 : 1.5}
                strokeOpacity={0.9}
              />
              {/* Expected value diamond */}
              <rect
                x={cx - 4} y={yEV - 4}
                width={8} height={8}
                fill={evFill} fillOpacity={isSelected ? 1 : 0.8}
                transform={`rotate(45 ${cx} ${yEV})`}
              />
              {/* X-axis label */}
              <text
                x={cx} y={MT + H + 12}
                textAnchor="end"
                fill={isSelected ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)"}
                fontSize={9} fontFamily="monospace"
                transform={`rotate(-40 ${cx} ${MT + H + 12})`}
              >
                {routeLabel(opp)}
              </text>
              <text
                x={cx} y={MT + H + 24}
                textAnchor="end"
                fill="rgba(255,255,255,0.2)"
                fontSize={8} fontFamily="monospace"
                transform={`rotate(-40 ${cx} ${MT + H + 24})`}
              >
                {opp.bridge_name.slice(0, 10)}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${ML}, ${MT - 14})`}>
          <rect x={0} y={0} width={10} height={10} fill="rgba(20,241,149,0.3)" stroke="#14F195" strokeWidth={0.8} rx={1} />
          <text x={14} y={8} fill="rgba(255,255,255,0.35)" fontSize={8} fontFamily="monospace">Approved</text>
          <rect x={70} y={0} width={10} height={10} fill="rgba(239,68,68,0.15)" stroke="#ef4444" strokeWidth={0.8} rx={1} />
          <text x={84} y={8} fill="rgba(255,255,255,0.35)" fontSize={8} fontFamily="monospace">Rejected</text>
          <rect x={140} y={3} width={8} height={8} fill="#14F195" transform="rotate(45 144 7)" />
          <text x={154} y={8} fill="rgba(255,255,255,0.35)" fontSize={8} fontFamily="monospace">Expected value</text>
          <line x1={240} y1={4} x2={260} y2={4} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
          <line x1={250} y1={1} x2={250} y2={8} stroke="rgba(255,255,255,0.3)" strokeWidth={0.8} />
          <text x={264} y={8} fill="rgba(255,255,255,0.35)" fontSize={8} fontFamily="monospace">P10–P90 box, P5/P95 whisker</text>
        </g>
      </svg>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 rounded-xl border border-white/[0.1] bg-[#0D1117]/95 p-3 shadow-xl backdrop-blur-sm"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 10,
            transform: tooltip.x > dims.width - 220 ? "translateX(-110%)" : undefined,
            maxWidth: 220,
          }}
        >
          <p className="mb-2 font-mono text-[10px] font-semibold text-white/80">
            {tooltip.opp.buy_chain} → {tooltip.opp.bridge_name} → {tooltip.opp.sell_chain}
          </p>
          <div className="space-y-1 font-mono text-[10px]">
            <div className="flex justify-between gap-4">
              <span className="text-white/35">Expected</span>
              <span className={tooltip.opp.expected_net_profit_usd >= 0 ? "text-solmint" : "text-red-400"}>
                {fmtUsd(tooltip.opp.expected_net_profit_usd)}
              </span>
            </div>
            {tooltip.opp.monte_carlo && (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-white/35">P(profit)</span>
                  <span className="text-white/70">
                    {Math.round(tooltip.opp.monte_carlo.probability_of_profit * 100)}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 border-t border-white/[0.07] pt-1">
                  <div className="text-center">
                    <div className="text-[9px] text-white/25">P10</div>
                    <div className={tooltip.opp.monte_carlo.p10_usd >= 0 ? "text-white/60" : "text-red-400"}>
                      {fmtUsd(tooltip.opp.monte_carlo.p10_usd)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] text-white/25">P50</div>
                    <div className="text-white/70">{fmtUsd(tooltip.opp.monte_carlo.p50_usd)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] text-white/25">P90</div>
                    <div className="text-solmint">{fmtUsd(tooltip.opp.monte_carlo.p90_usd)}</div>
                  </div>
                </div>
                <div className="flex justify-between gap-4 border-t border-white/[0.07] pt-1">
                  <span className="text-white/35">Sharpe</span>
                  <span className={tooltip.opp.monte_carlo.sharpe_approx >= 1 ? "text-solmint" : "text-amber-400"}>
                    {tooltip.opp.monte_carlo.sharpe_approx.toFixed(2)}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between gap-4 border-t border-white/[0.07] pt-1">
              <span className="text-white/35">Confidence</span>
              <span className="text-white/70">{Math.round(tooltip.opp.confidence_score * 100)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Scatter Chart ────────────────────────────────────────────────────────────

function ScatterChart({
  routes,
  selectedId,
  onSelect,
}: {
  routes: Opportunity[];
  selectedId: string | null;
  onSelect: (opp: Opportunity) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 600, height: 320 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; opp: Opportunity } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDims({ width: Math.max(width, 200), height: Math.max(height, 200) });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  if (!routes.length) {
    return (
      <div ref={containerRef} className="flex h-full items-center justify-center">
        <p className="text-xs text-white/25">No routes to display</p>
      </div>
    );
  }

  const ML = 60, MR = 24, MT = 24, MB = 40;
  const W = dims.width - ML - MR;
  const H = dims.height - MT - MB;

  // X: probability_of_profit, Y: expected_net_profit_usd
  let yMin = Infinity, yMax = -Infinity;
  for (const r of routes) {
    if (r.expected_net_profit_usd < yMin) yMin = r.expected_net_profit_usd;
    if (r.expected_net_profit_usd > yMax) yMax = r.expected_net_profit_usd;
  }
  const yPad = Math.max(Math.abs(yMax - yMin) * 0.15, 1);
  yMin -= yPad; yMax += yPad;

  const maxNotional = Math.max(...routes.map((r) => r.notional_usd), 1);

  const toX = (prob: number) => ML + prob * W;
  const toY = (v: number) => MT + H - ((v - yMin) / (yMax - yMin)) * H;
  const zeroY = toY(0);

  const quadrants = [
    { x: 0.5, y: 0, label: "High Conf · Profitable", color: "#14F195", anchor: "end" as const, dy: -8 },
    { x: 0.5, y: 0, label: "Speculative upside", color: "#f59e0b", anchor: "start" as const, dy: -8 },
    { x: 0.5, y: 0, label: "High Conf · Loss", color: "#ef4444", anchor: "end" as const, dy: 16 },
    { x: 0.5, y: 0, label: "Avoid", color: "#ef4444", anchor: "start" as const, dy: 16 },
  ];

  return (
    <div ref={containerRef} className="relative h-full w-full" onMouseLeave={() => setTooltip(null)}>
      <svg width={dims.width} height={dims.height}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <g key={pct}>
            <line
              x1={toX(pct)} y1={MT} x2={toX(pct)} y2={MT + H}
              stroke="rgba(255,255,255,0.05)" strokeWidth={1}
              strokeDasharray={pct === 0.5 ? "4 4" : "2 6"}
            />
            <text
              x={toX(pct)} y={MT + H + 14}
              textAnchor="middle" fill="rgba(255,255,255,0.25)"
              fontSize={8} fontFamily="monospace"
            >
              {Math.round(pct * 100)}%
            </text>
          </g>
        ))}
        <text x={ML + W / 2} y={MT + H + 30} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={8} fontFamily="monospace">
          Probability of Profit →
        </text>

        {/* Y-axis */}
        {[-2, -1, 0, 1, 2, 3, 4, 5].map((tick) => {
          const y = toY(tick);
          if (y < MT || y > MT + H) return null;
          return (
            <g key={tick}>
              <line x1={ML} y1={y} x2={ML + W} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
              <text x={ML - 4} y={y} textAnchor="end" dominantBaseline="middle" fill="rgba(255,255,255,0.25)" fontSize={8} fontFamily="monospace">
                {tick >= 0 ? `+$${tick}` : `-$${Math.abs(tick)}`}
              </text>
            </g>
          );
        })}

        {/* Zero Y line */}
        {zeroY >= MT && zeroY <= MT + H && (
          <line x1={ML} y1={zeroY} x2={ML + W} y2={zeroY} stroke="#ef4444" strokeWidth={1} strokeOpacity={0.4} />
        )}

        {/* 50% X line */}
        <line
          x1={toX(0.5)} y1={MT} x2={toX(0.5)} y2={MT + H}
          stroke="#f59e0b" strokeWidth={1} strokeOpacity={0.3}
          strokeDasharray="4 4"
        />

        {/* Quadrant labels */}
        <text x={toX(0.97)} y={MT + 14} textAnchor="end" fill="rgba(20,241,149,0.35)" fontSize={8} fontFamily="monospace">
          High Conf · Profitable ▲
        </text>
        <text x={toX(0.03)} y={MT + 14} textAnchor="start" fill="rgba(245,158,11,0.35)" fontSize={8} fontFamily="monospace">
          ▲ Speculative
        </text>
        <text x={toX(0.97)} y={MT + H - 6} textAnchor="end" fill="rgba(239,68,68,0.35)" fontSize={8} fontFamily="monospace">
          High Conf · Loss ▼
        </text>
        <text x={toX(0.03)} y={MT + H - 6} textAnchor="start" fill="rgba(239,68,68,0.35)" fontSize={8} fontFamily="monospace">
          ▼ Avoid
        </text>

        {/* Bubbles */}
        {routes.map((opp) => {
          const prob = opp.monte_carlo?.probability_of_profit ?? 0.5;
          const cx = toX(prob);
          const cy = toY(opp.expected_net_profit_usd);
          const r = 6 + (opp.notional_usd / maxNotional) * 12;
          const approved = opp.approval_stage === "approved";
          const isSelected = opp.id === selectedId;

          return (
            <circle
              key={opp.id}
              cx={cx} cy={cy} r={isSelected ? r + 3 : r}
              fill={approved ? "rgba(20,241,149,0.25)" : "rgba(239,68,68,0.2)"}
              stroke={approved ? "#14F195" : "#ef4444"}
              strokeWidth={isSelected ? 2 : 0.8}
              style={{ cursor: "pointer", transition: "r 0.15s, stroke-width 0.15s" }}
              onClick={() => onSelect(opp)}
              onMouseEnter={(e) => {
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect) return;
                setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, opp });
              }}
              onMouseMove={(e) => {
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect) return;
                setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, opp });
              }}
            />
          );
        })}

        {/* Y-axis label */}
        <text
          transform={`translate(12, ${MT + H / 2}) rotate(-90)`}
          textAnchor="middle" fill="rgba(255,255,255,0.2)"
          fontSize={8} fontFamily="monospace"
        >
          Expected Net Profit ($)
        </text>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 rounded-xl border border-white/[0.1] bg-[#0D1117]/95 p-3 shadow-xl backdrop-blur-sm"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 10,
            transform: tooltip.x > dims.width - 220 ? "translateX(-110%)" : undefined,
            maxWidth: 210,
          }}
        >
          <p className="mb-1.5 font-mono text-[10px] font-semibold text-white/80">
            {tooltip.opp.buy_chain} → {tooltip.opp.sell_chain}
          </p>
          <div className="space-y-1 font-mono text-[10px]">
            <div className="flex justify-between gap-4">
              <span className="text-white/35">Net profit</span>
              <span className={tooltip.opp.expected_net_profit_usd >= 0 ? "text-solmint" : "text-red-400"}>
                {fmtUsd(tooltip.opp.expected_net_profit_usd)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-white/35">P(profit)</span>
              <span className="text-white/70">
                {Math.round((tooltip.opp.monte_carlo?.probability_of_profit ?? 0) * 100)}%
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-white/35">Notional</span>
              <span className="text-white/50">${tooltip.opp.notional_usd.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Waterfall Decomposition Chart ───────────────────────────────────────────

function WaterfallChart({ route }: { route: Opportunity | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 600, height: 280 });

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDims({ width: Math.max(width, 300), height: Math.max(height, 200) });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  if (!route) {
    return (
      <div ref={containerRef} className="flex h-full items-center justify-center">
        <div className="text-center">
          <TrendingDown className="mx-auto h-8 w-8 text-white/15" />
          <p className="mt-3 text-xs text-white/25">Select a route in Whisker or Scatter view</p>
          <p className="mt-1 text-[10px] text-white/15">to see profit decomposition</p>
        </div>
      </div>
    );
  }

  const cb = route.cost_breakdown;
  const segments = [
    { label: "Gross Profit", value: route.gross_profit_usd, isPositive: true, color: "#14F195" },
    { label: "Trading Fees", value: -cb.trading_fees_usd, isPositive: false, color: "#f59e0b" },
    { label: "Bridge Fees", value: -cb.bridge_fee_usd, isPositive: false, color: "#f97316" },
    { label: "Slippage", value: -cb.slippage_cost_usd, isPositive: false, color: "#f87171" },
    { label: "Latency", value: -cb.latency_penalty_usd, isPositive: false, color: "#ef4444" },
    { label: "Net Profit", value: route.expected_net_profit_usd, isTotal: true, color: route.expected_net_profit_usd >= 0 ? "#14F195" : "#ef4444" },
  ];

  const ML = 24, MR = 24, MT = 28, MB = 56;
  const W = dims.width - ML - MR;
  const H = dims.height - MT - MB;

  // Compute running total for positioning
  let running = 0;
  const bars: { start: number; end: number; label: string; color: string; isTotal?: boolean }[] = [];
  for (const seg of segments) {
    if (seg.isTotal) {
      bars.push({ start: 0, end: seg.value, label: seg.label, color: seg.color, isTotal: true });
    } else {
      bars.push({ start: running, end: running + seg.value, label: seg.label, color: seg.color });
      running += seg.value;
    }
  }

  const allValues = bars.flatMap((b) => [b.start, b.end]);
  let yMin = Math.min(...allValues, 0);
  let yMax = Math.max(...allValues, 0);
  const yPad = Math.max((yMax - yMin) * 0.18, 0.5);
  yMin -= yPad; yMax += yPad;

  const toY = (v: number) => MT + H - ((v - yMin) / (yMax - yMin)) * H;
  const zeroY = toY(0);

  const barW = (W / bars.length) * 0.55;
  const barSpacing = W / bars.length;

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg width={dims.width} height={dims.height}>
        {/* Y gridlines */}
        {[yMin, 0, yMax].map((tick) => {
          const y = toY(tick);
          if (y < MT - 4 || y > MT + H + 4) return null;
          return (
            <line key={tick}
              x1={ML} y1={y} x2={dims.width - MR} y2={y}
              stroke={tick === 0 ? "#ef4444" : "rgba(255,255,255,0.06)"}
              strokeWidth={1}
              strokeOpacity={tick === 0 ? 0.5 : 1}
              strokeDasharray={tick === 0 ? undefined : "4 4"}
            />
          );
        })}

        {/* Zero label */}
        <text
          x={ML - 4} y={zeroY}
          textAnchor="end" dominantBaseline="middle"
          fill="rgba(255,255,255,0.25)" fontSize={8} fontFamily="monospace"
        >
          $0
        </text>

        {/* Connector lines between bars */}
        {bars.map((bar, i) => {
          if (i === 0 || i === bars.length - 1) return null;
          const prevBar = bars[i - 1];
          const x1 = ML + (i - 1) * barSpacing + barSpacing / 2 + barW / 2;
          const x2 = ML + i * barSpacing + barSpacing / 2 - barW / 2;
          const connY = bar.isTotal ? toY(0) : toY(prevBar.end);
          return (
            <line key={i}
              x1={x1} y1={connY} x2={x2} y2={connY}
              stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="3 3"
            />
          );
        })}

        {/* Bars */}
        {bars.map((bar, i) => {
          const cx = ML + i * barSpacing + barSpacing / 2;
          const yTop = Math.min(toY(bar.start), toY(bar.end));
          const yBot = Math.max(toY(bar.start), toY(bar.end));
          const barHeight = Math.max(yBot - yTop, 2);
          const valueY = toY(bar.end);
          const isNeg = bar.end < bar.start;

          return (
            <g key={bar.label}>
              <rect
                x={cx - barW / 2} y={yTop}
                width={barW} height={barHeight}
                fill={bar.color} fillOpacity={bar.isTotal ? 0.9 : 0.6}
                stroke={bar.color} strokeWidth={bar.isTotal ? 1.5 : 0.8}
                rx={2}
              />
              {/* Value label */}
              <text
                x={cx} y={isNeg ? yBot + 10 : yTop - 4}
                textAnchor="middle"
                fill={bar.color} fontSize={8} fontFamily="monospace" fontWeight={bar.isTotal ? 600 : 400}
              >
                {bar.end >= bar.start ? "+" : ""}{fmtUsd(bar.end - bar.start)}
              </text>
              {/* Category label */}
              <text
                x={cx} y={MT + H + 16}
                textAnchor="end"
                fill={bar.isTotal ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)"}
                fontSize={8} fontFamily="monospace"
                transform={`rotate(-35 ${cx} ${MT + H + 16})`}
                fontWeight={bar.isTotal ? 600 : 400}
              >
                {bar.label}
              </text>
            </g>
          );
        })}

        {/* Title */}
        <text x={ML} y={MT - 10} fill="rgba(255,255,255,0.4)" fontSize={9} fontFamily="monospace">
          Cost decomposition — {route.buy_chain} → {route.bridge_name} → {route.sell_chain}
        </text>
      </svg>
    </div>
  );
}

// ─── Heatmap Grid ─────────────────────────────────────────────────────────────

function HeatmapGrid({
  routes,
  selectedId,
  onSelect,
}: {
  routes: Opportunity[];
  selectedId: string | null;
  onSelect: (opp: Opportunity) => void;
}) {
  if (!routes.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-xs text-white/25">No routes to display</p>
      </div>
    );
  }

  const columns: { key: string; label: string; higherBetter: boolean; format: (r: Opportunity) => string; value: (r: Opportunity) => number }[] = [
    {
      key: "confidence", label: "Conf.", higherBetter: true,
      format: (r) => `${Math.round(r.confidence_score * 100)}%`,
      value: (r) => r.confidence_score,
    },
    {
      key: "pprofit", label: "P(profit)", higherBetter: true,
      format: (r) => r.monte_carlo ? `${Math.round(r.monte_carlo.probability_of_profit * 100)}%` : "—",
      value: (r) => r.monte_carlo?.probability_of_profit ?? 0,
    },
    {
      key: "netprofit", label: "Net Profit", higherBetter: true,
      format: (r) => fmtUsd(r.expected_net_profit_usd),
      value: (r) => r.expected_net_profit_usd,
    },
    {
      key: "fees", label: "Fees", higherBetter: false,
      format: (r) => `$${r.estimated_fees_usd.toFixed(2)}`,
      value: (r) => r.estimated_fees_usd,
    },
    {
      key: "slippage", label: "Slip.", higherBetter: false,
      format: (r) => `${r.estimated_slippage_bps}bps`,
      value: (r) => r.estimated_slippage_bps,
    },
    {
      key: "latency", label: "Latency", higherBetter: false,
      format: (r) => `${r.estimated_bridge_latency_sec}s`,
      value: (r) => r.estimated_bridge_latency_sec,
    },
    {
      key: "sharpe", label: "Sharpe", higherBetter: true,
      format: (r) => r.monte_carlo ? r.monte_carlo.sharpe_approx.toFixed(2) : "—",
      value: (r) => r.monte_carlo?.sharpe_approx ?? 0,
    },
  ];

  // Precompute sorted values for ranking
  const colValues = columns.map((col) => routes.map((r) => col.value(r)).sort((a, b) => a - b));

  return (
    <div className="h-full overflow-auto">
      <table className="w-full border-collapse font-mono text-[10px]">
        <thead className="sticky top-0 z-10 bg-[#080B11]">
          <tr>
            <th className="border-b border-r border-white/[0.07] px-3 py-2 text-left text-white/30 font-medium">
              Route
            </th>
            {columns.map((col) => (
              <th key={col.key} className="border-b border-r border-white/[0.07] px-2 py-2 text-center text-white/30 font-medium whitespace-nowrap">
                {col.label}
              </th>
            ))}
            <th className="border-b border-white/[0.07] px-2 py-2 text-center text-white/30 font-medium">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {routes.map((opp, ri) => {
            const isSelected = opp.id === selectedId;
            return (
              <tr
                key={opp.id}
                onClick={() => onSelect(opp)}
                className={`cursor-pointer border-b border-white/[0.04] transition-colors duration-100 hover:bg-white/[0.03] ${
                  isSelected ? "bg-solviolet/10" : ""
                }`}
              >
                {/* Route label */}
                <td className={`border-r border-white/[0.07] px-3 py-2 ${isSelected ? "border-l-2 border-l-solviolet" : ""}`}>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-white/70">{routeLabel(opp)}</span>
                    <span className="text-[9px] text-white/25">{opp.bridge_name.slice(0, 14)}</span>
                  </div>
                </td>
                {/* Metric cells */}
                {columns.map((col, ci) => {
                  const val = col.value(opp);
                  const hasMc = opp.monte_carlo !== null && opp.monte_carlo !== undefined;
                  const isMcCol = col.key === "pprofit" || col.key === "sharpe";
                  const rank = colValues[ci].length <= 1 ? 0.5 : percentileRank(colValues[ci], val);
                  const bg = (isMcCol && !hasMc) ? "transparent" : heatColor(rank, col.higherBetter);
                  const textColor = col.key === "netprofit"
                    ? opp.expected_net_profit_usd >= 0 ? "#14F195" : "#f87171"
                    : "rgba(255,255,255,0.65)";
                  return (
                    <td
                      key={col.key}
                      className="border-r border-white/[0.07] px-2 py-2 text-center tabular-nums"
                      style={{ backgroundColor: bg, color: textColor }}
                    >
                      {isMcCol && !hasMc ? <span className="text-white/20">—</span> : col.format(opp)}
                    </td>
                  );
                })}
                {/* Status badge */}
                <td className="px-2 py-2 text-center">
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide ${
                    opp.approval_stage === "approved"
                      ? "bg-solmint/10 text-solmint"
                      : "bg-red-500/10 text-red-400"
                  }`}>
                    {opp.approval_stage === "approved" ? "OK" : "NO"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── (CandlestickChart removed — replaced by MultiCoinChart in Markets view) ──

// ─── Route Intelligence Matrix ────────────────────────────────────────────────

function RouteIntelligenceMatrix({
  intentResponse,
  chainFilter,
  selectedId,
  onSelect,
}: {
  intentResponse: IntentResponse | null;
  chainFilter: Set<string>;
  selectedId: string | null;
  onSelect: (opp: Opportunity) => void;
}) {
  const [view, setView] = useState<MatrixView>("whisker");
  const [sort, setSort] = useState<SortKey>("confidence");
  const [showRejected, setShowRejected] = useState(true);

  // ── Market chart coins ────────────────────────────────────────────────────
  const [chartCoins, setChartCoins] = useState<string[]>([]);

  useEffect(() => {
    if (!intentResponse) { setChartCoins([]); return; }
    const seen = new Set<string>();
    if (intentResponse.asset_from) seen.add(intentResponse.asset_from.toUpperCase());
    if (intentResponse.asset_to)   seen.add(intentResponse.asset_to.toUpperCase());
    for (const opp of intentResponse.opportunities) seen.add(opp.asset_symbol.toUpperCase());
    setChartCoins([...seen].filter((s) => CHART_KNOWN_SYMBOLS.has(s)).slice(0, 6));
  }, [intentResponse]);

  const allRoutes = intentResponse?.opportunities ?? [];

  const filteredRoutes = useMemo(() => {
    let r = allRoutes.filter((o) => chainMatchesFilter(o, chainFilter));
    if (!showRejected) r = r.filter((o) => o.approval_stage === "approved");
    return sortOpportunities(r, sort);
  }, [allRoutes, chainFilter, showRejected, sort]);

  const selectedRoute = filteredRoutes.find((r) => r.id === selectedId) ?? null;

  if (!intentResponse) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <div className="inline-flex rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5">
          <Radar className="h-10 w-10 text-white/15" />
        </div>
        <div>
          <p className="text-sm font-medium text-white/35">Route Intelligence Matrix</p>
          <p className="mt-1 text-xs text-white/20">
            Submit an intent in the Command Center to visualize routes
          </p>
        </div>
        <div className="mt-2 flex items-center gap-3 font-mono text-[10px] text-white/15">
          <span>Whisker</span><span>·</span><span>Scatter</span><span>·</span><span>Decompose</span><span>·</span><span>Heat</span><span>·</span><span>Markets</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <MatrixToolbar
        view={view}
        onViewChange={setView}
        sort={sort}
        onSortChange={setSort}
        showRejected={showRejected}
        onToggleRejected={() => setShowRejected((v) => !v)}
        totalCount={allRoutes.length}
        visibleCount={filteredRoutes.length}
      />

      {/* Selected route expandable info bar — hidden in Markets view */}
      {selectedRoute && view !== "markets" && (
        <div className="flex items-center gap-4 overflow-hidden border-b border-white/[0.07] bg-solviolet/[0.06] px-4 py-2 transition-all duration-200">
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="text-white/50">{selectedRoute.buy_chain}</span>
            <ArrowRight className="h-3 w-3 text-white/25" />
            <span className="text-solviolet/80">{selectedRoute.bridge_name}</span>
            <ArrowRight className="h-3 w-3 text-white/25" />
            <span className="text-white/50">{selectedRoute.sell_chain}</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className={`font-semibold ${selectedRoute.expected_net_profit_usd >= 0 ? "text-solmint" : "text-red-400"}`}>
              {fmtUsd(selectedRoute.expected_net_profit_usd)}
            </span>
            <span className="text-white/25">·</span>
            <span className="text-white/45">{Math.round(selectedRoute.confidence_score * 100)}% conf.</span>
            {selectedRoute.monte_carlo && (
              <>
                <span className="text-white/25">·</span>
                <span className="text-white/45">
                  P(profit) {Math.round(selectedRoute.monte_carlo.probability_of_profit * 100)}%
                </span>
                <span className="text-white/25">·</span>
                <span className={selectedRoute.monte_carlo.sharpe_approx >= 1 ? "text-solmint/70" : "text-amber-400/70"}>
                  Sharpe {selectedRoute.monte_carlo.sharpe_approx.toFixed(2)}
                </span>
              </>
            )}
          </div>
          <span className={`ml-auto rounded-full px-2 py-0.5 font-mono text-[9px] font-medium ${
            selectedRoute.approval_stage === "approved"
              ? "bg-solmint/10 text-solmint"
              : "bg-red-500/10 text-red-400"
          }`}>
            {selectedRoute.approval_stage.toUpperCase()}
          </span>
        </div>
      )}

      {/* Chart area */}
      <div className="relative min-h-0 flex-1 p-4">
        {view === "whisker" && (
          <BoxWhiskerChart routes={filteredRoutes} selectedId={selectedId} onSelect={onSelect} />
        )}
        {view === "scatter" && (
          <ScatterChart routes={filteredRoutes} selectedId={selectedId} onSelect={onSelect} />
        )}
        {view === "decompose" && (
          <WaterfallChart route={selectedRoute} />
        )}
        {view === "heat" && (
          <HeatmapGrid routes={filteredRoutes} selectedId={selectedId} onSelect={onSelect} />
        )}
        {view === "markets" && (
          <MultiCoinChart coins={chartCoins} onCoinsChange={setChartCoins} />
        )}
      </div>
    </div>
  );
}

// ─── Command Center (Left Panel) ──────────────────────────────────────────────

const EXAMPLE_INTENTS = [
  "Swap 2 ETH to SOL, best execution",
  "Bridge $1000 USDC Ethereum to Base",
  "Find best SOL → USDC route",
];

function CommandCenter({
  intentQuery,
  setIntentQuery,
  isAnalysing,
  intentResponse,
  onSubmit,
  onSelectExample,
}: {
  intentQuery: string;
  setIntentQuery: (v: string) => void;
  isAnalysing: boolean;
  intentResponse: IntentResponse | null;
  onSubmit: () => void;
  onSelectExample: (ex: string) => void;
}) {
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isAnalysing && intentQuery.trim()) onSubmit();
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center gap-2.5">
        <div className="inline-flex rounded-lg border border-white/[0.07] bg-white/[0.04] p-1.5">
          <TerminalSquare className="h-3.5 w-3.5 text-solviolet" />
        </div>
        <div>
          <p className="text-xs font-semibold text-white/65">Command Center</p>
          <p className="text-[10px] text-white/30">Natural language routing</p>
        </div>
      </div>

      <div className="relative">
        <textarea
          rows={4}
          value={intentQuery}
          onChange={(e) => setIntentQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Describe your trade in plain English…"
          className="terminal w-full resize-none p-3 font-mono text-xs text-white/80 placeholder:text-white/20 focus:outline-none"
        />
        <button
          type="button"
          disabled={isAnalysing || !intentQuery.trim()}
          onClick={onSubmit}
          className="btn-gradient absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isAnalysing ? (
            <><Loader2 className="h-3 w-3 animate-spin" />Analysing</>
          ) : (
            <>Analyse<ArrowRight className="h-3 w-3" /></>
          )}
        </button>
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-[0.24em] text-white/25">Try</p>
        {EXAMPLE_INTENTS.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => onSelectExample(ex)}
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-left font-mono text-[10px] text-white/40 transition hover:border-solviolet/30 hover:bg-solviolet/[0.06] hover:text-white/70"
          >
            {ex}
          </button>
        ))}
      </div>

      {intentResponse && (
        <div className="mt-auto rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 space-y-1.5">
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/25">Parsed</p>
          <p className="font-mono text-xs text-solmint">{intentResponse.parsed_intent}</p>
          <div className="flex flex-wrap gap-1.5">
            {intentResponse.asset_from && (
              <span className="rounded-full border border-white/[0.07] bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] text-white/45">
                {intentResponse.asset_from}
              </span>
            )}
            {intentResponse.asset_to && (
              <span className="rounded-full border border-white/[0.07] bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] text-white/45">
                → {intentResponse.asset_to}
              </span>
            )}
            {intentResponse.amount_usd && (
              <span className="rounded-full border border-white/[0.07] bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] text-white/45">
                ~${intentResponse.amount_usd.toLocaleString()}
              </span>
            )}
            <span className="rounded-full border border-white/[0.07] bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] text-white/35">
              {intentResponse.total} route{intentResponse.total !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inner Layout ─────────────────────────────────────────────────────────────

function MissionControlInner() {
  const searchParams = useSearchParams();

  const runtime = useCopilotRuntime();
  const {
    selectedOpportunity,
    execution,
    eventLog,
    executionModeConfigured,
    hummingbotStatus,
    hummingbotPresentation,
    marketDataPresentation,
    executionEnginePresentation,
    fallbackPresentation,
    demoSessionPresentation,
    isExecuting,
    executeSelectedOpportunity,
    selectOpportunity,
  } = runtime;

  // Intent state
  const [intentQuery, setIntentQuery] = useState(searchParams.get("intent") ?? "");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [intentResponse, setIntentResponse] = useState<IntentResponse | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [analyseError, setAnalyseError] = useState<string | null>(null);

  // Chain filter + matrix state
  const [chainFilter, setChainFilter] = useState<Set<string>>(new Set());

  // Compute chain counts from current intent response
  const chainCounts = useMemo(() => {
    const routes = intentResponse?.opportunities ?? [];
    return CHAINS.map((chain) => ({
      ...chain,
      count: routes.filter(
        (r) =>
          r.buy_chain.toLowerCase().includes(chain.name.toLowerCase()) ||
          r.sell_chain.toLowerCase().includes(chain.name.toLowerCase()),
      ).length,
    }));
  }, [intentResponse]);

  const autoSubmittedRef = useRef(false);
  useEffect(() => {
    const initial = searchParams.get("intent");
    if (initial && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      void handleSubmitIntent(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmitIntent(query?: string) {
    const q = (query ?? intentQuery).trim();
    if (!q) return;
    setIsAnalysing(true);
    setAnalyseError(null);
    try {
      const result = await analyseIntent(q);
      setIntentResponse(result);
      setChainFilter(new Set()); // reset filters on new search
      if (result.opportunities.length > 0) {
        const first = result.opportunities[0];
        setSelectedRouteId(first.id);
        selectOpportunity(first.id);
      } else {
        setSelectedRouteId(null);
      }
    } catch {
      setAnalyseError("Intent analysis failed. Is the backend running?");
    } finally {
      setIsAnalysing(false);
    }
  }

  function handleSelectExample(ex: string) {
    setIntentQuery(ex);
    void handleSubmitIntent(ex);
  }

  function handleSelectRoute(opp: Opportunity) {
    setSelectedRouteId(opp.id);
    selectOpportunity(opp.id);
  }

  function toggleChain(name: string) {
    setChainFilter((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div
      className="grid h-screen w-screen overflow-hidden bg-background text-foreground"
      style={{
        gridTemplateRows: "68px 1fr 220px",
        gridTemplateColumns: "320px 1fr 380px",
        gridTemplateAreas: `
          "header header header"
          "left   center right"
          "bottom bottom bottom"
        `,
      }}
    >
      {/* ── Header ── */}
      <header
        className="flex items-center gap-3 border-b border-white/[0.07] bg-[#080B11]/95 px-4"
        style={{ gridArea: "header" }}
      >
        {/* Logo */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="relative h-7 w-7 overflow-hidden rounded-lg ring-1 ring-white/10">
            <Image
              src="/owlsightlogo.jpg"
              alt="OwlSight logo"
              fill
              priority
              sizes="28px"
              className="object-cover"
            />
          </div>
          <span className="text-xs font-semibold text-white">OwlSight</span>
          <span className="rounded-full border border-solviolet/30 bg-solviolet/10 px-2.5 py-0.5 text-xs font-semibold text-white">
            Mission Control
          </span>
        </div>

        <div className="mx-2 h-4 w-px shrink-0 bg-white/[0.08]" />

        {/* Chain filter buttons */}
        <div className="flex items-center gap-1.5">
          {chainCounts.map((chain) => (
            <ChainFilterBadge
              key={chain.name}
              chain={chain}
              count={chain.count}
              isActive={chainFilter.has(chain.name)}
              onToggle={() => toggleChain(chain.name)}
            />
          ))}
          {chainFilter.size > 0 && (
            <button
              type="button"
              onClick={() => setChainFilter(new Set())}
              className="flex items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="h-2.5 w-2.5" />
              All
            </button>
          )}
        </div>

        {/* Status bar */}
        <div className="ml-auto shrink-0">
          <StatusSummaryBar
            compact
            marketProviderLabel={marketDataPresentation.label}
            marketProviderDetail={marketDataPresentation.detail}
            marketProviderTone={marketDataPresentation.tone}
            executionEngineLabel={executionEnginePresentation.label}
            executionEngineDetail={executionEnginePresentation.detail}
            executionEngineTone={executionEnginePresentation.tone}
            hummingbotLabel={hummingbotPresentation.label}
            hummingbotDetail={hummingbotPresentation.detail}
            hummingbotTone={hummingbotPresentation.tone}
            fallbackLabel={fallbackPresentation.label}
            fallbackDetail={fallbackPresentation.detail}
            fallbackTone={fallbackPresentation.tone}
            demoSessionLabel={demoSessionPresentation.label}
            demoSessionDetail={demoSessionPresentation.detail}
            demoSessionTone={demoSessionPresentation.tone}
          />
        </div>
      </header>

      {/* ── Left: Command Center ── */}
      <aside
        className="overflow-hidden border-r border-white/[0.07] bg-[#080B11]"
        style={{ gridArea: "left" }}
      >
        <CommandCenter
          intentQuery={intentQuery}
          setIntentQuery={setIntentQuery}
          isAnalysing={isAnalysing}
          intentResponse={intentResponse}
          onSubmit={() => void handleSubmitIntent()}
          onSelectExample={handleSelectExample}
        />
        {analyseError && (
          <div className="mx-4 mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-400">
            {analyseError}
          </div>
        )}
      </aside>

      {/* ── Center: Route Intelligence Matrix ── */}
      <main
        className="overflow-hidden border-r border-white/[0.07] bg-[#060910]"
        style={{ gridArea: "center" }}
      >
        <RouteIntelligenceMatrix
          intentResponse={intentResponse}
          chainFilter={chainFilter}
          selectedId={selectedRouteId}
          onSelect={handleSelectRoute}
        />
      </main>

      {/* ── Right: Analyzer ── */}
      <aside
        className="flex flex-col overflow-hidden bg-[#080B11]"
        style={{ gridArea: "right" }}
      >
        <div className="flex-1 overflow-y-auto">
          {intentResponse ? (
            <>
              <RouteInspector
                opportunity={selectedOpportunity ?? null}
                hummingbotStatus={hummingbotStatus}
                executionModeConfigured={executionModeConfigured}
                isExecuting={isExecuting}
                onExecute={executeSelectedOpportunity}
              />
              {selectedOpportunity?.monte_carlo && (
                <div className="border-t border-white/[0.07] p-4">
                  <MonteCarloPanel mc={selectedOpportunity.monte_carlo} />
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="inline-flex rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                <Radar className="h-6 w-6 text-white/15" />
              </div>
              <div>
                <p className="text-xs font-medium text-white/30">Decision Engine</p>
                <p className="mt-1 text-[10px] text-white/20">
                  Submit an intent to analyse a route
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="border-t border-white/[0.07] p-4">
          <button
            type="button"
            disabled={
              !intentResponse ||
              !selectedOpportunity ||
              selectedOpportunity.approval_stage !== "approved" ||
              isExecuting
            }
            onClick={executeSelectedOpportunity}
            className="btn-gradient w-full rounded-xl py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            {isExecuting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Executing…
              </span>
            ) : (
              "Execute Trade"
            )}
          </button>
        </div>
      </aside>

      {/* ── Bottom: Execution Terminal ── */}
      <footer
        className="grid overflow-hidden border-t border-white/[0.07] bg-[#060910]"
        style={{ gridArea: "bottom", gridTemplateColumns: "1fr 1fr" }}
      >
        <div className="overflow-y-auto border-r border-white/[0.07] p-3">
          <ExecutionTimeline
            execution={execution}
            opportunity={selectedOpportunity ?? null}
            executionModeConfigured={executionModeConfigured}
            hummingbotPresentation={hummingbotPresentation}
          />
        </div>
        <div className="overflow-y-auto p-3">
          <EventLogPanel entries={eventLog} />
        </div>
      </footer>
    </div>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export function MissionControlPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-white/30" />
        </div>
      }
    >
      <MissionControlInner />
    </Suspense>
  );
}
