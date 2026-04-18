"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { ModernButton } from "@/components/ui/modern-button";
import { Logo } from "@/components/ui/logo";
import { AuthTipRotator } from "@/components/auth/auth-tip-rotator";

type ResetPasswordResponse = {
  ok: boolean;
  data?: { reset?: boolean; authenticated?: boolean };
  error?: { message?: string };
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const tips = [
    { title: "Make it long", description: "Aim for 12+ characters; length beats complexity in practice." },
    { title: "Don’t reuse passwords", description: "A unique password keeps other accounts safer too." },
    { title: "Store it safely", description: "Use a password manager so you never lose access again." },
  ];

  const passwordsMismatch = useMemo(
    () => confirmPassword.length > 0 && password !== confirmPassword,
    [password, confirmPassword],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("Reset link is missing or invalid.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (passwordsMismatch) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const payload = (await response.json()) as ResetPasswordResponse;
      if (!response.ok) {
        setError(payload.error?.message ?? "Reset link is invalid or expired.");
        return;
      }
      setDone(true);
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to reset password right now.");
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
              <h1 className="mt-3 text-2xl font-bold text-[rgb(var(--text-primary))]">Set a new password</h1>
              <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">Choose a strong password you don&apos;t reuse elsewhere.</p>
            </div>

            {error ? (
              <div className="rounded-[var(--radius-md)] border border-[rgb(var(--error)/0.35)] bg-[rgb(var(--color-danger-light))] px-3 py-3 text-sm text-[rgb(var(--error))]">
                {error}
              </div>
            ) : null}

            {done ? (
              <div className="space-y-2 rounded-[var(--radius-md)] border border-[rgb(var(--success)/0.25)] bg-[rgb(var(--color-success-light)/0.75)] px-3 py-3 text-sm">
                <div className="flex items-center gap-2 font-semibold text-[rgb(var(--success))]">
                  <CheckCircle2 className="h-4 w-4" /> Password updated
                </div>
                <p className="text-[rgb(var(--text-secondary))]">Redirecting you to your dashboard…</p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                    New password <span className="text-[rgb(var(--error))]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      className="input pr-12"
                      placeholder="Create a new password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))] transition-colors hover:text-[rgb(var(--text-primary))]"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmNewPassword" className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                    Confirm password <span className="text-[rgb(var(--error))]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="confirmNewPassword"
                      type={showConfirm ? "text" : "password"}
                      className={`input pr-12 ${passwordsMismatch ? "input-error" : ""}`}
                      placeholder="Re-enter the new password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((value) => !value)}
                      aria-label={showConfirm ? "Hide password confirmation" : "Show password confirmation"}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))] transition-colors hover:text-[rgb(var(--text-primary))]"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordsMismatch ? <p className="text-xs text-[rgb(var(--error))]">Passwords do not match</p> : null}
                </div>

                <ModernButton type="submit" variant="primary" size="lg" isLoading={loading} fullWidth>
                  {!loading ? <ArrowRight className="h-4 w-4" /> : null}
                  <span>{loading ? "Updating..." : "Update password"}</span>
                </ModernButton>
              </form>
            )}

            <AuthTipRotator tips={tips} />

            <div className="flex items-center justify-between gap-3 text-xs text-[rgb(var(--text-tertiary))]">
              <Link href="/auth/login" className="font-semibold text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]">
                Back to sign in
              </Link>
              <Link href="/" className="font-semibold text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]">
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
