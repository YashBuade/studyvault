"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { ModernButton } from "@/components/ui/modern-button";
import { ModernInput } from "@/components/ui/modern-input";
import { Logo } from "@/components/ui/logo";
import { GoogleAuthButton } from "@/google-auth-button";
import { TEACHER_EXPERTISE_FIELDS } from "@/lib/teacher-validation";

type AuthErrorResponse = {
  error?: string | { message?: string };
};

function getPasswordStrength(password: string): "weak" | "medium" | "strong" {
  if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) return "strong";
  if (password.length >= 8) return "medium";
  return "weak";
}

export default function SignupPage() {
  const router = useRouter();
  const pathname = usePathname();
  const isTeacherSignup = pathname === "/auth/teacher/signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"STUDENT" | "TEACHER">(isTeacherSignup ? "TEACHER" : "STUDENT");
  const [collegeId, setCollegeId] = useState("");
  const [department, setDepartment] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [oauthError, setOauthError] = useState("");
  const [oauthErrorDescription, setOauthErrorDescription] = useState("");
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleStatusMessage, setGoogleStatusMessage] = useState("Checking Google OAuth configuration...");
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    if (isTeacherSignup) {
      setRole("TEACHER");
    }
  }, [isTeacherSignup]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!name || !email || password.length < 6) {
      setError("Name, email, and a 6+ character password are required.");
      setLoading(false);
      return;
    }

    if (role === "TEACHER" && (!collegeId.trim() || !department.trim())) {
      setError("College ID and department are required for teacher signup.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, collegeId, department }),
      });

      const data = (await response.json()) as AuthErrorResponse;
      if (!response.ok) {
        setError((typeof data.error === "string" ? data.error : data.error?.message) ?? "Signup failed.");
        setLoading(false);
        return;
      }

      setSuccess("Account created.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to create your account right now.");
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
        return "Google signup failed while exchanging token.";
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

  const strengthColor =
    passwordStrength === "strong"
      ? "bg-[rgb(var(--success))]"
      : passwordStrength === "medium"
        ? "bg-[rgb(var(--warning))]"
        : "bg-[rgb(var(--error))]";

  return (
    <div className="min-h-screen w-full bg-[rgb(var(--background))]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1280px] lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden border-r border-[rgb(var(--border))] lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-sky-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900" />
          <div className="absolute right-16 top-16 h-64 w-64 rounded-full bg-indigo-300/20 blur-3xl dark:bg-indigo-500/20" />
          <div className="absolute bottom-20 left-10 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-600/20" />
          <div className="relative z-10 flex w-full flex-col gap-8 p-12 xl:p-16">
            <Logo size="lg" />
            <div className="max-w-xl space-y-8">
              <div className="space-y-3">
                <h1 className="text-5xl font-bold tracking-tight text-[rgb(var(--text-primary))]">Create your workspace</h1>
                <p className="text-lg text-[rgb(var(--text-secondary))]">
                  Start organizing notes, assignments, exams, and files in one place.
                </p>
              </div>
              <div className="space-y-3">
                {["Notes with search and sharing", "Assignment and exam planning", "Private file storage and recovery"].map((item) => (
                  <div key={item} className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/80 px-4 py-3 shadow-[var(--shadow-xs)] backdrop-blur">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-md space-y-6">
            <div className="lg:hidden">
              <Logo size="md" />
            </div>
            <div className="card p-6 sm:p-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-[rgb(var(--text-primary))]">
                    {isTeacherSignup ? "Teacher signup" : "Create account"}
                  </h2>
                  <p className="text-sm text-[rgb(var(--text-secondary))]">
                    {isTeacherSignup
                      ? "Register a teacher profile. Admin approval is required before file review access."
                      : "Set up your StudyVault account."}
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

                {isTeacherSignup ? (
                  <div className="rounded-[var(--radius-md)] border border-amber-400/50 bg-amber-100/70 px-3 py-2 text-xs text-amber-900">
                    Teacher signup requires College ID and expertise validation, so Google quick signup is disabled for this flow.
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
                    id="name"
                    label="Full name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="John Doe"
                    required
                  />

                  <ModernInput
                    id="email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                  />

                  {!isTeacherSignup ? (
                    <div className="space-y-2">
                      <label htmlFor="role" className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                        Account type
                      </label>
                      <select
                        id="role"
                        className="input"
                        value={role}
                        onChange={(event) => setRole(event.target.value as "STUDENT" | "TEACHER")}
                      >
                        <option value="STUDENT">Student</option>
                        <option value="TEACHER">Teacher</option>
                      </select>
                    </div>
                  ) : null}

                  {role === "TEACHER" ? (
                    <>
                      <ModernInput
                        id="collegeId"
                        label="College ID"
                        type="text"
                        value={collegeId}
                        onChange={(event) => setCollegeId(event.target.value)}
                        placeholder="Faculty ID / Employee ID"
                        required
                      />
                      <div className="space-y-2">
                        <label htmlFor="expertise" className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                          Field of Expertise
                        </label>
                        <select
                          id="expertise"
                          className="input"
                          value={department}
                          onChange={(event) => setDepartment(event.target.value)}
                          required
                        >
                          <option value="">Select expertise</option>
                          {TEACHER_EXPERTISE_FIELDS.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="text-xs text-[rgb(var(--text-secondary))]">
                        Teacher profile remains pending until admin verifies your College ID and expertise.
                      </p>
                    </>
                  ) : null}

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                      Password <span className="text-[rgb(var(--error))]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        minLength={6}
                        className="input pr-12"
                        placeholder="Create a password"
                        autoComplete="new-password"
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
                    {password && (
                      <div className="space-y-1">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgb(var(--surface-hover))]">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${strengthColor} ${
                              passwordStrength === "strong"
                                ? "w-full"
                                : passwordStrength === "medium"
                                  ? "w-2/3"
                                  : "w-1/3"
                            }`}
                          />
                        </div>
                        <p className="text-xs text-[rgb(var(--text-tertiary))]">
                          {passwordStrength === "strong"
                            ? "Strong password"
                            : passwordStrength === "medium"
                              ? "Medium password"
                              : "Use at least 8 characters for a stronger password"}
                        </p>
                      </div>
                    )}
                  </div>

                  <ModernButton type="submit" variant="primary" size="lg" isLoading={loading} fullWidth>
                    {!loading && <ArrowRight className="h-4 w-4" />}
                    <span>{loading ? "Creating account..." : "Create account"}</span>
                  </ModernButton>
                </form>

                <p className="text-center text-sm text-[rgb(var(--text-secondary))]">
                  Already have an account?{" "}
                  <Link href={isTeacherSignup ? "/auth/teacher/login" : "/auth/login"} className="font-semibold">
                    {isTeacherSignup ? "Teacher sign in" : "Sign in"}
                  </Link>
                </p>
                {!isTeacherSignup ? (
                  <p className="text-center text-xs text-[rgb(var(--text-tertiary))]">
                    Are you a teacher?{" "}
                    <Link href="/auth/teacher/signup" className="font-semibold">
                      Use dedicated teacher signup
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



