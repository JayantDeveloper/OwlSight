import type { MonteCarloResult } from "@/lib/types";

interface Props {
  mc: MonteCarloResult;
}

function fmt(val: number): string {
  const sign = val >= 0 ? "+" : "";
  return `${sign}$${Math.abs(val).toFixed(2)}`;
}

function ProbBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 80
      ? "bg-gradient-to-r from-solviolet to-solmint"
      : pct >= 60
      ? "bg-gradient-to-r from-solviolet to-purple-400"
      : pct >= 40
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.24em] text-white/35">
          Probability of profit
        </span>
        <span
          className={`text-sm font-semibold tabular-nums ${
            pct >= 70
              ? "text-solmint"
              : pct >= 50
              ? "text-amber-400"
              : "text-red-400"
          }`}
        >
          {pct}%
        </span>
      </div>
      <div className="prob-bar-track">
        <div className={`prob-bar-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const valueClass =
    tone === "positive"
      ? "text-solmint"
      : tone === "negative"
      ? "text-red-400"
      : "text-white/85";

  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.05] py-2.5 last:border-0">
      <span className="text-xs text-white/40">{label}</span>
      <span className={`font-mono text-xs font-semibold tabular-nums ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}

export function MonteCarloPanel({ mc }: Props) {
  const riskColor =
    mc.risk_label === "Low"
      ? "badge-mint"
      : mc.risk_label === "Moderate"
      ? "badge-violet"
      : mc.risk_label === "Elevated"
      ? "badge-amber"
      : "badge-red";

  return (
    <div className="panel animate-fade-in p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-solviolet/25 bg-solviolet/10 p-1.5">
            <svg
              className="h-3.5 w-3.5 text-solviolet"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-white/80">
              Monte Carlo Simulation
            </p>
            <p className="text-[10px] text-white/30">
              {mc.num_simulations.toLocaleString()} paths simulated
            </p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${riskColor}`}>
          {mc.risk_label} risk
        </span>
      </div>

      {/* Probability bar */}
      <div className="mb-4">
        <ProbBar value={mc.probability_of_profit} />
      </div>

      {/* Distribution metrics */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        {[
          {
            label: "P10 (worst)",
            value: fmt(mc.p10_usd),
            tone: mc.p10_usd >= 0 ? "positive" : "negative",
          },
          {
            label: "P50 (median)",
            value: fmt(mc.p50_usd),
            tone: mc.p50_usd >= 0 ? "positive" : "negative",
          },
          {
            label: "P90 (best)",
            value: fmt(mc.p90_usd),
            tone: mc.p90_usd >= 0 ? "positive" : "negative",
          },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center"
          >
            <p className="text-[9px] uppercase tracking-[0.22em] text-white/30">
              {m.label}
            </p>
            <p
              className={`mt-1.5 font-mono text-sm font-semibold tabular-nums ${
                m.tone === "positive" ? "text-solmint" : "text-red-400"
              }`}
            >
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Detail metrics */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-1">
        <MetricRow
          label="Expected profit"
          value={fmt(mc.expected_profit_usd)}
          tone={mc.expected_profit_usd >= 0 ? "positive" : "negative"}
        />
        <MetricRow
          label="Best case (P95)"
          value={fmt(mc.best_case_usd)}
          tone="positive"
        />
        <MetricRow
          label="Worst case (P5)"
          value={fmt(mc.worst_case_usd)}
          tone={mc.worst_case_usd >= 0 ? "neutral" : "negative"}
        />
        <MetricRow
          label="Std deviation"
          value={`$${mc.std_dev_usd.toFixed(2)}`}
        />
        <MetricRow
          label="Risk-adj. Sharpe"
          value={mc.sharpe_approx.toFixed(2)}
          tone={mc.sharpe_approx >= 2 ? "positive" : mc.sharpe_approx >= 1 ? "neutral" : "negative"}
        />
      </div>

      {/* Recommendation */}
      <div className="mt-4 rounded-xl border border-solviolet/15 bg-solviolet/[0.06] px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.22em] text-solviolet/60">
          OwlSight recommendation
        </p>
        <p className="mt-1 text-xs leading-6 text-white/65">{mc.recommendation}</p>
      </div>
    </div>
  );
}
