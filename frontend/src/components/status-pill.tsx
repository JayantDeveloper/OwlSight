interface StatusPillProps {
  label: string;
  value: string;
  detail?: string;
  tone?: "neutral" | "positive" | "warning";
}

const toneDot: Record<NonNullable<StatusPillProps["tone"]>, string> = {
  neutral: "#9945FF",
  positive: "#14F195",
  warning:  "#F59E0B",
};

export function StatusPill({ label, value, detail, tone = "neutral" }: StatusPillProps) {
  return (
    <div
      className="min-w-0 rounded-xl border px-4 py-3.5 transition-colors"
      style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
    >
      <p className="truncate text-[9px] uppercase tracking-[0.26em]" style={{ color: "var(--txt-4)" }}>
        {label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: toneDot[tone] }}
        />
        <p className="truncate text-xs font-semibold" style={{ color: "var(--txt-1)" }}>
          {value}
        </p>
      </div>
      {detail ? (
        <p className="mt-1 truncate text-[10px]" style={{ color: "var(--txt-3)" }}>
          {detail}
        </p>
      ) : null}
    </div>
  );
}
