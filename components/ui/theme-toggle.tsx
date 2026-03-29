"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const toggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-primary))] shadow-[var(--shadow-sm)] transition-colors hover:bg-[rgb(var(--surface-hover))] dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))]"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
