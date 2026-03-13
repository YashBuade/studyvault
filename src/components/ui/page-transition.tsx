"use client";

import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="animate-[fadeIn_0.2s_ease-out_forwards] opacity-0">
      {children}
    </div>
  );
}
