"use client";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
