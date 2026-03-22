"use client";

import { ChevronDown, TerminalSquare } from "lucide-react";
import { useState } from "react";

import type { EventLogEntry } from "@/lib/types";
import { formatTime } from "@/lib/format";

interface EventLogPanelProps {
  entries: EventLogEntry[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

const levelMeta: Record<
  EventLogEntry["level"],
  { label: string; messageClass: string; tagClass: string }
> = {
  info: {
    label: "INFO",
    messageClass: "text-white/65",
    tagClass: "terminal-tag-info",
  },
  success: {
    label: "OK",
    messageClass: "text-solmint",
    tagClass: "terminal-tag-success",
  },
  warning: {
    label: "WARN",
    messageClass: "text-amber-300",
    tagClass: "terminal-tag-warning",
  },
};

export function EventLogPanel({
  entries,
  collapsible = false,
  defaultCollapsed = false,
}: EventLogPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-white/[0.07] bg-white/[0.04] p-1.5">
            <TerminalSquare className="h-3.5 w-3.5 text-solmint" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white/65">Activity log</p>
            <p className="text-[10px] text-white/30">{entries.length} events</p>
          </div>
        </div>
        {collapsible && (
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="btn-ghost inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
          >
            {collapsed ? "Expand" : "Collapse"}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`}
            />
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="terminal terminal-feed mt-4 overflow-hidden">
          <div className="terminal-feed-header">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400/80" />
              <span className="h-2 w-2 rounded-full bg-amber-400/80" />
              <span className="h-2 w-2 rounded-full bg-solmint/80" />
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/35">
              <span className="dot-pulse h-1.5 w-1.5 rounded-full bg-solmint" />
              activity.log
            </div>
            <span className="font-mono text-[10px] text-white/30">
              {entries.length.toString().padStart(3, "0")} lines
            </span>
          </div>
          <div className="terminal-feed-body space-y-1.5 font-mono text-xs">
            {entries.length ? (
              entries
                .slice()
                .reverse()
                .map((entry) => {
                  const meta = levelMeta[entry.level];
                  return (
                    <div
                      key={entry.id}
                      className="animate-fade-in terminal-log-row grid gap-2 rounded-lg border border-white/[0.05] px-3 py-2 md:grid-cols-[78px_58px_92px_1fr]"
                    >
                      <span className="text-white/30">{formatTime(entry.timestamp)}</span>
                      <span className={`terminal-log-tag ${meta.tagClass}`}>
                        {meta.label}
                      </span>
                      <span className="terminal-log-source uppercase tracking-[0.14em] text-white/35">
                        {entry.source.replace("_", ".")}
                      </span>
                      <span className={meta.messageClass}>{entry.message}</span>
                    </div>
                  );
                })
            ) : (
              <div className="px-3 py-6 text-center text-xs text-white/35">
                Awaiting events. Trigger a scenario to start the feed.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
