"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type StatItem = {
  label: string;
  value: number;
  suffix?: string;
  description?: string;
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

function useInView<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) setInView(true);
      },
      { threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

function AnimatedNumber({ value, suffix, active }: { value: number; suffix?: string; active: boolean }) {
  const reducedMotion = usePrefersReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (reducedMotion) return;

    const durationMs = 850;
    const start = performance.now();

    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reducedMotion, value]);

  return (
    <span className="tabular-nums">
      {reducedMotion ? value : display}
      {suffix ?? ""}
    </span>
  );
}

export function AnimatedStats({ items }: { items: StatItem[] }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.25);

  const normalized = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        suffix: item.suffix ?? "",
        description: item.description ?? "",
      })),
    [items],
  );

  return (
    <div ref={ref} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {normalized.map((item) => (
        <div
          key={item.label}
          className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.92)] p-5 shadow-[var(--shadow-sm)] backdrop-blur dark:bg-[rgb(var(--surface-elevated))]/80 dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))]"
        >
          <p className="text-3xl font-semibold tracking-tight text-[rgb(var(--text-primary))]">
            <AnimatedNumber value={item.value} suffix={item.suffix} active={inView} />
          </p>
          <p className="mt-2 text-sm font-semibold text-[rgb(var(--text-primary))]">{item.label}</p>
          {item.description ? (
            <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">{item.description}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
