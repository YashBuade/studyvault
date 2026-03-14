"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Info, LockKeyhole, Sparkles } from "lucide-react";
import { ModernButton } from "@/components/ui/modern-button";
import { ModernInput } from "@/components/ui/modern-input";
import { Logo } from "@/components/ui/logo";
import { GoogleAuthButton } from "@/google-auth-button";

type AuthErrorResponse = {
  error?: string | { message?: string };
};

const roleTabs = [
  { href: "/auth/login", label: "Student" },
  { href: "/auth/teacher/login", label: "Teacher" },
  { href: "/auth/admin/login", label: "Admin" },
] as const;

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
  const title = isAdminLogin ? "Admin sign in" : isTeacherLogin ? "Teacher sign in" : "Sign in";
  const subtitle = isAdminLogin
    ? "Sign in with an existing admin account. Public admin signup is disabled."
    : isTeacherLogin
      ? "Sign in with your teacher account. Admin approval controls file verification access."
      : "Continue to your StudyVault dashboard.";
  const featureCards = isAdminLogin
    ? ["Moderation queue", "Teacher validation", "Role-specific controls"]
    : isTeacherLogin
      ? ["Approval-aware access", "Dedicated teacher workspace", "Review queue after verification"]
      : ["Live deadline tracking", "Smart study organization", "Private and share-ready workspace"];

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
      .then((data: { ok?: boolean }) => {
        setGoogleEnabled(Boolean(data.ok));
      })
      .catch(() => {
        setGoogleEnabled(false);
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

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text-primary))] dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-[1320px] lg:grid-cols-[1.12fr_0.88fr]">
        <section className="relative hidden overflow-hidden border-r border-[rgb(var(--border))] dark:border-slate-800 lg:flex">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgb(var(--color-primary-light))_0%,rgb(var(--color-surface))_45%,rgb(var(--color-info-light))_100%)]" />
          <div className="absolute -right-20 top-14 h-72 w-72 rounded-full bg-[rgb(var(--color-info)/0.2)] blur-3xl" />
          <div className="absolute left-8 top-52 h-64 w-64 rounded-full bg-[rgb(var(--color-primary)/0.14)] blur-3xl" />
          <div className="absolute bottom-10 right-28 h-44 w-44 rounded-3xl bg-[linear-gradient(135deg,rgb(var(--color-primary))_0%,rgb(var(--color-accent))_100%)] opacity-18 shadow-[var(--shadow-lg)] backdrop-blur-xl rotate-12" />
          <div className="absolute bottom-24 right-56 h-28 w-28 rounded-2xl bg-[linear-gradient(135deg,rgb(var(--color-accent))_0%,rgb(var(--color-info))_100%)] opacity-20 shadow-[var(--shadow-md)] -rotate-12" />
          <div className="hero-grid absolute inset-0 opacity-35" />

          <div className="relative z-10 flex w-full flex-col items-start gap-4 p-12 xl:p-16">
            <Logo size="lg" />
            <div className="max-w-xl pt-1">
              <div className="section-kicker">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Secure workspace access
              </div>
              <h1 className="mt-5 text-5xl font-bold tracking-tight text-[rgb(var(--text-primary))]">
                {isAdminLogin ? "Admin tools, without the clutter" : isTeacherLogin ? "Review resources in one focused teacher space" : "Pick up your semester where you left off"}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-[rgb(var(--text-secondary))]">
                {isAdminLogin
                  ? "Review approvals, manage platform workflows, and keep the project running smoothly from one clear control layer."
                  : isTeacherLogin
                    ? "Your teacher tools stay connected to verification, review queues, and a calmer workspace for academic publishing."
                    : "Notes, planner, assignments, exams, and files stay connected so your study flow feels lighter every day."}
              </p>
              <div className="mt-8 grid gap-3">
                {featureCards.map((item) => (
                  <div key={item} className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.85)] px-4 py-3 shadow-[var(--shadow-xs)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none dark:ring-1 dark:ring-slate-700">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))] dark:text-slate-100">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.8)] p-4 shadow-[var(--shadow-xs)] dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none dark:ring-1 dark:ring-slate-700">
                <LockKeyhole className="h-5 w-5 text-[rgb(var(--primary))]" />
                <p className="mt-3 text-sm font-semibold text-[rgb(var(--text-primary))] dark:text-slate-100">Protected sessions</p>
                <p className="mt-1 text-xs text-[rgb(var(--text-secondary))] dark:text-slate-300">Role-specific portals remain unchanged while the UI feels more polished and clear.</p>
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
            <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border)/0.8)] bg-[rgb(var(--surface)/0.92)] p-5 shadow-[var(--shadow-lg)] backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/92 dark:shadow-none dark:ring-1 dark:ring-slate-700 sm:p-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="section-kicker">Access portal</div>
                  <div>
                    <div className="mb-4 grid grid-cols-3 gap-2 rounded-[var(--radius-full)] bg-[rgb(var(--surface-2))] p-1 dark:bg-slate-800">
                      {roleTabs.map((tab) => {
                        const active =
                          (tab.href === "/auth/login" && !isTeacherLogin && !isAdminLogin) ||
                          (tab.href === "/auth/teacher/login" && isTeacherLogin) ||
                          (tab.href === "/auth/admin/login" && isAdminLogin);

                        return (
                          <Link
                            key={tab.href}
                            href={tab.href}
                            className={`inline-flex min-h-10 items-center justify-center rounded-[var(--radius-full)] px-3 text-sm font-semibold ${
                              active
                                ? "bg-[rgb(var(--primary))] text-[rgb(var(--text-inverse))]"
                                : "text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] dark:text-slate-300 dark:hover:text-slate-100"
                            }`}
                          >
                            {tab.label}
                          </Link>
                        );
                      })}
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-[rgb(var(--text-primary))] sm:text-3xl">{isAdminLogin || isTeacherLogin ? title : "Welcome back"}</h2>
                    <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">{subtitle}</p>
                  </div>
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
                  <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[rgb(var(--color-info)/0.2)] bg-[rgb(var(--color-info-light))] px-3 py-3 text-sm text-[rgb(var(--color-info))] dark:border-slate-700 dark:bg-slate-900 dark:text-sky-300">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{isAdminLogin ? "Google sign-in is not available for admin accounts." : "Google sign-in is not available for teacher accounts."}</span>
                  </div>
                ) : googleEnabled ? (
                  <>
                    <GoogleAuthButton text="Continue with Google" />
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[rgb(var(--border))]" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-[rgb(var(--surface))] px-3 text-xs uppercase tracking-wide text-[rgb(var(--text-tertiary))] dark:bg-slate-900 dark:text-slate-400">or use email</span>
                      </div>
                    </div>
                  </>
                ) : null}

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
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))] transition-colors hover:text-[rgb(var(--text-primary))] dark:text-slate-400 dark:hover:text-slate-100"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <Link href="/auth/forgot-password" className="inline-flex text-xs font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]">
                      Forgot password?
                    </Link>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]">
                    <input
                      id="rememberMe"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="h-4 w-4 rounded border border-[rgb(var(--border))] bg-[rgb(var(--surface))] dark:border-slate-600 dark:bg-slate-800"
                    />
                    <label htmlFor="rememberMe" className="mb-0 text-sm font-normal text-[rgb(var(--text-secondary))]">
                      Remember me for 30 days
                    </label>
                  </div>

                  <ModernButton type="submit" variant="primary" size="lg" isLoading={loading} fullWidth>
                    {!loading && <ArrowRight className="h-4 w-4" />}
                    <span>{loading ? "Signing in..." : "Sign in"}</span>
                  </ModernButton>

                  {isAdminLogin ? (
                    <p className="text-center text-xs text-[rgb(var(--text-tertiary))]">This portal is for authorized administrators only.</p>
                  ) : null}
                </form>

                {!isAdminLogin ? (
                  <div className="border-t border-[rgb(var(--border))] pt-5 text-center text-sm text-[rgb(var(--text-secondary))] dark:border-slate-700 dark:text-slate-300">
                    <Link href={isTeacherLogin ? "/auth/teacher/signup" : "/auth/signup"} className="btn btn-ghost w-full">
                      {isTeacherLogin ? "Pending approval? Check your status" : "Create a student account"}
                    </Link>
                  </div>
                ) : null}
                {!isTeacherLogin && !isAdminLogin ? (
                  <p className="text-center text-xs text-[rgb(var(--text-tertiary))]">
                    Teacher account?{" "}
                    <Link href="/auth/teacher/login" className="font-semibold">
                      Use dedicated teacher sign in
                    </Link>
                  </p>
                ) : null}
                {isTeacherLogin ? (
                  <p className="text-center text-xs text-[rgb(var(--text-tertiary))]">
                    Pending approval?{" "}
                    <Link href="/auth/teacher/status" className="font-semibold">
                      Check your status
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
