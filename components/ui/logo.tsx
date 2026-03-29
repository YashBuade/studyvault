"use client";

import Link from "next/link";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string;
};

const sizeMap = {
  sm: { box: "h-8 w-8", icon: "h-5 w-5", text: "text-base" },
  md: { box: "h-11 w-11", icon: "h-7 w-7", text: "text-lg" },
  lg: { box: "h-14 w-14", icon: "h-9 w-9", text: "text-2xl" },
};

function LogoMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = sizeMap[size];

  return (
    <div
      className={`${s.box} relative flex items-center justify-center overflow-hidden rounded-[14px] border border-[rgb(var(--color-border))] bg-[linear-gradient(135deg,rgb(var(--color-primary))_0%,rgb(var(--color-accent))_100%)] shadow-[var(--shadow-lg)] transition-transform duration-[var(--transition-base)] group-hover:scale-[1.04]`}
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.32),transparent_45%)]" />
      <svg viewBox="0 0 32 32" className={`${s.icon} relative`} fill="none" aria-hidden="true">
        <path d="M6.5 19.5c3-1.6 6.2-2.4 9.5-2.4v8.8c-3.3 0-6.5.8-9.5 2.3v-8.7Z" fill="rgb(var(--color-text-inverse))" opacity="0.86" />
        <path d="M25.5 19.5c-3-1.6-6.2-2.4-9.5-2.4v8.8c3.3 0 6.5.8 9.5 2.3v-8.7Z" fill="rgb(var(--color-primary-light))" opacity="0.96" />
        <path d="M10.9 14.3v-1.4a5.1 5.1 0 0 1 10.2 0v1.4" stroke="rgb(var(--color-text-inverse))" strokeWidth="1.9" strokeLinecap="round" />
        <rect x="10.2" y="14.1" width="11.6" height="8.3" rx="2.1" fill="rgb(var(--color-text-inverse))" />
        <path d="M16 16.5v3.2" stroke="rgb(var(--color-primary))" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M5.6 16.7c3.3-1.8 6.8-2.7 10.4-2.7 3.6 0 7.1.9 10.4 2.7" stroke="rgb(var(--color-accent))" strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
        <circle cx="23.9" cy="8.1" r="1.9" fill="rgb(var(--color-warning))" />
      </svg>
    </div>
  );
}

export function Logo({ size = "md", showText = true, href = "/" }: LogoProps) {
  const s = sizeMap[size];

  return (
    <Link href={href} className="group inline-flex items-center gap-3">
      <LogoMark size={size} />
      {showText ? (
        <span className={`${s.text} font-bold tracking-[-0.02em] text-[rgb(var(--text-primary))]`}>
          Study<span className="text-[rgb(var(--primary))]">Vault</span>
        </span>
      ) : null}
    </Link>
  );
}

export function LogoText() {
  return (
    <span className="text-xl font-bold tracking-[-0.02em] text-[rgb(var(--text-primary))]">
      Study<span className="text-[rgb(var(--primary))]">Vault</span>
    </span>
  );
}

export function LogoIcon() {
  return <LogoMark size="md" />;
}
