"use client";

import { useEffect, useMemo, useState } from "react";

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

export function RotatingWords({
  words,
  intervalMs = 2300,
  className = "",
}: {
  words: string[];
  intervalMs?: number;
  className?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const normalized = useMemo(() => words.map((word) => word.trim()).filter(Boolean), [words]);
  const [index, setIndex] = useState(0);
  const active = normalized[index % Math.max(1, normalized.length)] ?? "";

  useEffect(() => {
    if (reducedMotion) return;
    if (normalized.length <= 1) return;

    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % normalized.length);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs, normalized.length, reducedMotion]);

  if (normalized.length === 0) return null;

  return (
    <span className={["relative inline-flex items-baseline whitespace-nowrap", className].join(" ")}>
      <span className="sr-only">{normalized[0]}</span>
      <span
        key={active}
        aria-hidden
        className="inline-block animate-slide-up bg-gradient-to-r from-[rgb(var(--primary))] to-[rgb(var(--accent))] bg-clip-text font-bold text-transparent"
      >
        {active}
      </span>
    </span>
  );
}
