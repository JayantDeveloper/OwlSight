"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Registration failed.");
      setLoading(false);
      return;
    }

    // Auto sign in
    await signIn("credentials", { email, password, redirect: false });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-4 py-3 text-sm text-amber-400">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-medium" style={{ color: "var(--txt-3)" }}>Name (optional)</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="auth-input"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium" style={{ color: "var(--txt-3)" }}>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="auth-input"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium" style={{ color: "var(--txt-3)" }}>Password</label>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className="auth-input pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--txt-4)" }}
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Create Account
      </button>
    </form>
  );
}
