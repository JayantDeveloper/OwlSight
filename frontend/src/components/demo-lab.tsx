"use client";

import { ChevronDown, FlaskConical } from "lucide-react";
import { useState } from "react";

import { DemoControls } from "@/components/demo-controls";
import type { DemoScenario } from "@/lib/types";

interface DemoLabProps {
  activeScenario: DemoScenario;
  sessionLabel: string;
  isBusy: boolean;
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

export function DemoLab({
  activeScenario,
  sessionLabel,
  isBusy,
  onScenario,
}: DemoLabProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-solviolet/25 bg-solviolet/10 p-1.5">
            <FlaskConical className="h-3.5 w-3.5 text-solviolet" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white/60">Scenario Lab</p>
            <p className="text-[10px] text-white/30">{sessionLabel}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="btn-ghost inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
        >
          {open ? "Hide" : "Open"} Scenario Lab
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {open && (
        <div className="mt-4 animate-fade-in rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
          <DemoControls
            activeScenario={activeScenario}
            sessionLabel={sessionLabel}
            isBusy={isBusy}
            onScenario={onScenario}
            variant="bare"
          />
        </div>
      )}
    </div>
  );
}
