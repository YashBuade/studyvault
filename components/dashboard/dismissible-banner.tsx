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
    <div className="mb-4 flex items-start justify-between gap-3 rounded-[var(--radius-md)] border border-amber-300/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
      <div>{children}</div>
      <button
        type="button"
        aria-label="Dismiss teacher verification banner"
        onClick={() => {
          localStorage.setItem(STORAGE_KEY, "true");
          setVisible(false);
        }}
        className="rounded-[var(--radius-sm)] p-1 text-amber-800/80 transition hover:bg-amber-100 hover:text-amber-900"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
