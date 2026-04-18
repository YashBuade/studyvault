"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

type TipItem = {
  title: string;
  description: string;
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

export function AuthTipRotator({
  tips,
  intervalMs = 4800,
  className = "",
}: {
  tips: TipItem[];
  intervalMs?: number;
  className?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const normalized = useMemo(
    () => tips.map((tip) => ({ title: tip.title.trim(), description: tip.description.trim() })).filter((tip) => tip.title && tip.description),
    [tips],
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    if (normalized.length <= 1) return;

    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % normalized.length);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs, normalized.length, reducedMotion]);

  const active = normalized[index % Math.max(1, normalized.length)];
  if (!active) return null;

  return (
    <div
      className={[
        "rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.85)] p-4 shadow-[var(--shadow-xs)] ring-1 ring-[rgb(var(--border)/0.55)] backdrop-blur",
        className,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex rounded-[var(--radius-md)] bg-[rgb(var(--primary-soft))] p-2 text-[rgb(var(--primary))]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--text-tertiary))]">Quick tip</p>
            <p key={active.title} className="mt-2 animate-slide-up text-sm font-semibold text-[rgb(var(--text-primary))]">
              {active.title}
            </p>
            <p key={active.description} className="mt-1 animate-slide-up text-xs text-[rgb(var(--text-secondary))]">
              {active.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 pt-1">
          {normalized.slice(0, 5).map((_, dotIndex) => (
            <span
              key={dotIndex}
              className={[
                "h-1.5 w-1.5 rounded-full transition-colors",
                dotIndex === index ? "bg-[rgb(var(--primary))]" : "bg-[rgb(var(--border-strong))]",
              ].join(" ")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

