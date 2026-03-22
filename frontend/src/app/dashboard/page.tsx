import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  Clock,
  Radar,
  Settings,
  Wallet,
  Zap,
  AlertCircle,
} from "lucide-react";

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

const statusColor: Record<string, string> = {
  completed: "#14F195",
  rejected: "#F59E0B",
  fallback: "#9945FF",
};
const statusLabel: Record<string, string> = {
  completed: "DONE",
  rejected: "REJECTED",
  fallback: "FALLBACK",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const userId = session.user.id;
  const displayName = session.user.name ?? session.user.email?.split("@")[0] ?? "Trader";

  const [totalSims, totalExecs, approvedExecs, executions, pinnedSims, wallets, execConn] =
    await Promise.all([
      db.savedSimulation.count({ where: { userId } }),
      db.executionRecord.count({ where: { userId } }),
      db.executionRecord.count({ where: { userId, status: "completed" } }),
      db.executionRecord.findMany({
        where: { userId },
        orderBy: { startedAt: "desc" },
        take: 5,
      }),
      db.savedSimulation.findMany({
        where: { userId, pinned: true },
        orderBy: { savedAt: "desc" },
        take: 3,
      }),
      db.linkedWallet.count({ where: { userId } }),
      db.executionConnection.findUnique({ where: { userId } }),
    ]);

  const approvalRate =
    totalExecs > 0 ? Math.round((approvedExecs / totalExecs) * 100) : null;

  const totalPnl = executions
    .filter((e) => e.status === "completed")
    .reduce((sum, e) => sum + e.expectedNetProfitUsd, 0);

  const stats = [
    { label: "Simulations Saved", value: totalSims.toString(), sub: "bookmarked routes" },
    { label: "Executions Run", value: totalExecs.toString(), sub: "total trades executed" },
    {
      label: "Approval Rate",
      value: approvalRate !== null ? `${approvalRate}%` : "—",
      sub: "routes approved by guardrails",
    },
    {
      label: "Est. Net P&L",
      value:
        approvedExecs > 0
          ? `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`
          : "—",
      sub: "from completed executions",
      highlight: totalPnl > 0,
    },
  ];

  const quickActions = [
    { href: "/app", icon: Radar, label: "Analyse Route", desc: "Open Mission Control", highlight: false },
    { href: "/dashboard/history", icon: Clock, label: "View History", desc: "All execution records", highlight: false },
    { href: "/dashboard/simulations", icon: BookMarked, label: "Simulations", desc: "Saved route library", highlight: false },
    { href: "/settings/wallets", icon: Wallet, label: "Wallets", desc: wallets === 0 ? "No wallets — connect now" : `${wallets} connected`, highlight: wallets === 0 },
    { href: "/settings/execution", icon: Settings, label: "Execution", desc: execConn?.mode ?? "mock mode", highlight: false },
  ];

  return (
    <div>
      {/* Wallet connect CTA — shown when no wallets connected */}
      {wallets === 0 && (
        <Link
          href="/settings/wallets"
          className="mb-6 flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 transition-colors hover:bg-white/[0.03]"
          style={{ borderColor: "rgba(153,69,255,0.35)", background: "rgba(153,69,255,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" style={{ color: "#9945FF" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--txt-1)" }}>
                Connect your crypto wallet
              </p>
              <p className="text-xs" style={{ color: "var(--txt-4)" }}>
                Link a Solana or EVM wallet to enable execution tracking and personalised routes.
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0" style={{ color: "#9945FF" }} />
        </Link>
      )}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--txt-1)" }}>
            Welcome back, {displayName}
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--txt-4)" }}>
            Your execution intelligence command center
          </p>
        </div>
        <Link
          href="/app"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white btn-gradient"
        >
          Mission Control
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Hero stats bar */}
      <div
        className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border xl:grid-cols-4"
        style={{ borderColor: "var(--border)", background: "var(--border)" }}
      >
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="px-6 py-5"
            style={{ background: "var(--surface)" }}
          >
            <p className="text-xs" style={{ color: "var(--txt-4)" }}>
              {s.label}
            </p>
            <p
              className={`mt-1.5 text-3xl font-bold tabular-nums ${s.highlight ? "text-solmint" : ""}`}
              style={!s.highlight ? { color: "var(--txt-1)" } : undefined}
            >
              {s.value}
            </p>
            <p className="mt-0.5 text-[11px]" style={{ color: "var(--txt-4)" }}>
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Executions */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: "var(--txt-2)" }}>
            Recent Executions
          </h2>
          <Link
            href="/dashboard/history"
            className="flex items-center gap-1 text-xs transition-colors hover:text-white/80"
            style={{ color: "var(--txt-4)" }}
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {executions.length === 0 ? (
          <div
            className="rounded-2xl border px-6 py-10 text-center"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <Zap className="mx-auto mb-3 h-6 w-6 opacity-20" style={{ color: "var(--txt-3)" }} />
            <p className="text-sm" style={{ color: "var(--txt-3)" }}>
              No executions yet.{" "}
              <Link href="/app" className="text-solviolet hover:underline">
                Open Mission Control
              </Link>{" "}
              to analyse your first route.
            </p>
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-2xl border"
            style={{ borderColor: "var(--border)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="border-b text-xs"
                  style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                >
                  {["Asset", "Route", "Net P&L", "Status", "When"].map((h) => (
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
                {executions.map((e, i) => {
                  const isPending = !e.completedAt;
                  const pnlPositive = e.expectedNetProfitUsd > 0;
                  return (
                    <tr
                      key={e.id}
                      className="border-b transition-colors hover:bg-white/[0.02]"
                      style={{
                        borderColor: "var(--border)",
                        background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
                      }}
                    >
                      <td className="px-4 py-3 font-semibold" style={{ color: "var(--txt-1)" }}>
                        {e.assetSymbol}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--txt-3)" }}>
                        {e.buyChain} → {e.sellChain}
                      </td>
                      <td
                        className="px-4 py-3 font-semibold tabular-nums"
                        style={{ color: pnlPositive ? "#14F195" : "var(--txt-3)" }}
                      >
                        {pnlPositive ? "+" : ""}${e.expectedNetProfitUsd.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                            <span style={{ color: "#F59E0B" }}>PENDING</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold"
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: statusColor[e.status] ?? "#9945FF" }}
                            />
                            <span style={{ color: statusColor[e.status] ?? "var(--txt-3)" }}>
                              {statusLabel[e.status] ?? e.status.toUpperCase()}
                            </span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--txt-4)" }}>
                        {formatTimeAgo(new Date(e.startedAt))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pinned Simulations */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: "var(--txt-2)" }}>
            Pinned Simulations
          </h2>
          <Link
            href="/dashboard/simulations"
            className="flex items-center gap-1 text-xs transition-colors hover:text-white/80"
            style={{ color: "var(--txt-4)" }}
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {pinnedSims.length === 0 ? (
          <div
            className="rounded-2xl border px-6 py-10 text-center"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <BookMarked className="mx-auto mb-3 h-6 w-6 opacity-20" style={{ color: "var(--txt-3)" }} />
            <p className="text-sm" style={{ color: "var(--txt-3)" }}>
              No pinned simulations.{" "}
              <Link href="/dashboard/simulations" className="text-solviolet hover:underline">
                Browse your library
              </Link>{" "}
              to pin routes for quick access.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {pinnedSims.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border p-5"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="rounded-lg border px-2 py-0.5 font-mono text-xs font-semibold"
                    style={{ borderColor: "var(--border)", color: "var(--txt-2)" }}
                  >
                    {s.assetSymbol}
                  </span>
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: s.approvalStage === "approved" ? "#14F195" : "#F59E0B" }}
                  >
                    {s.approvalStage.toUpperCase()}
                  </span>
                </div>
                <p className="mt-3 font-mono text-xs" style={{ color: "var(--txt-4)" }}>
                  {s.buyChain} → {s.sellChain}
                </p>
                <p
                  className="mt-1 text-xl font-bold tabular-nums"
                  style={{ color: s.expectedNetProfitUsd > 0 ? "#14F195" : "var(--txt-2)" }}
                >
                  {s.expectedNetProfitUsd > 0 ? "+" : ""}${s.expectedNetProfitUsd.toFixed(2)}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--txt-4)" }}>
                  {Math.round(s.confidenceScore * 100)}% confidence
                </p>
                {s.label && (
                  <p className="mt-2 truncate text-xs italic" style={{ color: "var(--txt-4)" }}>
                    {s.label}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-sm font-semibold" style={{ color: "var(--txt-2)" }}>
          Quick Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {quickActions.map(({ href, icon: Icon, label, desc, highlight }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border p-4 transition-colors hover:bg-white/[0.03]"
              style={{
                borderColor: highlight ? "rgba(153,69,255,0.4)" : "var(--border)",
                background: highlight ? "rgba(153,69,255,0.07)" : "var(--surface)",
              }}
            >
              <div
                className="inline-flex rounded-xl border p-2"
                style={{
                  borderColor: highlight ? "rgba(153,69,255,0.3)" : "rgba(255,255,255,0.07)",
                  background: highlight ? "rgba(153,69,255,0.12)" : "rgba(255,255,255,0.04)",
                }}
              >
                <Icon className="h-3.5 w-3.5 text-solviolet" />
              </div>
              <p className="mt-3 text-sm font-semibold" style={{ color: "var(--txt-1)" }}>
                {label}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: highlight ? "#9945FF" : "var(--txt-4)" }}>
                {desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
