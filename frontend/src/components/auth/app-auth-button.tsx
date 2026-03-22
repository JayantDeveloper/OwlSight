"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { LogIn, LogOut, Settings, Wallet, LayoutDashboard, ChevronDown } from "lucide-react";

export function AppAuthButton() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Still loading — render nothing to avoid flicker
  if (status === "loading") return null;

  // Not signed in
  if (!session?.user) {
    return (
      <Link
        href="/auth/signin"
        className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors hover:bg-white/[0.06]"
        style={{ borderColor: "var(--border)", color: "var(--txt-2)" }}
      >
        <LogIn className="h-3 w-3" />
        Sign in
      </Link>
    );
  }

  // Signed in
  const initials = session.user.name
    ? session.user.name.slice(0, 2).toUpperCase()
    : session.user.email?.slice(0, 2).toUpperCase() ?? "?";

  const displayName = session.user.name ?? session.user.email?.split("@")[0] ?? "Account";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors hover:bg-white/[0.06]"
        style={{ borderColor: "var(--border)", color: "var(--txt-2)" }}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-solviolet/20 text-[9px] font-bold text-solviolet">
          {initials}
        </span>
        <span className="hidden max-w-[80px] truncate sm:block">{displayName}</span>
        <ChevronDown className="h-3 w-3 opacity-40" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1.5 w-48 rounded-xl border p-1 shadow-xl"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {/* Email */}
          <div
            className="mb-1 border-b px-3 py-2"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="truncate text-[11px] font-semibold" style={{ color: "var(--txt-1)" }}>
              {session.user.name ?? "Account"}
            </p>
            <p className="truncate text-[10px]" style={{ color: "var(--txt-4)" }}>
              {session.user.email}
            </p>
          </div>

          {[
            { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
            { href: "/settings/wallets", icon: Wallet, label: "Wallets" },
            { href: "/settings/execution", icon: Settings, label: "Execution" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors hover:bg-white/[0.06]"
              style={{ color: "var(--txt-2)" }}
            >
              <item.icon className="h-3 w-3 opacity-50" />
              {item.label}
            </Link>
          ))}

          <div className="mt-1 border-t pt-1" style={{ borderColor: "var(--border)" }}>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/[0.07]"
            >
              <LogOut className="h-3 w-3" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
