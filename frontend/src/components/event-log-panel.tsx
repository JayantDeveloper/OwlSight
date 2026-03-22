"use client";

import { Terminal } from "lucide-react";

import type { EventLogEntry } from "@/lib/types";
import { formatTime } from "@/lib/format";

interface EventLogPanelProps {
  entries: EventLogEntry[];
}

const levelMeta: Record<
  EventLogEntry["level"],
  { dot: string; label: string; msgColor: string | undefined }
> = {
  info:    { dot: "rgba(255,255,255,0.18)", label: "INF", msgColor: undefined },
  success: { dot: "#14F195",               label: "OK ",  msgColor: "#14F195" },
  warning: { dot: "#F59E0B",               label: "WRN", msgColor: "#F59E0B" },
};

export function EventLogPanel({ entries }: EventLogPanelProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className="flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-center gap-2.5">
          <Terminal className="h-3.5 w-3.5" style={{ color: "var(--txt-3)" }} />
          <p className="text-xs font-semibold" style={{ color: "var(--txt-2)" }}>Activity Log</p>
        </div>
        <span className="font-mono text-[10px]" style={{ color: "var(--txt-4)" }}>
          {entries.length.toString().padStart(3, "0")} events
        </span>
      </div>

      {/* Terminal body */}
      <div
        className="mx-3 my-3 flex flex-1 flex-col overflow-hidden rounded-xl"
        style={{ background: "var(--terminal-bg)", border: "1px solid var(--border)" }}
      >
        {/* Prompt bar */}
        <div
          className="flex shrink-0 items-center gap-2 border-b px-3 py-2"
          style={{ borderColor: "var(--border-sm)", background: "var(--surface-2)" }}
        >
          <span className="font-mono text-[10px]" style={{ color: "var(--txt-4)" }}>$</span>
          <span className="font-mono text-[10px]" style={{ color: "var(--txt-3)" }}>
            owlsight --monitor activity.log
          </span>
          {entries.length > 0 && (
            <span
              className="ml-auto h-2 w-1 animate-pulse"
              style={{ background: "#14F195", borderRadius: 1 }}
            />
          )}
        </div>

        {/* Log rows */}
        <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed">
          {entries.length ? (
            entries
              .slice()
              .reverse()
              .map((entry) => {
                const meta = levelMeta[entry.level];
                return (
                  <div
                    key={entry.id}
                    className="animate-fade-in group flex items-baseline gap-3 rounded px-1 py-[3px] transition-colors hover:bg-white/[0.03]"
                  >
                    {/* Timestamp */}
                    <span
                      className="w-[52px] shrink-0 tabular-nums"
                      style={{ color: "var(--txt-4)" }}
                    >
                      {formatTime(entry.timestamp)}
                    </span>

                    {/* Level dot */}
                    <span
                      className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: meta.dot }}
                    />

                    {/* Level label */}
                    <span
                      className="w-[24px] shrink-0 tracking-wide"
                      style={{ color: meta.dot === "rgba(255,255,255,0.18)" ? "var(--txt-3)" : meta.dot, opacity: 0.85 }}
                    >
                      {meta.label}
                    </span>

                    {/* Source */}
                    <span
                      className="w-[88px] shrink-0 truncate uppercase tracking-[0.12em]"
                      style={{ color: "var(--txt-3)", fontSize: "9px" }}
                    >
                      {entry.source.replace("_", ".")}
                    </span>

                    {/* Message */}
                    <span
                      style={{ color: meta.msgColor ?? "var(--txt-2)" }}
                    >
                      {entry.message}
                    </span>
                  </div>
                );
              })
          ) : (
            <div className="px-1 py-8 text-center" style={{ color: "var(--txt-4)" }}>
              awaiting events — trigger a scenario to start the feed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
