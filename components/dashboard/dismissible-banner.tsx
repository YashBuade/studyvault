"use client";

import { useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "teacher_banner_dismissed";

export function DismissibleBanner({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(() => (typeof window === "undefined" ? true : localStorage.getItem(STORAGE_KEY) !== "true"));

  if (!visible) {
    return null;
  }

  return (
    <div className="mb-4 flex items-start justify-between gap-3 rounded-[var(--radius-md)] border border-[rgb(var(--color-warning))]/30 bg-[rgb(var(--color-warning-light))] px-4 py-3 text-sm text-[rgb(var(--color-warning))]">
      <div>{children}</div>
      <button
        type="button"
        aria-label="Dismiss teacher verification banner"
        onClick={() => {
          localStorage.setItem(STORAGE_KEY, "true");
          setVisible(false);
        }}
        className="rounded-[var(--radius-sm)] p-1 text-[rgb(var(--color-warning))] transition hover:bg-[rgb(var(--color-surface))] hover:text-[rgb(var(--color-warning))]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
