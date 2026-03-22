interface ExecutionCtaProps {
  disabled?: boolean;
  isExecuting?: boolean;
  label: string;
  onExecute: () => void;
}

export function ExecutionCta({
  disabled = false,
  isExecuting = false,
  label,
  onExecute,
}: ExecutionCtaProps) {
  return (
    <button
      type="button"
      onClick={onExecute}
      disabled={disabled}
      className={`w-full rounded-xl px-5 py-4 text-sm font-semibold uppercase tracking-[0.2em] transition-all duration-200 active:scale-[0.98] ${
        disabled
          ? "cursor-not-allowed border border-white/[0.06] bg-white/[0.03] text-white/25"
          : "btn-gradient text-white"
      }`}
    >
      {isExecuting ? "Execution In Flight..." : label}
    </button>
  );
}
