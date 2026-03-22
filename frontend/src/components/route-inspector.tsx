"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowRightLeft,
  Bot,
  CircleDollarSign,
  ShieldAlert,
  Timer,
  Waves,
} from "lucide-react";

import {
  formatBps,
  formatCurrency,
  formatDuration,
  formatLatency,
  formatPercent,
} from "@/lib/format";
import type {
  HummingbotStatus,
  Opportunity,
  RequestedExecutionMode,
} from "@/lib/types";

interface RouteInspectorProps {
  opportunity: Opportunity | null;
  hummingbotStatus: HummingbotStatus | null;
  executionModeConfigured: RequestedExecutionMode;
  isExecuting: boolean;
  onExecute: () => void;
}

const pipelineSteps = [
  "Detected",
  "Simulated",
  "Scored",
  "Verdict",
  "Routed",
  "Executed",
];

const inspectorTabs = ["Overview", "Costs", "Execution"] as const;
type InspectorTab = (typeof inspectorTabs)[number];

function DataRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  const valClass =
    tone === "positive"
      ? "text-solmint"
      : tone === "negative"
      ? "text-amber-400"
      : "text-white/80";

  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.05] py-2.5 last:border-0">
      <span className="text-xs text-white/40">{label}</span>
      <span className={`font-mono text-xs font-semibold tabular-nums ${valClass}`}>
        {value}
      </span>
    </div>
  );
}

export function RouteInspector({
  opportunity,
  hummingbotStatus,
  executionModeConfigured,
  isExecuting,
  onExecute,
}: RouteInspectorProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>("Overview");

  if (!opportunity) {
    return (
      <div className="panel flex min-h-[280px] items-center justify-center p-8 text-center">
        <div>
          <div className="mx-auto mb-4 inline-flex rounded-xl border border-white/[0.08] bg-white/[0.04] p-3">
            <ArrowRightLeft className="h-5 w-5 text-white/30" />
          </div>
          <p className="text-sm text-white/35">
            Select a route to inspect its trade logic, cost structure, and
            execution handoff.
          </p>
        </div>
      </div>
    );
  }

  const isPaperTradeReady =
    executionModeConfigured === "paper_hummingbot" &&
    hummingbotStatus?.state === "connected";
  const executionBadge = opportunity.execute
    ? isPaperTradeReady
      ? "Paper Trade Ready"
      : executionModeConfigured === "paper_hummingbot"
        ? "Mock Fallback Ready"
        : "Mock Execution Ready"
    : "Execution Blocked";
  const executionTarget = !opportunity.execute
    ? "No execution handoff"
    : isPaperTradeReady
      ? "Hummingbot paper trade"
      : executionModeConfigured === "paper_hummingbot"
        ? "Mock fallback"
        : "Mock execution engine";

  return (
    <div className="panel p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/35">
            Decision Engine
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {opportunity.asset_symbol} trade analysis
          </h2>
          <p className="mt-1 max-w-lg text-xs text-white/40">
            Buy on {opportunity.buy_venue}, bridge via {opportunity.bridge_name},
            exit on {opportunity.sell_venue}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide ${
              opportunity.execute ? "badge-mint" : "badge-amber"
            }`}
          >
            {opportunity.execute ? "Approved" : "Blocked"}
          </span>
          <span className="badge-violet rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide">
            {executionBadge}
          </span>
        </div>
      </div>

      {/* Verdict card */}
      <div
        className={`mt-4 rounded-xl border p-4 ${
          opportunity.execute
            ? "border-solmint/20 bg-solmint/[0.05]"
            : "border-amber-500/20 bg-amber-500/[0.05]"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className={`text-[10px] uppercase tracking-[0.28em] ${opportunity.execute ? "text-solmint/70" : "text-amber-400/70"}`}>
              Final Verdict
            </p>
            <h3 className={`mt-1 text-2xl font-semibold ${opportunity.execute ? "text-solmint" : "text-amber-400"}`}>
              {opportunity.execute ? "APPROVED" : "REJECTED"}
            </h3>
          </div>
          {opportunity.execute ? (
            <Bot className="h-5 w-5 text-solmint" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-amber-400" />
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/[0.07] bg-white/[0.04] px-3 py-2.5">
            <p className="text-[9px] uppercase tracking-[0.22em] text-white/30">Net edge</p>
            <p className={`mt-1 font-mono text-lg font-semibold tabular-nums ${opportunity.expected_net_profit_usd > 0 ? "text-solmint" : "text-amber-400"}`}>
              {formatCurrency(opportunity.expected_net_profit_usd)}
            </p>
          </div>
          <div className="rounded-lg border border-white/[0.07] bg-white/[0.04] px-3 py-2.5">
            <p className="text-[9px] uppercase tracking-[0.22em] text-white/30">Confidence</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-white/80">
              {formatPercent(opportunity.confidence_score)}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-white/40">{opportunity.approval_reason}</p>
      </div>

      {/* Pipeline steps */}
      <div className="mt-4">
        <p className="text-[10px] uppercase tracking-[0.26em] text-white/30">Execution pipeline</p>
        <div className="mt-2.5 grid grid-cols-6 gap-1">
          {pipelineSteps.map((step, i) => {
            const active = i < 3 || (i === 3 && !!opportunity.approval_stage) || (i >= 4 && opportunity.execute);
            const isApproved = opportunity.execute || i < 4;
            return (
              <div
                key={step}
                className={`rounded-lg border py-3 px-2 text-center transition-colors ${
                  active
                    ? isApproved
                      ? "border-solmint/25 bg-solmint/[0.06]"
                      : "border-amber-400/25 bg-amber-400/[0.06]"
                    : "border-white/[0.05] bg-white/[0.02]"
                }`}
              >
                <p className={`text-[9px] tabular-nums ${active ? (isApproved ? "text-solmint" : "text-amber-400") : "text-white/20"}`}>
                  {i + 1}
                </p>
                <p className={`mt-1 text-[9px] font-semibold leading-tight ${active ? (isApproved ? "text-solmint/80" : "text-amber-400/80") : "text-white/25"}`}>
                  {step}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex gap-1.5 border-b border-white/[0.06] pb-4">
        {inspectorTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
              activeTab === tab
                ? "bg-solviolet text-white shadow-glow-violet-sm"
                : "border border-white/[0.07] bg-white/[0.04] text-white/45 hover:bg-white/[0.08] hover:text-white/70"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === "Overview" && (
        <div className="mt-4 space-y-3">
          {opportunity.route_legs.map((leg) => (
            <div
              key={`${leg.kind}-${leg.label}`}
              className="flex items-start justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white/75">{leg.label}</p>
                <p className="mt-0.5 text-xs text-white/35">{leg.detail}</p>
              </div>
              <span className="shrink-0 rounded-full border border-white/[0.07] bg-white/[0.04] px-2.5 py-1 text-[9px] uppercase tracking-wide text-white/35">
                {formatDuration(leg.expected_duration_sec)}
              </span>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
              <div className="flex items-center gap-1.5 text-white/35">
                <ArrowRightLeft className="h-3 w-3" />
                <span className="text-[9px] uppercase tracking-wide">Spread edge</span>
              </div>
              <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-white/80">
                {formatBps(opportunity.gross_spread_bps)}
              </p>
              <p className="mt-1 text-[10px] text-white/30">
                {formatCurrency(opportunity.notional_usd)} notional
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
              <div className="flex items-center gap-1.5 text-white/35">
                <Timer className="h-3 w-3" />
                <span className="text-[9px] uppercase tracking-wide">Bridge window</span>
              </div>
              <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-white/80">
                {formatLatency(opportunity.estimated_bridge_latency_sec)}
              </p>
              <p className="mt-1 text-[10px] text-white/30">{opportunity.bridge_name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Costs */}
      {activeTab === "Costs" && (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-2 text-white/35">
              <CircleDollarSign className="h-3.5 w-3.5" />
              <span className="text-[9px] uppercase tracking-wide">PnL equation</span>
            </div>
            <div className="mt-3">
              <DataRow label="Gross spread" value={formatCurrency(opportunity.gross_profit_usd)} tone="positive" />
              <DataRow label="− Trading fees" value={`−${formatCurrency(opportunity.estimated_fees_usd)}`} tone="negative" />
              <DataRow label="− Slippage" value={`−${formatCurrency(opportunity.cost_breakdown.slippage_cost_usd)}`} tone="negative" />
              <DataRow label="− Bridge + latency" value={`−${formatCurrency(opportunity.cost_breakdown.bridge_fee_usd + opportunity.cost_breakdown.latency_penalty_usd)}`} tone="negative" />
              <div className="mt-2 flex items-center justify-between gap-3 pt-2.5">
                <span className="text-xs font-semibold text-white/70">= Expected net edge</span>
                <span className={`font-mono text-sm font-bold tabular-nums ${opportunity.expected_net_profit_usd > 0 ? "text-solmint" : "text-amber-400"}`}>
                  {formatCurrency(opportunity.expected_net_profit_usd)}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Trading fees", value: opportunity.cost_breakdown.trading_fees_usd },
              { label: "Bridge fee", value: opportunity.cost_breakdown.bridge_fee_usd },
              { label: "Slippage cost", value: opportunity.cost_breakdown.slippage_cost_usd },
              { label: "Latency penalty", value: opportunity.cost_breakdown.latency_penalty_usd },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                <p className="text-[9px] text-white/35">{item.label}</p>
                <p className="mt-1.5 font-mono text-sm font-semibold tabular-nums text-white/75">
                  {formatCurrency(item.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Execution */}
      {activeTab === "Execution" && (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
            <p className="text-xs font-semibold text-white/65">{executionTarget}</p>
            <p className="mt-1 text-xs text-white/35">{opportunity.approval_reason}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
              <div className="flex items-center gap-1.5 text-white/35">
                <Waves className="h-3 w-3" />
                <span className="text-[9px] uppercase tracking-wide">Confidence</span>
              </div>
              <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-white/80">
                {formatPercent(opportunity.confidence_score)}
              </p>
              <p className="mt-1 text-[10px] text-white/30">
                Slippage: {formatBps(opportunity.estimated_slippage_bps)}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
              <div className="flex items-center gap-1.5 text-white/35">
                <ArrowRight className="h-3 w-3" />
                <span className="text-[9px] uppercase tracking-wide">Latency cost</span>
              </div>
              <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-white/80">
                {formatCurrency(opportunity.estimated_latency_penalty_usd)}
              </p>
              <p className="mt-1 text-[10px] text-white/30">
                {formatDuration(opportunity.estimated_bridge_latency_sec)} window
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
            <p className="text-[9px] uppercase tracking-wide text-white/30">Execution readiness</p>
            <p className="mt-2 text-xs text-white/55">
              {isPaperTradeReady
                ? "Hummingbot paper trade surface is connected and ready."
                : executionModeConfigured === "paper_hummingbot"
                  ? "Hummingbot unavailable — will fall back to mock execution."
                  : "Mock execution engine active."}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
