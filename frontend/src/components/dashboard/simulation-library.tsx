"use client";

import { useState, useMemo, useTransition } from "react";
import { BookMarked, Download, Pin, Trash2, Radar } from "lucide-react";
import Link from "next/link";

interface SavedSimulation {
  id: string;
  opportunityId: string;
  assetSymbol: string;
  buyChain: string;
  buyVenue: string;
  sellChain: string;
  sellVenue: string;
  bridgeName: string;
  notionalUsd: number;
  grossSpreadBps: number;
  expectedNetProfitUsd: number;
  confidenceScore: number;
  estimatedFeesUsd: number;
  estimatedSlippageBps: number;
  estimatedBridgeLatencySec: number;
  approvalStage: string;
  approvalReason: string | null;
  label: string | null;
  notes: string | null;
  pinned: boolean;
  savedAt: string;
}

function exportCsv(sims: SavedSimulation[]) {
  const headers = [
    "Date",
    "Asset",
    "Buy Chain",
    "Sell Chain",
    "Bridge",
    "Notional USD",
    "Net Profit USD",
    "Confidence",
    "Slippage Bps",
    "Fees USD",
    "Approval",
    "Notes",
  ];
  const rows = sims.map((s) => [
    new Date(s.savedAt).toLocaleDateString("en-US"),
    s.assetSymbol,
    s.buyChain,
    s.sellChain,
    s.bridgeName,
    s.notionalUsd.toFixed(2),
    s.expectedNetProfitUsd.toFixed(2),
    (s.confidenceScore * 100).toFixed(1) + "%",
    s.estimatedSlippageBps.toFixed(1),
    s.estimatedFeesUsd.toFixed(2),
    s.approvalStage,
    s.notes ?? "",
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "owlsight-simulations.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? "#14F195" : pct >= 40 ? "#F59E0B" : "#9945FF";
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1 flex-1 overflow-hidden rounded-full"
        style={{ background: "var(--surface-3, rgba(255,255,255,0.08))" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="w-8 text-right text-[10px] tabular-nums" style={{ color: "var(--txt-4)" }}>
        {pct}%
      </span>
    </div>
  );
}

export function SimulationLibrary({ initialSims }: { initialSims: SavedSimulation[] }) {
  const [sims, setSims] = useState(initialSims);
  const [filterPinned, setFilterPinned] = useState(false);
  const [filterApproved, setFilterApproved] = useState(false);
  const [assetFilter, setAssetFilter] = useState("");
  const [sortKey, setSortKey] = useState<"date" | "profit" | "confidence">("date");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    let list = [...sims];
    if (filterPinned) list = list.filter((s) => s.pinned);
    if (filterApproved) list = list.filter((s) => s.approvalStage === "approved");
    if (assetFilter) list = list.filter((s) => s.assetSymbol.toLowerCase().includes(assetFilter.toLowerCase()));
    list.sort((a, b) => {
      if (sortKey === "profit") return b.expectedNetProfitUsd - a.expectedNetProfitUsd;
      if (sortKey === "confidence") return b.confidenceScore - a.confidenceScore;
      return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    });
    return list;
  }, [sims, filterPinned, filterApproved, assetFilter, sortKey]);

  async function togglePin(id: string, current: boolean) {
    const res = await fetch(`/api/simulations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !current }),
    });
    if (res.ok) {
      setSims((prev) => prev.map((s) => (s.id === id ? { ...s, pinned: !current } : s)));
    }
  }

  async function saveNotes(id: string) {
    const notes = editingNotes[id] ?? "";
    const res = await fetch(`/api/simulations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    if (res.ok) {
      setSims((prev) => prev.map((s) => (s.id === id ? { ...s, notes } : s)));
    }
  }

  async function deleteSim(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/simulations/${id}`, { method: "DELETE" });
    if (res.ok) {
      startTransition(() => setSims((prev) => prev.filter((s) => s.id !== id)));
    }
    setDeletingId(null);
  }

  if (initialSims.length === 0) {
    return (
      <div
        className="rounded-2xl border px-6 py-16 text-center"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <BookMarked className="mx-auto mb-4 h-8 w-8 opacity-20" style={{ color: "var(--txt-3)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--txt-2)" }}>No saved simulations</p>
        <p className="mt-1 text-xs" style={{ color: "var(--txt-4)" }}>
          Bookmark an opportunity in{" "}
          <Link href="/app" className="text-solviolet hover:underline">
            Mission Control
          </Link>{" "}
          to build your simulation library.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div
        className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <button
          onClick={() => setFilterPinned((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
          style={{
            borderColor: filterPinned ? "#9945FF" : "var(--border)",
            color: filterPinned ? "#9945FF" : "var(--txt-3)",
            background: filterPinned ? "rgba(153,69,255,0.08)" : "var(--surface-2)",
          }}
        >
          <Pin className="h-3 w-3" />
          Pinned only
        </button>

        <button
          onClick={() => setFilterApproved((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
          style={{
            borderColor: filterApproved ? "#14F195" : "var(--border)",
            color: filterApproved ? "#14F195" : "var(--txt-3)",
            background: filterApproved ? "rgba(20,241,149,0.08)" : "var(--surface-2)",
          }}
        >
          Approved only
        </button>

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
          <option value="date">Sort: Newest</option>
          <option value="profit">Sort: Highest Profit</option>
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

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm" style={{ color: "var(--txt-3)" }}>No simulations match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => {
            const pnlPos = s.expectedNetProfitUsd > 0;
            const noteVal = editingNotes[s.id] ?? s.notes ?? "";
            return (
              <div
                key={s.id}
                className="flex flex-col rounded-2xl border p-5"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                {/* Top row: asset + approval + pin */}
                <div className="flex items-center justify-between">
                  <span
                    className="rounded-lg border px-2 py-0.5 font-mono text-xs font-semibold"
                    style={{ borderColor: "var(--border)", color: "var(--txt-2)" }}
                  >
                    {s.assetSymbol}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: s.approvalStage === "approved" ? "#14F195" : "#F59E0B" }}
                    >
                      {s.approvalStage.toUpperCase()}
                    </span>
                    <button
                      onClick={() => togglePin(s.id, s.pinned)}
                      title={s.pinned ? "Unpin" : "Pin"}
                    >
                      <Pin
                        className="h-3.5 w-3.5 transition-colors"
                        style={{ color: s.pinned ? "#9945FF" : "var(--txt-4)" }}
                        fill={s.pinned ? "#9945FF" : "none"}
                      />
                    </button>
                  </div>
                </div>

                {/* Route */}
                <p className="mt-3 font-mono text-xs" style={{ color: "var(--txt-4)" }}>
                  {s.buyChain} → {s.sellChain}
                  {s.bridgeName ? ` via ${s.bridgeName}` : ""}
                </p>

                {/* P&L */}
                <p
                  className="mt-1 text-2xl font-bold tabular-nums"
                  style={{ color: pnlPos ? "#14F195" : "var(--txt-2)" }}
                >
                  {pnlPos ? "+" : ""}${s.expectedNetProfitUsd.toFixed(2)}
                </p>

                {/* Confidence bar */}
                <div className="mt-3">
                  <ConfidenceBar score={s.confidenceScore} />
                </div>

                {/* Stats */}
                <div className="mt-3 grid grid-cols-2 gap-y-1 text-[10px]" style={{ color: "var(--txt-4)" }}>
                  <span>Slippage</span>
                  <span className="text-right">{s.estimatedSlippageBps.toFixed(1)} bps</span>
                  <span>Fees</span>
                  <span className="text-right">${s.estimatedFeesUsd.toFixed(2)}</span>
                  <span>Latency</span>
                  <span className="text-right">{s.estimatedBridgeLatencySec.toFixed(0)}s</span>
                </div>

                {/* Notes */}
                <textarea
                  placeholder="Add notes…"
                  value={noteVal}
                  onChange={(e) =>
                    setEditingNotes((prev) => ({ ...prev, [s.id]: e.target.value }))
                  }
                  onBlur={() => saveNotes(s.id)}
                  rows={2}
                  className="mt-4 w-full resize-none rounded-lg border p-2 text-xs outline-none"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface-2)",
                    color: "var(--txt-2)",
                  }}
                />

                {/* Footer */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: "var(--txt-4)" }}>
                    {new Date(s.savedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm("Delete this simulation?")) deleteSim(s.id);
                    }}
                    disabled={deletingId === s.id}
                    className="rounded p-1 transition-colors hover:text-red-400"
                    style={{ color: "var(--txt-4)" }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-right text-xs" style={{ color: "var(--txt-4)" }}>
        {filtered.length} of {sims.length} simulations
      </p>
    </div>
  );
}
