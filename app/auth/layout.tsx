"use client";

import { PublicFooter } from "@/components/ui/public-footer";
import { PublicNavbar } from "@/components/ui/public-navbar";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[rgb(var(--background))]">
      <div className="relative z-10">
        <PublicNavbar />
      </div>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-sky-300/15 blur-3xl dark:bg-sky-600/20" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-indigo-300/15 blur-3xl dark:bg-indigo-600/20" />
        <div className="hero-grid absolute inset-0 opacity-25" />
      </div>
      <div className="relative z-10 flex-1">
        {children}
      </div>
      <div className="relative z-10">
        <PublicFooter />
      </div>
    </div>
  );
}
