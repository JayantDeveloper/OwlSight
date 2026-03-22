import { Loader2, RefreshCcw, RotateCcw, Sparkles } from "lucide-react";

import type { DemoScenario } from "@/lib/types";

interface DemoControlsProps {
  activeScenario: DemoScenario;
  sessionLabel: string;
  isBusy: boolean;
  variant?: "panel" | "bare";
  onScenario: (
    action:
      | "profitable"
      | "rejected"
      | "high-slippage"
      | "fallback"
      | "high-latency"
      | "replay"
      | "reset",
  ) => void;
}

const scenarioButtons = [
  { id: "profitable", label: "Profitable scenario" },
  { id: "rejected", label: "Rejected scenario" },
  { id: "high-slippage", label: "High slippage" },
  { id: "fallback", label: "Hummingbot failure" },
  { id: "high-latency", label: "High latency" },
] as const;

export function DemoControls({
  activeScenario,
  sessionLabel,
  isBusy,
  variant = "panel",
  onScenario,
}: DemoControlsProps) {
  const content = (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {scenarioButtons.map((button) => {
          const isActive = activeScenario === button.id.replace("-", "_");
          return (
            <button
              key={button.id}
              type="button"
              onClick={() => onScenario(button.id)}
              disabled={isBusy}
              className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${
                isActive
                  ? "border-solmint/30 bg-solmint/[0.08] text-solmint"
                  : "border-white/[0.07] bg-white/[0.03] text-white/50 hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white/75"
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className={`h-3.5 w-3.5 ${isActive ? "text-solmint" : "text-white/25"}`} />
                {button.label}
              </div>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onScenario("replay")}
          disabled={isBusy}
          className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-left text-xs font-semibold text-white/50 transition-all hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white/75 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex items-center gap-2">
            <RefreshCcw className="h-3.5 w-3.5 text-white/25" />
            Replay
          </span>
        </button>
        <button
          type="button"
          onClick={() => onScenario("reset")}
          disabled={isBusy}
          className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-left text-xs font-semibold text-white/50 transition-all hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white/75 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex items-center gap-2">
            {isBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5 text-white/25" />
            )}
            Reset
          </span>
        </button>
      </div>
    </div>
  );

  if (variant === "bare") return content;

  return <div className="panel p-5">{content}</div>;
}
