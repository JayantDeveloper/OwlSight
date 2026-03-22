import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LogOut, Settings, SlidersHorizontal, User, Wallet, Zap } from "lucide-react";

const navLinks = [
  { href: "/settings/profile",     icon: User,              label: "Profile" },
  { href: "/settings/wallets",     icon: Wallet,            label: "Wallets" },
  { href: "/settings/execution",   icon: Zap,               label: "Execution" },
  { href: "/settings/preferences", icon: SlidersHorizontal, label: "Preferences" },
];

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  return (
    <div className="min-h-screen" style={{ background: "var(--canvas)" }}>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/[0.05]"
            style={{ borderColor: "var(--border)", color: "var(--txt-3)" }}
          >
            <ArrowLeft className="h-3 w-3" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" style={{ color: "var(--txt-4)" }} />
            <h1 className="text-xl font-bold" style={{ color: "var(--txt-1)" }}>Settings</h1>
          </div>
        </div>

        <div className="flex flex-col gap-6 md:flex-row">
          {/* Sidebar nav */}
          <nav className="flex shrink-0 flex-row gap-1 md:w-44 md:flex-col">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-white/[0.06]"
                style={{ color: "var(--txt-2)" }}
              >
                <link.icon className="h-3.5 w-3.5 opacity-60" />
                {link.label}
              </Link>
            ))}
            <div className="mt-auto pt-4 md:pt-6">
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-red-500/10"
                  style={{ color: "var(--txt-3)" }}
                >
                  <LogOut className="h-3.5 w-3.5 opacity-60" />
                  Sign Out
                </button>
              </form>
            </div>
          </nav>

          {/* Page content */}
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
