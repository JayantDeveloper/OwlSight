"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { Moon, PlayCircle, Sun } from "lucide-react";

const REFRESH_KEY = "owlsight-refresh-interval";
const STATUS_KEY  = "owlsight-status-compact";

const REFRESH_OPTIONS = [
  { value: "10",  label: "10s" },
  { value: "20",  label: "20s" },
  { value: "30",  label: "30s" },
  { value: "60",  label: "60s" },
];

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium" style={{ color: "var(--txt-3)" }}>{label}</p>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
            style={{
              borderColor: value === opt.value ? "rgba(153,69,255,0.5)" : "var(--border)",
              background: value === opt.value ? "rgba(153,69,255,0.1)" : "var(--surface-2)",
              color: value === opt.value ? "#c084fc" : "var(--txt-2)",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PreferencesClient() {
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const [refresh, setRefreshState] = useState("20");
  const [statusCompact, setStatusCompactState] = useState("full");
  const [mounted, setMounted] = useState(false);
  const [tourReplayed, setTourReplayed] = useState(false);

  function replayTour() {
    localStorage.removeItem("owlsight-tour-done");
    setTourReplayed(true);
    setTimeout(() => router.push("/app"), 500);
  }

  useEffect(() => {
    setRefreshState(localStorage.getItem(REFRESH_KEY) ?? "20");
    setStatusCompactState(localStorage.getItem(STATUS_KEY) ?? "full");
    setMounted(true);
  }, []);

  function setRefresh(v: string) {
    setRefreshState(v);
    localStorage.setItem(REFRESH_KEY, v);
  }

  function setStatusCompact(v: string) {
    setStatusCompactState(v);
    localStorage.setItem(STATUS_KEY, v);
  }

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      {/* Appearance */}
      <section>
        <h2 className="mb-4 text-sm font-semibold" style={{ color: "var(--txt-1)" }}>Appearance</h2>
        <div
          className="rounded-xl border p-5 space-y-5"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <div>
            <p className="mb-2 text-xs font-medium" style={{ color: "var(--txt-3)" }}>Theme</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => theme === "light" && toggle()}
                className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  borderColor: theme === "dark" ? "rgba(153,69,255,0.5)" : "var(--border)",
                  background: theme === "dark" ? "rgba(153,69,255,0.1)" : "var(--surface-2)",
                  color: theme === "dark" ? "#c084fc" : "var(--txt-2)",
                }}
              >
                <Moon className="h-3.5 w-3.5" />
                Dark
              </button>
              <button
                type="button"
                onClick={() => theme === "dark" && toggle()}
                className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  borderColor: theme === "light" ? "rgba(153,69,255,0.5)" : "var(--border)",
                  background: theme === "light" ? "rgba(153,69,255,0.1)" : "var(--surface-2)",
                  color: theme === "light" ? "#c084fc" : "var(--txt-2)",
                }}
              >
                <Sun className="h-3.5 w-3.5" />
                Light
              </button>
            </div>
          </div>

          <OptionGroup
            label="Status Bar"
            options={[
              { value: "full",    label: "Full grid" },
              { value: "compact", label: "Compact bar" },
            ]}
            value={statusCompact}
            onChange={setStatusCompact}
          />
        </div>
      </section>

      {/* Data */}
      <section>
        <h2 className="mb-4 text-sm font-semibold" style={{ color: "var(--txt-1)" }}>Data</h2>
        <div
          className="rounded-xl border p-5"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <OptionGroup
            label="Market refresh interval"
            options={REFRESH_OPTIONS}
            value={refresh}
            onChange={setRefresh}
          />
          <p className="mt-2 text-[11px]" style={{ color: "var(--txt-4)" }}>
            How often the dashboard polls for new opportunities and market data.
          </p>
        </div>
      </section>

      {/* Onboarding */}
      <section>
        <h2 className="mb-4 text-sm font-semibold" style={{ color: "var(--txt-1)" }}>Onboarding</h2>
        <div
          className="rounded-xl border p-5"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <p className="mb-3 text-xs font-medium" style={{ color: "var(--txt-3)" }}>Product Tour</p>
          <p className="mb-4 text-xs" style={{ color: "var(--txt-4)" }}>
            Replay the guided walkthrough that shows you how to use OwlSight — intent input, route
            analysis, simulation, execution, and the dashboard.
          </p>
          <button
            type="button"
            onClick={replayTour}
            disabled={tourReplayed}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--txt-2)" }}
          >
            <PlayCircle className="h-4 w-4 text-solviolet" />
            {tourReplayed ? "Redirecting to app…" : "Replay product tour"}
          </button>
        </div>
      </section>
    </div>
  );
}
