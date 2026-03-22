import { ArrowRight, Bot, Sparkles, TrendingUp, Waves } from "lucide-react";

import {
  formatCompactCurrency,
  formatLatency,
  formatPercent,
  formatProviderName,
  formatTime,
} from "@/lib/format";
import { EventLogEntry, ExecutionRun, Opportunity } from "@/lib/types";

interface LandingPreviewCardProps {
  opportunity: Opportunity | null;
  execution: ExecutionRun | null;
  recentEvents: EventLogEntry[];
}

export function LandingPreviewCard({
  opportunity,
  execution,
  recentEvents,
}: LandingPreviewCardProps) {
  return (
    <section className="panel overflow-hidden p-6 lg:p-8" id="live-preview">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-slate-400">
            Product Preview
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">
            See the trade before the trade happens
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-500">
            This is a live compact preview of the product experience. It surfaces one
            routed opportunity, the execution decision behind it, and the latest system
            trace without dropping users into the full operator workflow.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        {/* Opportunity card */}
        <div className="relative overflow-hidden rounded-[30px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-emerald-50 p-6">
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-violet-100 opacity-50 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-36 w-36 rounded-full bg-emerald-100 opacity-40 blur-3xl" />

          {opportunity ? (
            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-slate-500 shadow-sm">
                    <Waves className="h-3.5 w-3.5 text-emerald-500" />
                    {opportunity.source === "mock"
                      ? "Mock market snapshot"
                      : `${formatProviderName(opportunity.source)} live anchor`}
                  </div>
                  <h3 className="mt-4 text-3xl font-semibold text-slate-900">
                    {opportunity.asset_symbol} route opportunity
                  </h3>
                  <p className="mt-2 max-w-xl text-sm text-slate-500">
                    Buy on {opportunity.buy_venue} in {opportunity.buy_chain}, bridge
                    through {opportunity.bridge_name}, and exit on {opportunity.sell_venue} in{" "}
                    {opportunity.sell_chain}.
                  </p>
                </div>
                <div
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] ${
                    opportunity.execute
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {opportunity.execute ? "Trade approved" : "Trade blocked"}
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {[
                  { label: "Expected edge", value: formatCompactCurrency(opportunity.expected_net_profit_usd) },
                  { label: "Confidence", value: formatPercent(opportunity.confidence_score) },
                  { label: "Latency window", value: formatLatency(opportunity.estimated_bridge_latency_sec) },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
                      {stat.label}
                    </p>
                    <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs uppercase tracking-[0.24em]">Why it matters</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {opportunity.approval_reason}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <ArrowRight className="h-4 w-4 text-solviolet" />
                    <span className="text-xs uppercase tracking-[0.24em]">Decision path</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Detect signal, simulate hidden costs, score the route, then route
                    only the trades that still make sense.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-400 shadow-sm">
              Load the feed or run the live demo to populate the product preview.
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <Bot className="h-4 w-4 text-emerald-500" />
              <p className="text-xs uppercase tracking-[0.28em]">Execution intelligence</p>
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">
              {execution ? execution.executor : "Simulation staged"}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {execution
                ? execution.fallback_reason ??
                  "The execution layer has acknowledged the latest approved route."
                : "The platform has already simulated the route. Users still decide whether to continue into execution."}
            </p>
            <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-4">
              <div className="flex items-center gap-2 text-violet-400">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.22em]">Consumer promise</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-violet-700">
                The platform is built to stop bad trades caused by hidden fees, slippage,
                and bridge delays before users commit capital.
              </p>
            </div>
          </div>

          {/* Dark terminal trace – intentional contrast */}
          <div className="terminal p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
              Live decision trace
            </p>
            <div className="mt-4 space-y-3 font-mono text-sm">
              {recentEvents.length ? (
                recentEvents.map((entry) => (
                  <div
                    key={entry.id}
                    className="animate-fade-in rounded-xl border border-white/[0.04] bg-white/[0.03] px-4 py-3 text-slate-300"
                  >
                    <div className="flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.2em] text-slate-600">
                      <span>{entry.source}</span>
                      <span>{formatTime(entry.timestamp)}</span>
                    </div>
                    <p className="mt-2">{entry.message}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-6 text-slate-600">
                  No recent trace yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
