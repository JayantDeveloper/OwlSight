import { StatusPill } from "@/components/status-pill";

interface StatusSummaryBarProps {
  marketProviderLabel: string;
  marketProviderDetail: string;
  marketProviderTone: "neutral" | "positive" | "warning";
  executionEngineLabel: string;
  executionEngineDetail: string;
  executionEngineTone: "neutral" | "positive" | "warning";
  hummingbotLabel: string;
  hummingbotDetail: string;
  hummingbotTone: "neutral" | "positive" | "warning";
  fallbackLabel: string;
  fallbackDetail: string;
  fallbackTone: "neutral" | "positive" | "warning";
  demoSessionLabel: string;
  demoSessionDetail: string;
  demoSessionTone: "neutral" | "positive" | "warning";
  compact?: boolean;
}

const toneDot: Record<"neutral" | "positive" | "warning", string> = {
  neutral: "#9945FF",
  positive: "#14F195",
  warning:  "#F59E0B",
};

export function StatusSummaryBar({
  marketProviderLabel,
  marketProviderDetail,
  marketProviderTone,
  executionEngineLabel,
  executionEngineDetail,
  executionEngineTone,
  hummingbotLabel,
  hummingbotDetail,
  hummingbotTone,
  fallbackLabel,
  fallbackDetail,
  fallbackTone,
  demoSessionLabel,
  demoSessionDetail,
  demoSessionTone,
  compact = false,
}: StatusSummaryBarProps) {
  const pills = [
    { label: "Market",    value: marketProviderLabel,  detail: marketProviderDetail,  tone: marketProviderTone },
    { label: "Engine",    value: executionEngineLabel, detail: executionEngineDetail, tone: executionEngineTone },
    { label: "Hummingbot", value: hummingbotLabel,     detail: hummingbotDetail,      tone: hummingbotTone },
    { label: "Safety",    value: fallbackLabel,         detail: fallbackDetail,         tone: fallbackTone },
    { label: "Session",   value: demoSessionLabel,      detail: demoSessionDetail,      tone: demoSessionTone },
  ] as const;

  if (compact) {
    return (
      <div className="flex items-center gap-4 overflow-hidden">
        {pills.map(({ label, value, tone }, i) => (
          <div key={label} className="flex items-center gap-4">
            {i > 0 && (
              <span
                className="h-3 w-px shrink-0"
                style={{ background: "var(--border)" }}
              />
            )}
            <div className="flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: toneDot[tone] }}
              />
              <span className="text-[10px] font-medium" style={{ color: "var(--txt-4)" }}>
                {label}
              </span>
              <span className="text-[10px] font-semibold" style={{ color: "var(--txt-2)" }}>
                {value}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <StatusPill label="Market Signals"  value={marketProviderLabel}  detail={marketProviderDetail}  tone={marketProviderTone} />
      <StatusPill label="Trade Engine"    value={executionEngineLabel} detail={executionEngineDetail} tone={executionEngineTone} />
      <StatusPill label="Hummingbot"      value={hummingbotLabel}      detail={hummingbotDetail}      tone={hummingbotTone} />
      <StatusPill label="Safety Net"      value={fallbackLabel}         detail={fallbackDetail}         tone={fallbackTone} />
      <StatusPill label="Product Mode"    value={demoSessionLabel}      detail={demoSessionDetail}      tone={demoSessionTone} />
    </div>
  );
}
