"use client";

import { useState } from "react";
import { GoogleLogo } from "./google-logo";

export function GoogleAuthButton({ text = "Continue with Google" }: { text?: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    // Redirect to our backend route which handles the OAuth flow
    window.location.href = "/api/auth/google";
  };

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className="group relative inline-flex min-h-[46px] w-full items-center justify-center gap-3 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--text-primary))] shadow-[var(--shadow-xs)] transition-all duration-[var(--transition-base)] hover:-translate-y-0.5 hover:bg-[rgb(var(--surface-hover))] hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/30 disabled:cursor-not-allowed disabled:opacity-60"
      aria-label={text}
    >
      {isLoading ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[rgb(var(--border))] border-t-[rgb(var(--primary))]" />
      ) : (
        <GoogleLogo className="h-5 w-5 transition-transform duration-200 group-hover:scale-105" />
      )}
      <span>{text}</span>
    </button>
  );
}
