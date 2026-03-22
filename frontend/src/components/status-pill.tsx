interface StatusPillProps {
  label: string;
  value: string;
  detail?: string;
  tone?: "neutral" | "positive" | "warning";
}

const toneClasses: Record<NonNullable<StatusPillProps["tone"]>, string> = {
  neutral: "border-solviolet/25 bg-solviolet/[0.07] text-purple-300",
  positive: "border-solmint/25 bg-solmint/[0.07] text-solmint",
  warning: "border-amber-500/25 bg-amber-500/[0.07] text-amber-400",
};

const labelClasses: Record<NonNullable<StatusPillProps["tone"]>, string> = {
  neutral: "text-solviolet/60",
  positive: "text-solmint/60",
  warning: "text-amber-400/60",
};

export function StatusPill({
  label,
  value,
  detail,
  tone = "neutral",
}: StatusPillProps) {
  return (
    <div
      className={`min-w-0 rounded-xl border px-4 py-3 transition-all duration-200 ${toneClasses[tone]}`}
    >
      <p
        className={`truncate text-[9px] uppercase tracking-[0.26em] ${labelClasses[tone]}`}
      >
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-semibold">{value}</p>
      {detail ? (
        <p className={`mt-0.5 truncate text-[10px] ${labelClasses[tone]} opacity-80`}>
          {detail}
        </p>
      ) : null}
    </div>
  );
}
