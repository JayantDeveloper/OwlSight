import {
  Bot,
  Clock3,
  FileCheck2,
  RadioTower,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import {
  formatProviderName,
  formatRequestId,
  formatStatusLabel,
  formatTime,
} from "@/lib/format";
import type {
  ExecutionRun,
  Opportunity,
  RequestedExecutionMode,
} from "@/lib/types";
import type { HummingbotPresentationStatus } from "@/lib/use-copilot-runtime";

interface ExecutionTimelineProps {
  execution: ExecutionRun | null;
  opportunity: Opportunity | null;
  executionModeConfigured: RequestedExecutionMode;
  hummingbotPresentation: HummingbotPresentationStatus;
}

const statusStyles: Record<string, string> = {
  detected: "border-white/[0.07] bg-white/[0.03] text-white/60",
  market_snapshot_received: "border-cyan-500/20 bg-cyan-500/[0.07] text-cyan-400",
  feasibility_started: "border-sky-500/20 bg-sky-500/[0.07] text-sky-400",
  slippage_modeled: "border-indigo-500/20 bg-indigo-500/[0.07] text-indigo-400",
  route_scored: "border-purple-500/20 bg-purple-500/[0.07] text-purple-400",
  decision_made: "border-white/[0.07] bg-white/[0.03] text-white/60",
  simulated: "border-sky-500/20 bg-sky-500/[0.07] text-sky-400",
  approved: "border-solmint/20 bg-solmint/[0.06] text-solmint",
  handed_to_hummingbot: "border-cyan-500/20 bg-cyan-500/[0.07] text-cyan-400",
  paper_trade_running: "border-solviolet/20 bg-solviolet/[0.07] text-purple-400",
  mock_execution_running: "border-white/[0.07] bg-white/[0.03] text-white/60",
  fallback: "border-amber-500/20 bg-amber-500/[0.07] text-amber-400",
  completed: "border-solmint/20 bg-solmint/[0.06] text-solmint",
  rejected: "border-amber-500/20 bg-amber-500/[0.07] text-amber-400",
};

export function ExecutionTimeline({
  execution,
  opportunity,
  executionModeConfigured,
  hummingbotPresentation,
}: ExecutionTimelineProps) {
  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/35">
            Execution Lifecycle
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">
            Trade execution
          </h2>
        </div>
        <span className="badge-neutral rounded-full px-3 py-1 text-[10px] uppercase tracking-wide">
          {execution
            ? formatStatusLabel(execution.execution_mode)
            : hummingbotPresentation.detail}
        </span>
      </div>

      <div className="mt-4">
        {!execution && !opportunity && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-sm text-white/35">
            Select an opportunity and trigger execution to see the lifecycle unfold.
          </div>
        )}

        {!execution && opportunity && (
          <div className="space-y-3">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-white/60">Ready to execute</p>
              <p className="mt-1.5 text-xs text-white/35">
                The route has been simulated. Trigger execution to see the
                Hummingbot handoff and full lifecycle.
              </p>
            </div>
          </div>
        )}

        {execution && (
          <div className="space-y-3">
            {/* Meta row */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Bot, label: "Mode", value: formatStatusLabel(execution.execution_mode) },
                { icon: Clock3, label: "Status", value: formatStatusLabel(execution.execution_status) },
                { icon: RadioTower, label: "Executor", value: execution.executor },
                { icon: Bot, label: "Connection", value: formatStatusLabel(execution.connection_status) },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3">
                  <div className="flex items-center gap-1.5 text-white/30">
                    <item.icon className="h-3 w-3" />
                    <span className="text-[9px] uppercase tracking-wide">{item.label}</span>
                  </div>
                  <p className="mt-1.5 truncate text-xs font-semibold text-white/70">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Request ID + fallback badge */}
            <div className="flex gap-2">
              <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3">
                <div className="flex items-center gap-1.5 text-white/30">
                  <FileCheck2 className="h-3 w-3" />
                  <span className="text-[9px] uppercase tracking-wide">Request ID</span>
                </div>
                <p className="mt-1 font-mono text-[10px] font-semibold tabular-nums text-white/55">
                  {execution.request_id
                    ? formatRequestId(execution.request_id)
                    : "—"}
                </p>
              </div>
              <div
                className={`shrink-0 rounded-xl border px-3 py-3 text-xs font-semibold ${
                  execution.fallback_used ? "badge-amber" : "badge-mint"
                }`}
              >
                {execution.fallback_used ? "Fallback" : "Primary path"}
              </div>
            </div>

            {/* Market data source */}
            {execution.market_data_status && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 text-xs text-white/40">
                Market snapshot from{" "}
                <span className="font-semibold text-white/65">
                  {formatProviderName(execution.market_data_status.actual_provider)}
                </span>
                . {execution.market_data_status.message}
              </div>
            )}

            {/* Fallback reason */}
            {execution.fallback_reason && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-3 py-3 text-xs text-amber-400">
                <div className="flex items-start gap-2">
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Failover active</p>
                    <p className="mt-0.5 opacity-75">{execution.fallback_reason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline events */}
            <div className="space-y-2">
              {execution.timeline_events.map((event, i) => (
                <div
                  key={`${event.status}-${event.timestamp}`}
                  className={`animate-slide-in-right rounded-xl border px-4 py-3 delay-${Math.min(i * 75, 500)} ${statusStyles[event.status] ?? "border-white/[0.07] bg-white/[0.03] text-white/60"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      {event.status === "approved" ||
                      event.status === "completed" ||
                      event.status === "handed_to_hummingbot" ? (
                        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      ) : event.status === "fallback" ||
                        event.status === "rejected" ? (
                        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold">{event.title}</p>
                        <p className="mt-0.5 text-[10px] opacity-60">{event.detail}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-[9px] uppercase tracking-wide opacity-40">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {execution.rejection_reason && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-3 py-3 text-xs text-amber-400">
                {execution.rejection_reason}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
