"use client";

import { signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, LayoutDashboard, Settings, Wallet, LogOut, Zap } from "lucide-react";
import type { Session } from "next-auth";

interface UserMenuProps {
  session: Session;
}

export function UserMenu({ session }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = session.user?.name
    ? session.user.name.slice(0, 2).toUpperCase()
    : session.user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm transition-colors hover:bg-white/[0.07]"
        style={{ color: "var(--txt-2)" }}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-solviolet/20 text-xs font-bold text-solviolet">
          {initials}
        </div>
        <span className="hidden font-medium sm:inline">{session.user?.name ?? session.user?.email?.split("@")[0]}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-50" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border p-1 shadow-xl"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {/* Email header */}
          <div className="px-3 py-2.5 border-b mb-1" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs font-semibold truncate" style={{ color: "var(--txt-1)" }}>
              {session.user?.name ?? "Account"}
            </p>
            <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--txt-4)" }}>
              {session.user?.email}
            </p>
          </div>

          {[
            { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
            { href: "/settings/wallets", icon: Wallet, label: "Wallets" },
            { href: "/settings/execution", icon: Zap, label: "Execution" },
            { href: "/settings/profile", icon: Settings, label: "Settings" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-white/[0.06]"
              style={{ color: "var(--txt-2)" }}
            >
              <item.icon className="h-3.5 w-3.5 opacity-60" />
              {item.label}
            </Link>
          ))}

          <div className="mt-1 border-t pt-1" style={{ borderColor: "var(--border)" }}>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/[0.07]"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
