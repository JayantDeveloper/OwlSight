"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface Props {
  initialMode: string;
  initialUrl: string;
  initialStatus: string;
}

const MODES = [
  { value: "mock", label: "Mock", description: "Simulated execution, no real trades" },
  { value: "paper", label: "Paper", description: "Paper trading via Hummingbot" },
  { value: "live", label: "Live", description: "Real trades via Hummingbot (requires connection)" },
];

export function ExecutionConfigClient({ initialMode, initialUrl, initialStatus }: Props) {
  const [mode, setMode] = useState(initialMode);
  const [url, setUrl] = useState(initialUrl);
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/execution-connection", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, hummingbotUrl: url, status }),
    });

    setLoading(false);
    setMessage(res.ok ? "Saved." : "Failed to save.");
  }

  async function handleTestConnection() {
    if (!url) return;
    setStatus("connecting");
    setMessage("");

    // Proxy through Next.js API to avoid CORS when fetching Gateway from the browser
    let newStatus: string = "error";
    try {
      const res = await fetch("/api/execution-connection/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json();
      newStatus = data.status === "connected" ? "connected" : "error";
    } catch {
      newStatus = "error";
    }

    setStatus(newStatus);
    await fetch("/api/execution-connection", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, hummingbotUrl: url, status: newStatus }),
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Mode selector */}
      <div>
        <p className="mb-3 text-xs font-medium" style={{ color: "var(--txt-3)" }}>Execution Mode</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                mode === m.value ? "border-solviolet/40 bg-solviolet/10" : "hover:bg-white/[0.04]"
              }`}
              style={{ borderColor: mode === m.value ? undefined : "var(--border)" }}
            >
              <p className="text-sm font-semibold" style={{ color: mode === m.value ? "#9945FF" : "var(--txt-1)" }}>
                {m.label}
              </p>
              <p className="mt-0.5 text-[10px]" style={{ color: "var(--txt-4)" }}>{m.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Hummingbot URL */}
      {(mode === "paper" || mode === "live") && (
        <div className="space-y-3">
          {/* Setup hint */}
          <div
            className="rounded-xl border px-4 py-3 text-xs"
            style={{ borderColor: "var(--border)", color: "var(--txt-3)" }}
          >
            <p className="font-semibold" style={{ color: "var(--txt-2)" }}>Hummingbot Gateway setup</p>
            <p className="mt-1">Run Gateway alongside Hummingbot using Docker:</p>
            <pre
              className="mt-2 overflow-x-auto rounded-lg p-2 font-mono text-[10px] leading-relaxed"
              style={{ background: "var(--surface-3)", color: "var(--txt-2)" }}
            >{`git clone https://github.com/hummingbot/hummingbot.git
cd hummingbot
make setup   # enable Gateway when prompted
make deploy  # starts both containers`}</pre>
            <p className="mt-2">Gateway listens on <span className="font-mono font-semibold" style={{ color: "var(--txt-2)" }}>http://localhost:15888</span> by default.</p>
          </div>

          <div className="space-y-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--txt-3)" }}>
            Gateway URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:15888"
              className="auth-input flex-1"
            />
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={!url}
              className="shrink-0 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/[0.06] disabled:opacity-40"
              style={{ borderColor: "var(--border)", color: "var(--txt-2)" }}
            >
              Test
            </button>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2 pt-1">
            {status === "connected" ? (
              <><CheckCircle2 className="h-3.5 w-3.5 text-solmint" /><span className="text-xs text-solmint">Connected</span></>
            ) : status === "error" ? (
              <><XCircle className="h-3.5 w-3.5 text-red-400" /><span className="text-xs text-red-400">Gateway unreachable — check URL and that containers are running</span></>
            ) : status === "connecting" ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "var(--txt-3)" }} /><span className="text-xs" style={{ color: "var(--txt-3)" }}>Testing…</span></>
            ) : (
              <span className="text-xs" style={{ color: "var(--txt-4)" }}>Not tested</span>
            )}
          </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="btn-gradient flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Save
        </button>
        {message && <p className="text-sm" style={{ color: "var(--txt-3)" }}>{message}</p>}
      </div>
    </form>
  );
}
