"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { ModernButton } from "@/components/ui/modern-button";
import { ModernInput } from "@/components/ui/modern-input";
import { Logo } from "@/components/ui/logo";
import { GoogleAuthButton } from "@/google-auth-button";

type AuthErrorResponse = {
  error?: string | { message?: string };
};

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const isTeacherLogin = pathname === "/auth/teacher/login";
  const isAdminLogin = pathname === "/auth/admin/login";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [oauthError, setOauthError] = useState("");
  const [oauthErrorDescription, setOauthErrorDescription] = useState("");
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleStatusMessage, setGoogleStatusMessage] = useState("Checking Google OAuth configuration...");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!email || !password) {
      setError("Email and password are required.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          rememberMe,
          ...(isTeacherLogin ? { expectedRole: "TEACHER" } : {}),
          ...(isAdminLogin ? { expectedRole: "ADMIN" } : {}),
        }),
      });

      const data = (await response.json()) as AuthErrorResponse;
      if (!response.ok) {
        setError((typeof data.error === "string" ? data.error : data.error?.message) ?? "Login failed.");
        setLoading(false);
        return;
      }

      setSuccess("Signed in successfully.");
      router.push(isAdminLogin ? "/dashboard/admin/teachers" : isTeacherLogin ? "/dashboard/teacher" : "/dashboard");
      router.refresh();
    } catch {
      setError("Unable to login right now. Please try again.");
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryError = params.get("error") || "";
    const queryDescription = params.get("error_description") || "";
    const syncFromQuery = window.setTimeout(() => {
      setOauthError(queryError);
      setOauthErrorDescription(queryDescription);
    }, 0);

    fetch("/api/auth/google/status")
      .then((res) => res.json())
      .then(
        (data: {
          ok?: boolean;
          hasClientId?: boolean;
          hasClientSecret?: boolean;
          redirectUri?: string | null;
          appUrl?: string | null;
          origin?: string | null;
        }) => {
        if (data.ok) {
          setGoogleEnabled(true);
          setGoogleStatusMessage("");
          return;
        }
        setGoogleEnabled(false);
        if (!data.hasClientId) {
          setGoogleStatusMessage("Google OAuth client ID is missing or invalid in `.env`.");
        } else if (!data.hasClientSecret) {
          setGoogleStatusMessage("Google OAuth client secret is missing or invalid in `.env`.");
        } else {
          const expected = data.redirectUri ?? `${data.origin ?? "http://localhost:3000"}/api/auth/google/callback`;
          setGoogleStatusMessage(`Google OAuth is not configured. Add redirect URI: ${expected}`);
        }
      })
      .catch(() => {
        setGoogleEnabled(false);
        setGoogleStatusMessage("Unable to verify Google OAuth configuration.");
      });

    return () => window.clearTimeout(syncFromQuery);
  }, []);

  const oauthErrorMessage = () => {
    switch (oauthError) {
      case "google_not_configured":
        return "Google OAuth is not configured on the server.";
      case "google_token_exchange_failed":
        return "Google login failed while exchanging token.";
      case "google_userinfo_failed":
        return "Google account information could not be verified.";
      case "google_state_mismatch":
        return "Google session verification failed. Please try again.";
      case "missing_google_code":
        return "Google did not return an authorization code.";
      case "redirect_uri_mismatch":
        return "Google redirect URI mismatch. Check your Google Console OAuth redirect URI.";
      case "google_auth_failed":
        return "Google authentication failed. Please try again.";
      case "invalid_request":
        return oauthErrorDescription
          ? `Google OAuth request is invalid: ${oauthErrorDescription}. If your app is in Testing mode, add this account as a test user or publish the app to Production (External).`
          : "Google OAuth request is invalid. If your app is in Testing mode, add this account as a test user or publish the app to Production (External).";
      case "access_denied":
        return oauthErrorDescription
          ? `Google blocked access: ${oauthErrorDescription}. Verify OAuth consent screen audience/test users in Google Cloud Console.`
          : "Google blocked access. Verify OAuth consent screen audience/test users in Google Cloud Console.";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <div className="mx-auto grid min-h-screen max-w-[1320px] lg:grid-cols-[1.12fr_0.88fr]">
        <section className="relative hidden overflow-hidden border-r border-[rgb(var(--border))] lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-indigo-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900" />
          <div className="absolute -right-20 top-14 h-72 w-72 rounded-full bg-sky-400/25 blur-3xl dark:bg-sky-500/30" />
          <div className="absolute left-8 top-52 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/25" />
          <div className="absolute bottom-10 right-28 h-44 w-44 rounded-3xl bg-gradient-to-br from-blue-500/30 to-indigo-600/30 shadow-[var(--shadow-lg)] backdrop-blur-xl rotate-12" />
          <div className="absolute bottom-24 right-56 h-28 w-28 rounded-2xl bg-gradient-to-br from-cyan-300/25 to-blue-500/30 shadow-[var(--shadow-md)] -rotate-12" />

          <div className="relative z-10 flex w-full flex-col items-start gap-4 p-12 xl:p-16">
            <Logo size="lg" />
            <div className="max-w-xl pt-1">
              <h1 className="text-5xl font-bold tracking-tight text-[rgb(var(--text-primary))]">Welcome back to your study cockpit</h1>
              <p className="mt-5 text-lg leading-relaxed text-[rgb(var(--text-secondary))]">
                Notes, planner, assignments, exams, and files in one workflow built for focused academic execution.
              </p>
              <div className="mt-8 grid gap-3">
                {["Live deadline tracking", "Smart study organization", "Private and share-ready workspace"].map((item) => (
                  <div key={item} className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/85 px-4 py-3 shadow-[var(--shadow-xs)] backdrop-blur">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
          <div className="absolute inset-0 lg:hidden">
            <div className="absolute -left-8 top-12 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl" />
            <div className="absolute -right-8 bottom-12 h-40 w-40 rounded-full bg-indigo-400/20 blur-3xl" />
          </div>
          <div className="relative z-10 w-full max-w-md space-y-6">
            <div className="lg:hidden">
              <Logo size="md" />
            </div>
            <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/95 p-5 shadow-[var(--shadow-lg)] backdrop-blur sm:p-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[rgb(var(--text-primary))] sm:text-3xl">
                    {isAdminLogin ? "Admin sign in" : "Sign in"}
                  </h2>
                  <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                    {isAdminLogin
                      ? "Sign in with an existing admin account. Public admin signup is disabled."
                      : isTeacherLogin
                      ? "Sign in with your teacher account. Admin approval controls file verification access."
                      : "Continue to your StudyVault dashboard."}
                  </p>
                </div>

                {(error || oauthErrorMessage()) && (
                  <div className="alert alert-error flex items-start gap-2 p-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error || oauthErrorMessage()}</span>
                  </div>
                )}
                {success && (
                  <div className="alert alert-success flex items-start gap-2 p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                {isTeacherLogin || isAdminLogin ? (
                  <div className="rounded-[var(--radius-md)] border border-amber-400/50 bg-amber-100/70 px-3 py-2 text-xs text-amber-900">
                    {isAdminLogin
                      ? "Admin login uses admin credentials. Google quick login is disabled for the admin portal."
                      : "Teacher login uses teacher credentials. Google quick login is disabled for the teacher portal."}
                  </div>
                ) : googleEnabled ? (
                  <>
                    <GoogleAuthButton text="Continue with Google" />
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[rgb(var(--border))]" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-[rgb(var(--surface))] px-3 text-xs uppercase tracking-wide text-[rgb(var(--text-tertiary))]">or use email</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-[var(--radius-md)] border border-[rgb(var(--warning))]/30 bg-[rgb(var(--warning))]/10 px-3 py-2 text-xs text-[rgb(var(--text-secondary))]">
                    {googleStatusMessage}
                  </div>
                )}

                <form className="space-y-4" onSubmit={onSubmit}>
                  <ModernInput
                    id="email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                  />

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                      Password <span className="text-[rgb(var(--error))]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="input pr-12"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
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

                  <label className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]">
                    <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                    Remember me for 30 days
                  </label>

                  <ModernButton type="submit" variant="primary" size="lg" isLoading={loading} fullWidth>
                    {!loading && <ArrowRight className="h-4 w-4" />}
                    <span>{loading ? "Signing in..." : "Sign in"}</span>
                  </ModernButton>
                </form>

                <p className="text-center text-sm text-[rgb(var(--text-secondary))]">
                  New to StudyVault?{" "}
                  <Link
                    href={isTeacherLogin ? "/auth/teacher/signup" : isAdminLogin ? "/auth/signup" : "/auth/signup"}
                    className="font-semibold"
                  >
                    {isTeacherLogin ? "Teacher signup" : "Create account"}
                  </Link>
                </p>
                {!isTeacherLogin && !isAdminLogin ? (
                  <p className="text-center text-xs text-[rgb(var(--text-tertiary))]">
                    Teacher account?{" "}
                    <Link href="/auth/teacher/login" className="font-semibold">
                      Use dedicated teacher sign in
                    </Link>
                  </p>
                ) : null}
                {!isAdminLogin ? (
                  <p className="text-center text-xs text-[rgb(var(--text-tertiary))]">
                    Administrator?{" "}
                    <Link href="/auth/admin/login" className="font-semibold">
                      Use admin sign in
                    </Link>
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}



