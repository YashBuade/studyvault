"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ModernButton } from "@/components/ui/modern-button";
import { ModernInput } from "@/components/ui/modern-input";
import { Logo } from "@/components/ui/logo";
import { AuthTipRotator } from "@/components/auth/auth-tip-rotator";

type ForgotPasswordResponse = {
  ok: boolean;
  data?: { sent?: boolean; resetUrl?: string };
  error?: { message?: string };
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const tips = [
    { title: "Check spam or promotions", description: "Reset emails sometimes land in filtered inbox tabs." },
    { title: "Use a password manager", description: "It helps you generate strong passwords you don’t have to remember." },
    { title: "Keep accounts unique", description: "Avoid reusing the same password across services." },
  ];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResetUrl(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as ForgotPasswordResponse;
      if (!response.ok) {
        setError(payload.error?.message ?? "Unable to request a reset link.");
      } else {
        setSubmitted(true);
        setResetUrl(payload.data?.resetUrl ?? null);
      }
    } catch {
      setError("Unable to request a reset link right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-128px)] items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Logo size="md" />
        </div>

        <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))]/80 bg-[rgb(var(--surface))]/92 p-6 shadow-[var(--shadow-lg)] backdrop-blur-2xl sm:p-8">
          <div className="space-y-5">
            <div>
              <div className="section-kicker">Password reset</div>
              <h1 className="mt-3 text-2xl font-bold text-[rgb(var(--text-primary))]">Forgot password?</h1>
              <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                Enter your email and we&apos;ll send a reset link. If email delivery isn&apos;t configured, you&apos;ll still see a link in debug mode.
              </p>
            </div>

            {error ? (
              <div className="rounded-[var(--radius-md)] border border-[rgb(var(--error)/0.35)] bg-[rgb(var(--color-danger-light))] px-3 py-3 text-sm text-[rgb(var(--error))]">
                {error}
              </div>
            ) : null}

            <form className="space-y-4" onSubmit={onSubmit}>
              <ModernInput
                id="resetEmail"
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
              <ModernButton type="submit" variant="primary" size="lg" isLoading={loading} fullWidth>
                {!loading ? <ArrowRight className="h-4 w-4" /> : null}
                <span>{loading ? "Sending..." : "Send reset link"}</span>
              </ModernButton>
            </form>

            {submitted ? (
              <div className="space-y-2 rounded-[var(--radius-md)] border border-[rgb(var(--success)/0.25)] bg-[rgb(var(--color-success-light)/0.75)] px-3 py-3 text-sm text-[rgb(var(--success))]">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  Request sent
                </div>
                <p className="text-[rgb(var(--text-secondary))]">
                  If an account exists for that email, a reset link will be sent.
                </p>
                {resetUrl ? (
                  <button
                    type="button"
                    className="inline-flex text-sm font-semibold text-[rgb(var(--primary))] hover:text-[rgb(var(--primary-hover))]"
                    onClick={() => {
                      router.push(resetUrl);
                      router.refresh();
                    }}
                  >
                    Open reset link
                  </button>
                ) : null}
              </div>
            ) : null}

            <AuthTipRotator tips={tips} />

            <div className="flex items-center justify-between gap-3 text-xs text-[rgb(var(--text-tertiary))]">
              <Link href="/auth/login" className="font-semibold text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]">
                Back to sign in
              </Link>
              <Link href="/auth/signup" className="font-semibold text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
