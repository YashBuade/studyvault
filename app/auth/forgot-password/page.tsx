"use client";

import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import { ModernButton } from "@/components/ui/modern-button";
import { ModernInput } from "@/components/ui/modern-input";
import { Logo } from "@/components/ui/logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Logo size="md" />
        </div>
        <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))]/80 bg-[rgb(var(--surface))]/92 p-6 shadow-[var(--shadow-lg)] backdrop-blur-2xl sm:p-8">
          <div className="space-y-5">
            <div>
              <div className="section-kicker">Password reset</div>
              <h1 className="mt-3 text-2xl font-bold text-[rgb(var(--text-primary))]">Forgot password?</h1>
              <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">We&apos;ll send a reset link to your email.</p>
            </div>

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
              <ModernButton type="submit" variant="primary" size="lg" fullWidth>
                <ArrowRight className="h-4 w-4" />
                <span>Send reset link</span>
              </ModernButton>
            </form>

            {submitted ? <p className="text-sm text-[rgb(var(--success))]">If an account exists for that email, a reset link will be sent.</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
