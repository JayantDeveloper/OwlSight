"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How It Works" },
];

const CHAIN_DOTS = [
  { color: "#9945FF", label: "Solana" },
  { color: "#3B82F6", label: "Base" },
  { color: "#818CF8", label: "Ethereum" },
  { color: "#38BDF8", label: "Arbitrum" },
];

export function SiteNav({ pathname }: { pathname: string }) {
  const [showLoader, setShowLoader] = useState(false);
  const [loaderFading, setLoaderFading] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  function handleLaunchApp() {
    setShowLoader(true);
    setLoaderFading(false);

    // Open new tab after animation has run a bit
    setTimeout(() => {
      window.open("/app", "_blank");
    }, 1400);

    // Fade out overlay
    setTimeout(() => {
      setLoaderFading(true);
    }, 1800);

    // Remove overlay from DOM
    setTimeout(() => {
      setShowLoader(false);
      setLoaderFading(false);
    }, 2300);
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#080B11]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl ring-1 ring-white/10 shadow-glow-violet-sm">
              <Image
                src="/owlsightlogo.jpg"
                alt="OwlSight logo"
                fill
                priority
                sizes="36px"
                className="object-cover"
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">OwlSight</div>
              <div className="text-[10px] tracking-wide text-white/35">Execution Intelligence</div>
            </div>
          </Link>

          {/* Nav pills */}
          <nav className="flex items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.04] p-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-solviolet to-[#7B2FFF] text-white shadow-glow-violet-sm"
                      : "text-white/75 hover:bg-white/[0.09] hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* CTA */}
          <button
            type="button"
            onClick={handleLaunchApp}
            className="btn-gradient hidden rounded-full px-5 py-2 text-sm font-semibold text-white sm:inline-flex"
          >
            Launch App
          </button>
        </div>
      </header>

      {/* ── Launch loading overlay ── */}
      {showLoader && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-[#080B11]/95 backdrop-blur-xl transition-opacity duration-500 ${
            loaderFading ? "opacity-0" : "opacity-100"
          }`}
          style={{ animation: loaderFading ? undefined : "fadeIn 0.3s ease-out" }}
        >
          <div className="flex flex-col items-center gap-8">
            {/* Logo with scanner rings */}
            <div className="relative flex h-24 w-24 items-center justify-center">
              {/* Outer ring */}
              <div
                className="absolute inset-0 rounded-full border border-solviolet/30"
                style={{ animation: "spin 3s linear infinite" }}
              />
              {/* Inner ring (reverse) */}
              <div
                className="absolute inset-3 rounded-full border border-solmint/20"
                style={{ animation: "spin 2s linear infinite reverse" }}
              />
              {/* Scanning arc outer */}
              <div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-solviolet/70"
                style={{ animation: "spin 1.2s linear infinite" }}
              />
              {/* Scanning arc inner */}
              <div
                className="absolute inset-4 rounded-full border border-transparent border-b-solmint/50"
                style={{ animation: "spin 0.8s linear infinite reverse" }}
              />
              {/* Center logo */}
              <div
                className="relative h-12 w-12 overflow-hidden rounded-2xl ring-1 ring-white/15 shadow-glow-violet-sm"
                style={{ animation: "pulse 2s ease-in-out infinite" }}
              >
                <Image
                  src="/owlsightlogo.jpg"
                  alt="OwlSight logo"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Chain dots lighting up sequentially */}
            <div className="flex items-center gap-3">
              {CHAIN_DOTS.map((dot, i) => (
                <div key={dot.label} className="flex flex-col items-center gap-1.5">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: dot.color,
                      boxShadow: `0 0 8px ${dot.color}`,
                      animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite`,
                    }}
                  />
                  <span className="font-mono text-[9px] text-white/30">{dot.label}</span>
                </div>
              ))}
            </div>

            {/* Text */}
            <div className="text-center">
              <p className="font-mono text-sm text-white/80" style={{ animation: "fadeIn 0.6s ease-out 0.3s both" }}>
                Initializing Mission Control…
              </p>
              <p className="mt-2 font-mono text-xs text-white/30" style={{ animation: "fadeIn 0.6s ease-out 0.8s both" }}>
                Connecting to execution layer
              </p>
            </div>
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(4px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 0.6; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.05); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
