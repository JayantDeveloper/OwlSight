"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center justify-center rounded-full p-1.5 transition-all duration-200 ${className ?? ""}`}
      style={{
        border: "1px solid var(--border)",
        background: "var(--surface-2)",
        color: "var(--txt-2)",
      }}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="h-3.5 w-3.5" />
      ) : (
        <Moon className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
