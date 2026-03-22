"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Download, Radar } from "lucide-react";
import Link from "next/link";

interface ExecutionRecord {
  id: string;
  executionId: string;
  assetSymbol: string;
  buyChain: string;
  sellChain: string;
  bridgeName: string;
  notionalUsd: number;
  expectedNetProfitUsd: number;
  confidenceScore: number;
  executionModeUsed: string;
  status: string;
  fallbackReason: string | null;
  rejectionReason: string | null;
  timeline: string | null;
  startedAt: string;
  completedAt: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  completed: "#14F195",
  rejected: "#F59E0B",
  fallback: "#9945FF",
};
const STATUS_LABEL: Record<string, string> = {
  completed: "COMPLETED",
  rejected: "REJECTED",
  fallback: "FALLBACK",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function exportCsv(records: ExecutionRecord[]) {
  const headers = [
    "Date",
    "Asset",
    "Buy Chain",
    "Sell Chain",
    "Bridge",
    "Notional USD",
    "Net Profit USD",
    "Confidence",
    "Mode",
    "Status",
  ];
  const rows = records.map((r) => [
    formatDate(r.startedAt),
    r.assetSymbol,
    r.buyChain,
    r.sellChain,
    r.bridgeName,
    r.notionalUsd.toFixed(2),
    r.expectedNetProfitUsd.toFixed(2),
    (r.confidenceScore * 100).toFixed(1) + "%",
    r.executionModeUsed,
    r.status,
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "owlsight-executions.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function StatusBadge({ status, completedAt }: { status: string; completedAt: string | null }) {
  if (!completedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
        <span style={{ color: "#F59E0B" }}>PENDING</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: STATUS_COLOR[status] ?? "#9945FF" }}
      />
      <span style={{ color: STATUS_COLOR[status] ?? "var(--txt-3)" }}>
        {STATUS_LABEL[status] ?? status.toUpperCase()}
      </span>
    </span>
  );
}

function ExpandedRow({ record }: { record: ExecutionRecord }) {
  const timeline = useMemo(() => {
    if (!record.timeline) return [];
    try {
      return JSON.parse(record.timeline) as Array<{ step: string; status: string; timestamp?: string; details?: string }>;
    } catch {
      return [];
    }
  }, [record.timeline]);

  return (
    <tr style={{ background: "var(--surface-2)" }}>
      <td colSpan={7} className="px-6 py-5">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Meta */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--txt-4)" }}>
              Execution Details
            </p>
            <div className="space-y-2 text-xs" style={{ color: "var(--txt-3)" }}>
              <div className="flex justify-between">
                <span style={{ color: "var(--txt-4)" }}>Execution ID</span>
                <span className="font-mono">{record.executionId}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--txt-4)" }}>Bridge</span>
                <span>{record.bridgeName || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--txt-4)" }}>Notional</span>
                <span>${record.notionalUsd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--txt-4)" }}>Confidence</span>
                <span>{(record.confidenceScore * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--txt-4)" }}>Mode</span>
                <span className="capitalize">{record.executionModeUsed}</span>
              </div>
              {record.completedAt && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--txt-4)" }}>Completed</span>
                  <span>{formatDate(record.completedAt)}</span>
                </div>
              )}
              {record.rejectionReason && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--txt-4)" }}>Rejection</span>
                  <span className="text-right" style={{ color: "#F59E0B" }}>{record.rejectionReason}</span>
                </div>
              )}
              {record.fallbackReason && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--txt-4)" }}>Fallback</span>
                  <span className="text-right" style={{ color: "#9945FF" }}>{record.fallbackReason}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          {timeline.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--txt-4)" }}>
                Execution Timeline
              </p>
              <div className="space-y-2">
                {timeline.map((t, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{
                        background:
                          t.status === "completed" || t.status === "success"
                            ? "#14F195"
                            : t.status === "failed"
                            ? "#F59E0B"
                            : "#9945FF",
                      }}
                    />
                    <div>
                      <p className="text-xs font-medium" style={{ color: "var(--txt-2)" }}>
                        {t.step}
                      </p>
                      {t.details && (
                        <p className="text-[10px]" style={{ color: "var(--txt-4)" }}>
                          {t.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

export function ExecutionHistory({ executions }: { executions: ExecutionRecord[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [assetFilter, setAssetFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortKey, setSortKey] = useState<"date" | "profit" | "confidence">("date");

  const filtered = useMemo(() => {
    let list = [...executions];
    if (statusFilter) list = list.filter((e) => e.status === statusFilter);
    if (assetFilter) list = list.filter((e) => e.assetSymbol.toLowerCase().includes(assetFilter.toLowerCase()));
    if (fromDate) list = list.filter((e) => new Date(e.startedAt) >= new Date(fromDate));
    if (toDate) list = list.filter((e) => new Date(e.startedAt) <= new Date(toDate + "T23:59:59"));
    list.sort((a, b) => {
      if (sortKey === "profit") return b.expectedNetProfitUsd - a.expectedNetProfitUsd;
      if (sortKey === "confidence") return b.confidenceScore - a.confidenceScore;
      return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
    });
    return list;
  }, [executions, statusFilter, assetFilter, fromDate, toDate, sortKey]);

  if (executions.length === 0) {
    return (
      <div
        className="rounded-2xl border px-6 py-16 text-center"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <Radar className="mx-auto mb-4 h-8 w-8 opacity-20" style={{ color: "var(--txt-3)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--txt-2)" }}>No executions yet</p>
        <p className="mt-1 text-xs" style={{ color: "var(--txt-4)" }}>
          Run an intent in{" "}
          <Link href="/app" className="text-solviolet hover:underline">
            Mission Control
          </Link>{" "}
          to see your execution history here.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div
        className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border px-3 py-1.5 text-xs"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface-2)",
            color: "var(--txt-2)",
          }}
        >
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
          <option value="fallback">Fallback</option>
        </select>

        <input
          type="text"
          placeholder="Filter by asset…"
          value={assetFilter}
          onChange={(e) => setAssetFilter(e.target.value)}
          className="rounded-lg border px-3 py-1.5 text-xs"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface-2)",
            color: "var(--txt-2)",
          }}
        />

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="rounded-lg border px-3 py-1.5 text-xs"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface-2)",
            color: "var(--txt-2)",
          }}
        />
        <span className="text-xs" style={{ color: "var(--txt-4)" }}>to</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="rounded-lg border px-3 py-1.5 text-xs"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface-2)",
            color: "var(--txt-2)",
          }}
        />

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as "date" | "profit" | "confidence")}
          className="rounded-lg border px-3 py-1.5 text-xs"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface-2)",
            color: "var(--txt-2)",
          }}
        >
          <option value="date">Sort: Date</option>
          <option value="profit">Sort: Net Profit</option>
          <option value="confidence">Sort: Confidence</option>
        </select>

        <button
          onClick={() => exportCsv(filtered)}
          className="ml-auto flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/[0.05]"
          style={{ borderColor: "var(--border)", color: "var(--txt-3)" }}
        >
          <Download className="h-3 w-3" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)" }}>
        {filtered.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm" style={{ color: "var(--txt-3)" }}>No results match your filters.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b text-xs"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                <th className="w-6 px-3 py-3" />
                {["Asset", "Route", "Net P&L", "Confidence", "Mode", "Status", "Date"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-medium"
                    style={{ color: "var(--txt-4)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => {
                const isExpanded = expandedId === e.id;
                const pnlPos = e.expectedNetProfitUsd > 0;
                return (
                  <>
                    <tr
                      key={e.id}
                      className="cursor-pointer border-b transition-colors hover:bg-white/[0.02]"
                      style={{
                        borderColor: "var(--border)",
                        background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
                      }}
                      onClick={() => setExpandedId(isExpanded ? null : e.id)}
                    >
                      <td className="px-3 py-3">
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--txt-4)" }} />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" style={{ color: "var(--txt-4)" }} />
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold" style={{ color: "var(--txt-1)" }}>
                        {e.assetSymbol}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--txt-3)" }}>
                        {e.buyChain} → {e.sellChain}
                      </td>
                      <td
                        className="px-4 py-3 font-semibold tabular-nums"
                        style={{ color: pnlPos ? "#14F195" : "var(--txt-3)" }}
                      >
                        {pnlPos ? "+" : ""}${e.expectedNetProfitUsd.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-xs" style={{ color: "var(--txt-3)" }}>
                        {(e.confidenceScore * 100).toFixed(0)}%
                      </td>
                      <td className="px-4 py-3 text-xs capitalize" style={{ color: "var(--txt-4)" }}>
                        {e.executionModeUsed}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={e.status} completedAt={e.completedAt} />
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--txt-4)" }}>
                        {formatDate(e.startedAt)}
                      </td>
                    </tr>
                    {isExpanded && <ExpandedRow key={`${e.id}-expanded`} record={e} />}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-2 text-right text-xs" style={{ color: "var(--txt-4)" }}>
        {filtered.length} of {executions.length} records
      </p>
    </div>
  );
}
