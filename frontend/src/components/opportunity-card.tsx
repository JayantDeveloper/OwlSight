import { ArrowRight, ShieldCheck, ShieldX, Timer } from "lucide-react";

import {
  formatBps,
  formatCurrency,
  formatLatency,
  formatPercent,
} from "@/lib/format";
import type { Opportunity } from "@/lib/types";

interface OpportunityCardProps {
  opportunity: Opportunity;
  selected: boolean;
  onSelect: (opportunityId: string) => void;
}

export function OpportunityCard({
  opportunity,
  selected,
  onSelect,
}: OpportunityCardProps) {
  const isLiveSource = opportunity.source !== "mock";
  const profitPositive = opportunity.expected_net_profit_usd > 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(opportunity.id)}
      className={`w-full min-w-0 rounded-2xl border px-5 py-5 text-left transition-all duration-200 ${
        selected
          ? "border-solviolet/50 bg-solviolet/[0.07] shadow-glow-violet-sm"
          : "border-white/[0.07] bg-surface hover:border-white/[0.13] hover:bg-surface-2"
      }`}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.28em] text-white/35">
              {opportunity.asset_symbol}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide ${
                isLiveSource ? "badge-mint" : "badge-violet"
              }`}
            >
              {isLiveSource ? "LIVE" : "MOCK"}
            </span>
          </div>
          <div className="mt-2 flex min-w-0 items-center gap-2">
            <span className="text-base font-semibold text-white">
              {opportunity.buy_chain}
            </span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/25" />
            <span className="text-base font-semibold text-white">
              {opportunity.sell_chain}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-white/35">
            {opportunity.buy_venue} → {opportunity.sell_venue} via{" "}
            {opportunity.bridge_name}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
            opportunity.execute ? "badge-mint" : "badge-amber"
          }`}
        >
          {opportunity.execute ? "Approved" : "Blocked"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.03] px-3 py-2.5">
          <p className="text-[9px] uppercase tracking-[0.22em] text-white/30">Net PnL</p>
          <p
            className={`mt-1 font-mono text-base font-semibold tabular-nums ${
              profitPositive ? "text-solmint" : "text-amber-400"
            }`}
          >
            {formatCurrency(opportunity.expected_net_profit_usd)}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.03] px-3 py-2.5">
          <p className="text-[9px] uppercase tracking-[0.22em] text-white/30">Spread</p>
          <p className="mt-1 font-mono text-base font-semibold tabular-nums text-white/80">
            {formatBps(opportunity.gross_spread_bps)}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.03] px-3 py-2.5">
          <p className="text-[9px] uppercase tracking-[0.22em] text-white/30">Confidence</p>
          <p className="mt-1 font-mono text-base font-semibold tabular-nums text-white/80">
            {formatPercent(opportunity.confidence_score)}
          </p>
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-white/30">
        <div className="flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5" />
          <span>{formatLatency(opportunity.estimated_bridge_latency_sec)} bridge</span>
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          {opportunity.execute ? (
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-solmint" />
          ) : (
            <ShieldX className="h-3.5 w-3.5 shrink-0 text-amber-400" />
          )}
          <span className="truncate text-white/30">{opportunity.approval_reason}</span>
        </div>
      </div>
    </button>
  );
}
