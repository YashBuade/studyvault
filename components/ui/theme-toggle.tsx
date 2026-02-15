"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--shadow)]"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      {isDark ? "Light" : "Dark"}
    </button>
  );
}
