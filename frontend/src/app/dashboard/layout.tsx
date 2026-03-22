"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Clock, BookMarked } from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/history", label: "Executions", icon: Clock, exact: false },
  { href: "/dashboard/simulations", label: "Simulations", icon: BookMarked, exact: false },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen" style={{ background: "var(--canvas)" }}>
      {/* Sub-nav */}
      <div
        className="sticky top-0 z-10 border-b"
        style={{ background: "var(--canvas)", borderColor: "var(--border)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center gap-1 px-4 sm:px-6 lg:px-8">
          {navLinks.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors"
                style={{
                  borderColor: active ? "var(--solviolet, #9945FF)" : "transparent",
                  color: active ? "var(--txt-1)" : "var(--txt-3)",
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
