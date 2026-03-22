import {
  Activity,
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
  detected: "border-white/[0.07] bg-white/[0.03]",
  market_snapshot_received: "border-cyan-500/20 bg-cyan-500/[0.07] text-cyan-400",
  feasibility_started: "border-sky-500/20 bg-sky-500/[0.07] text-sky-400",
  slippage_modeled: "border-indigo-500/20 bg-indigo-500/[0.07] text-indigo-400",
  route_scored: "border-purple-500/20 bg-purple-500/[0.07] text-purple-400",
  decision_made: "border-white/[0.07] bg-white/[0.03]",
  simulated: "border-sky-500/20 bg-sky-500/[0.07] text-sky-400",
  approved: "border-solmint/20 bg-solmint/[0.06] text-solmint",
  handed_to_hummingbot: "border-cyan-500/20 bg-cyan-500/[0.07] text-cyan-400",
  paper_trade_running: "border-solviolet/20 bg-solviolet/[0.07] text-purple-400",
  mock_execution_running: "border-white/[0.07] bg-white/[0.03]",
  fallback: "border-amber-500/20 bg-amber-500/[0.07] text-amber-400",
  completed: "border-solmint/20 bg-solmint/[0.06] text-solmint",
  rejected: "border-amber-500/20 bg-amber-500/[0.07] text-amber-400",
};

export function ExecutionTimeline({
  execution,
  opportunity,
  executionModeConfigured: _executionModeConfigured,
  hummingbotPresentation,
}: ExecutionTimelineProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Fixed header */}
      <div
        className="flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.07] px-4 py-3"
        style={{ background: "var(--surface)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-white/[0.07] bg-white/[0.04] p-1.5">
            <Activity className="h-3.5 w-3.5 text-solviolet" />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--txt-2)" }}>Execution Lifecycle</p>
            <p className="text-[10px]" style={{ color: "var(--txt-3)" }}>Trade handoff &amp; status</p>
          </div>
        </div>
        <span className="badge-neutral rounded-full px-2.5 py-1 font-mono text-[10px]">
          {execution
            ? formatStatusLabel(execution.execution_mode)
            : hummingbotPresentation.detail}
        </span>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {!execution && !opportunity && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 font-mono text-xs" style={{ color: "var(--txt-3)" }}>
            Select an opportunity and trigger execution to see the lifecycle unfold.
          </div>
        )}

        {!execution && opportunity && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
            <p className="font-mono text-xs font-semibold" style={{ color: "var(--txt-2)" }}>Ready to execute</p>
            <p className="mt-1.5 font-mono text-xs" style={{ color: "var(--txt-3)" }}>
              Route simulated. Trigger execution to see the Hummingbot handoff and full lifecycle.
            </p>
          </div>
        )}

        {execution && (
          <>
            {/* Meta row */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Bot, label: "Mode", value: formatStatusLabel(execution.execution_mode) },
                { icon: Clock3, label: "Status", value: formatStatusLabel(execution.execution_status) },
                { icon: RadioTower, label: "Executor", value: execution.executor },
                { icon: Bot, label: "Connection", value: formatStatusLabel(execution.connection_status) },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3">
                  <div className="flex items-center gap-1.5" style={{ color: "var(--txt-4)" }}>
                    <item.icon className="h-3 w-3" />
                    <span className="font-mono text-[9px] uppercase tracking-wide">{item.label}</span>
                  </div>
                  <p className="mt-1.5 truncate font-mono text-xs font-semibold" style={{ color: "var(--txt-2)" }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Request ID + fallback badge */}
            <div className="flex gap-2">
              <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3">
                <div className="flex items-center gap-1.5" style={{ color: "var(--txt-4)" }}>
                  <FileCheck2 className="h-3 w-3" />
                  <span className="font-mono text-[9px] uppercase tracking-wide">Request ID</span>
                </div>
                <p className="mt-1 font-mono text-[10px] font-semibold tabular-nums" style={{ color: "var(--txt-2)" }}>
                  {execution.request_id ? formatRequestId(execution.request_id) : "—"}
                </p>
              </div>
              <div
                className={`shrink-0 rounded-xl border px-3 py-3 font-mono text-xs font-semibold ${
                  execution.fallback_used ? "badge-amber" : "badge-mint"
                }`}
              >
                {execution.fallback_used ? "Fallback" : "Primary path"}
              </div>
            </div>

            {/* Market data source */}
            {execution.market_data_status && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 font-mono text-xs" style={{ color: "var(--txt-3)" }}>
                Market snapshot from{" "}
                <span className="font-semibold" style={{ color: "var(--txt-2)" }}>
                  {formatProviderName(execution.market_data_status.actual_provider)}
                </span>
                . {execution.market_data_status.message}
              </div>
            )}

            {/* Fallback reason */}
            {execution.fallback_reason && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-3 py-3 font-mono text-xs text-amber-400">
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
                  className={`animate-slide-in-right rounded-xl border px-4 py-3 delay-${Math.min(i * 75, 500)} ${statusStyles[event.status] ?? "border-white/[0.07] bg-white/[0.03]"}`}
                  style={
                    !statusStyles[event.status] || statusStyles[event.status].includes("bg-white/[0.03]")
                      ? { color: "var(--txt-2)" }
                      : undefined
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      {event.status === "approved" ||
                      event.status === "completed" ||
                      event.status === "handed_to_hummingbot" ? (
                        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      ) : event.status === "fallback" || event.status === "rejected" ? (
                        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-semibold">{event.title}</p>
                        <p className="mt-0.5 font-mono text-[10px] opacity-60">{event.detail}</p>
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-[9px] uppercase tracking-wide opacity-40">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {execution.rejection_reason && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-3 py-3 font-mono text-xs text-amber-400">
                {execution.rejection_reason}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
