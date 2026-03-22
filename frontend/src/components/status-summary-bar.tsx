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
  return (
    <div
      className={`grid gap-3 ${
        compact ? "md:grid-cols-2 xl:grid-cols-5" : "md:grid-cols-2 xl:grid-cols-5"
      }`}
    >
      <StatusPill
        label="Market Signals"
        value={marketProviderLabel}
        tone={marketProviderTone}
        detail={marketProviderDetail}
      />
      <StatusPill
        label="Trade Engine"
        value={executionEngineLabel}
        tone={executionEngineTone}
        detail={executionEngineDetail}
      />
      <StatusPill
        label="Hummingbot"
        value={hummingbotLabel}
        tone={hummingbotTone}
        detail={hummingbotDetail}
      />
      <StatusPill
        label="Safety Net"
        value={fallbackLabel}
        tone={fallbackTone}
        detail={fallbackDetail}
      />
      <StatusPill
        label={compact ? "Session" : "Product Mode"}
        value={demoSessionLabel}
        tone={demoSessionTone}
        detail={demoSessionDetail}
      />
    </div>
  );
}
