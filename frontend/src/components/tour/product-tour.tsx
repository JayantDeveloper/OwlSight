"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  BarChart3,
  Bookmark,
  LayoutDashboard,
  MessageSquare,
  Radar,
  ShieldCheck,
  Zap,
} from "lucide-react";

const STORAGE_KEY = "owlsight-tour-done";
const CARD_W = 320;
const SPOTLIGHT_PAD = 10;

// Use useLayoutEffect on the client, useEffect on the server (SSR safe)
const useIsomorphicEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface Step {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor: string;
  title: string;
  body: string;
  /** data-tour attribute value to spotlight, or null for centered overlay */
  target: string | null;
  /** which side of the spotlight the card appears on */
  side: "top" | "bottom" | "left" | "right" | "center";
}

const STEPS: Step[] = [
  {
    icon: Radar,
    iconColor: "#9945FF",
    title: "Welcome to OwlSight",
    body: "Execution intelligence for cross-chain trades. This quick tour highlights each part of the app.",
    target: null,
    side: "center",
  },
  {
    icon: MessageSquare,
    iconColor: "#9945FF",
    title: "Type your intent here",
    body: "Describe what you want in plain English — swap, bridge, or convert. Hit Analyse and OwlSight finds every viable route.",
    target: "intent-input",
    side: "right",
  },
  {
    icon: BarChart3,
    iconColor: "#9945FF",
    title: "Routes ranked for you",
    body: "Routes appear here ranked by confidence and net profit, each stress-tested across 500 Monte Carlo simulation paths.",
    target: "route-cards",
    side: "right",
  },
  {
    icon: Zap,
    iconColor: "#9945FF",
    title: "Inspect & execute",
    body: "Select a route to see the full P10/P50/P90 breakdown, cost decomposition, and guardrail status. Execute when ready.",
    target: "right-panel",
    side: "left",
  },
  {
    icon: ShieldCheck,
    iconColor: "#14F195",
    title: "Live system status",
    body: "These indicators show market feed, trade engine, and Hummingbot connectivity at a glance. Green dot = ready.",
    target: "status-bar",
    side: "bottom",
  },
  {
    icon: Bookmark,
    iconColor: "#9945FF",
    title: "Save any simulation",
    body: "Bookmark this opportunity to your library. Review, annotate, pin, and compare routes later from your dashboard.",
    target: "save-button",
    side: "left",
  },
  {
    icon: LayoutDashboard,
    iconColor: "#14F195",
    title: "Your dashboard",
    body: "Every execution is auto-saved. Visit your dashboard to see stats, execution history, and pinned simulations.",
    target: null,
    side: "center",
  },
];

interface SpotlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function getTargetRect(target: string): SpotlightRect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

function computeCardStyle(
  rect: SpotlightRect,
  side: Step["side"],
  pad: number,
): React.CSSProperties {
  const margin = 16;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  switch (side) {
    case "bottom": {
      const left = Math.min(
        Math.max(rect.left + rect.width / 2 - CARD_W / 2, margin),
        vw - CARD_W - margin,
      );
      return {
        left,
        top: rect.top + rect.height + pad + margin,
        width: CARD_W,
      };
    }
    case "top": {
      const left = Math.min(
        Math.max(rect.left + rect.width / 2 - CARD_W / 2, margin),
        vw - CARD_W - margin,
      );
      return {
        left,
        bottom: vh - (rect.top - pad - margin),
        width: CARD_W,
      };
    }
    case "right": {
      const top = Math.min(
        Math.max(rect.top + rect.height / 2 - 100, margin),
        vh - 260,
      );
      return {
        left: rect.left + rect.width + pad + margin,
        top,
        width: CARD_W,
      };
    }
    case "left": {
      const top = Math.min(
        Math.max(rect.top + rect.height / 2 - 100, margin),
        vh - 260,
      );
      return {
        right: vw - (rect.left - pad - margin),
        top,
        width: CARD_W,
      };
    }
    default:
      return {};
  }
}

/** Small arrow chip pointing toward the spotlight */
function Arrow({ side }: { side: Step["side"] }) {
  if (side === "center") return null;
  const arrows: Record<string, string> = {
    bottom: "↑",
    top: "↓",
    right: "←",
    left: "→",
  };
  return (
    <span
      className="mb-2 inline-block text-lg"
      style={{ color: "#9945FF", lineHeight: 1 }}
    >
      {arrows[side]}
    </span>
  );
}

export function ProductTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const [entering, setEntering] = useState(false);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setVisible(true), 700);
      return () => clearTimeout(t);
    }
  }, []);

  // Measure target on every step change, and on resize/scroll
  const measure = () => {
    const s = STEPS[step];
    if (!s.target) {
      setRect(null);
      return;
    }
    setRect(getTargetRect(s.target));
  };

  useIsomorphicEffect(() => {
    if (!visible) return;
    setEntering(true);
    const t = setTimeout(() => setEntering(false), 250);
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [visible, step]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function goTo(i: number) {
    setEntering(true);
    setTimeout(() => {
      setStep(i);
      setEntering(false);
    }, 150);
  }

  function next() {
    if (step >= STEPS.length - 1) { dismiss(); return; }
    goTo(step + 1);
  }

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;
  const isSpotlight = current.target !== null && rect !== null;
  const isCentered = current.side === "center" || !isSpotlight;

  const cardStyle: React.CSSProperties = isSpotlight
    ? computeCardStyle(rect!, current.side, SPOTLIGHT_PAD)
    : {};

  return (
    <>
      {/* ── Backdrop ── */}
      {isSpotlight ? (
        /* Spotlight mode: outline trick creates a "hole" at the target */
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: rect!.left - SPOTLIGHT_PAD,
            top: rect!.top - SPOTLIGHT_PAD,
            width: rect!.width + SPOTLIGHT_PAD * 2,
            height: rect!.height + SPOTLIGHT_PAD * 2,
            outline: "9999px solid rgba(0,0,0,0.72)",
            borderRadius: "14px",
            zIndex: 50,
            pointerEvents: "none",
            transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      ) : (
        /* Centered mode: plain dark backdrop */
        <div
          aria-hidden
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm"
          onClick={dismiss}
        />
      )}

      {/* ── Pulsing ring around spotlight target ── */}
      {isSpotlight && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: rect!.left - SPOTLIGHT_PAD - 4,
            top: rect!.top - SPOTLIGHT_PAD - 4,
            width: rect!.width + (SPOTLIGHT_PAD + 4) * 2,
            height: rect!.height + (SPOTLIGHT_PAD + 4) * 2,
            borderRadius: "18px",
            border: "2px solid rgba(153,69,255,0.6)",
            boxShadow: "0 0 0 4px rgba(153,69,255,0.15)",
            zIndex: 51,
            pointerEvents: "none",
            animation: "tourRing 2s ease-in-out infinite",
            transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      )}

      {/* ── Tooltip / card ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Product tour"
        style={{
          position: "fixed",
          zIndex: 52,
          opacity: entering ? 0 : 1,
          transform: entering ? "translateY(4px)" : "translateY(0)",
          transition: "opacity 0.18s ease, transform 0.18s ease",
          ...(isCentered
            ? {
                left: "50%",
                top: "50%",
                transform: entering
                  ? "translate(-50%, calc(-50% + 6px))"
                  : "translate(-50%, -50%)",
                width: CARD_W,
              }
            : cardStyle),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="rounded-2xl border p-6 shadow-2xl"
          style={{
            background: "var(--surface)",
            borderColor: "rgba(153,69,255,0.3)",
            boxShadow: "0 0 0 1px rgba(153,69,255,0.15), 0 24px 48px rgba(0,0,0,0.5)",
          }}
        >
          {/* Arrow indicator */}
          {!isCentered && <Arrow side={current.side} />}

          {/* Step counter */}
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--txt-4)" }}>
            {step + 1} / {STEPS.length}
          </p>

          {/* Icon */}
          <div
            className="mb-4 inline-flex rounded-xl border p-3"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
          >
            <Icon className="h-5 w-5" style={{ color: current.iconColor }} />
          </div>

          {/* Content */}
          <h2 className="text-base font-bold leading-snug" style={{ color: "var(--txt-1)" }}>
            {current.title}
          </h2>
          <p className="mt-2 text-xs leading-6" style={{ color: "var(--txt-3)" }}>
            {current.body}
          </p>

          {/* Progress dots */}
          <div className="mt-5 flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Step ${i + 1}`}
                style={{
                  height: "5px",
                  width: i === step ? "18px" : "5px",
                  borderRadius: "9999px",
                  background:
                    i === step
                      ? "#9945FF"
                      : i < step
                      ? "rgba(153,69,255,0.35)"
                      : "rgba(255,255,255,0.10)",
                  transition: "all 0.2s",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              onClick={dismiss}
              className="text-xs font-medium transition-colors hover:opacity-70"
              style={{ color: "var(--txt-4)" }}
            >
              Skip
            </button>
            <button
              onClick={next}
              className="btn-gradient inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-semibold text-white"
            >
              {isLast ? "Let's go →" : "Next →"}
            </button>
          </div>
        </div>
      </div>

      {/* Keyframe for the pulsing ring */}
      <style>{`
        @keyframes tourRing {
          0%, 100% { opacity: 0.7; box-shadow: 0 0 0 4px rgba(153,69,255,0.15); }
          50% { opacity: 1; box-shadow: 0 0 0 8px rgba(153,69,255,0.08); }
        }
      `}</style>
    </>
  );
}
