"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
}

export function ProfileForm({ user }: { user: User }) {
  const [name, setName] = useState(user.name ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setLoading(false);
    if (res.ok) {
      setMessage("Saved.");
    } else {
      setMessage("Failed to save.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium" style={{ color: "var(--txt-3)" }}>Name</label>
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
        <input type="email" value={user.email} disabled className="auth-input opacity-50 cursor-not-allowed" />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="btn-gradient flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </button>
        {message && <p className="text-sm" style={{ color: "var(--txt-3)" }}>{message}</p>}
      </div>
    </form>
  );
}
