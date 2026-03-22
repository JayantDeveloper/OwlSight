interface MetricPillProps {
  label: string;
  value: string;
  meta?: string;
  tone?: "neutral" | "positive" | "warning";
}

const toneClasses: Record<NonNullable<MetricPillProps["tone"]>, string> = {
  neutral: "border-solviolet/25 bg-solviolet/[0.07] text-purple-300",
  positive: "border-solmint/25 bg-solmint/[0.07] text-solmint",
  warning: "border-amber-500/25 bg-amber-500/[0.07] text-amber-400",
};

const labelClasses: Record<NonNullable<MetricPillProps["tone"]>, string> = {
  neutral: "text-solviolet/60",
  positive: "text-solmint/60",
  warning: "text-amber-400/60",
};

export function MetricPill({
  label,
  value,
  meta,
  tone = "neutral",
}: MetricPillProps) {
  return (
    <div className={`min-w-0 rounded-xl border px-4 py-3 ${toneClasses[tone]}`}>
      <p
        className={`truncate text-[9px] uppercase tracking-[0.28em] ${labelClasses[tone]}`}
      >
        {label}
      </p>
      <p className="mt-2 truncate font-mono text-lg font-semibold tabular-nums sm:text-xl">
        {value}
      </p>
      {meta ? (
        <p className={`mt-0.5 truncate text-[10px] ${labelClasses[tone]} opacity-75`}>
          {meta}
        </p>
      ) : null}
    </div>
  );
}
