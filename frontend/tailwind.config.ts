import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Solana brand
        solviolet: "#9945FF",
        solmint: "#14F195",
        mint: "#14F195",
        // Theme-aware surface system (resolved via CSS variables)
        canvas:      "var(--canvas)",
        surface:     "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        "surface-4": "var(--surface-4)",
        // Status
        "status-green": "#14F195",
        "status-amber": "#F59E0B",
        "status-red": "#EF4444",
      },
      boxShadow: {
        // Panels
        panel: "0 1px 3px rgba(0,0,0,0.3), 0 4px 24px rgba(0,0,0,0.4)",
        "panel-hover": "0 4px 20px rgba(0,0,0,0.5), 0 16px 48px rgba(0,0,0,0.6)",
        // Glows
        "glow-violet": "0 0 32px rgba(153,69,255,0.35)",
        "glow-violet-sm": "0 0 16px rgba(153,69,255,0.28)",
        "glow-mint": "0 0 32px rgba(20,241,149,0.28)",
        "glow-cta": "0 8px 40px rgba(153,69,255,0.45)",
        // Inner glow for selected state
        "inner-violet": "inset 0 0 0 1.5px rgba(153,69,255,0.6)",
      },
      backgroundImage: {
        // Dot grid (dark variant)
        grid: "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",
        // Brand gradient
        "gradient-brand": "linear-gradient(135deg, #9945FF 0%, #14F195 100%)",
        "gradient-brand-r": "linear-gradient(135deg, #14F195 0%, #9945FF 100%)",
        // Subtle surface gradient
        "gradient-surface": "linear-gradient(135deg, #141A24 0%, #0E1219 100%)",
        // Shimmer overlay
        shimmer:
          "linear-gradient(90deg, transparent 0%, rgba(153,69,255,0.15) 50%, transparent 100%)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.55s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fadeIn 0.4s ease-out both",
        "slide-in-right": "slideInRight 0.38s cubic-bezier(0.16,1,0.3,1) both",
        "slide-in-up": "slideInUp 0.45s cubic-bezier(0.16,1,0.3,1) both",
        "glow-pulse": "glowPulse 3.5s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "border-glow": "borderGlow 2s ease-in-out infinite",
        "scan-line": "scanLine 3s linear infinite",
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideInRight: {
          from: { opacity: "0", transform: "translateX(-16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        slideInUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(153,69,255,0.2)",
          },
          "50%": {
            boxShadow: "0 0 48px rgba(153,69,255,0.45)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        borderGlow: {
          "0%, 100%": {
            borderColor: "rgba(153,69,255,0.3)",
          },
          "50%": {
            borderColor: "rgba(153,69,255,0.7)",
          },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
