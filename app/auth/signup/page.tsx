"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Sparkles, UploadCloud } from "lucide-react";
import { ModernButton } from "@/components/ui/modern-button";
import { ModernInput } from "@/components/ui/modern-input";
import { Logo } from "@/components/ui/logo";
import { GoogleAuthButton } from "@/google-auth-button";
import { CUSTOM_TEACHER_EXPERTISE, TEACHER_EXPERTISE_FIELDS } from "@/lib/teacher-validation";

type AuthErrorResponse = {
  error?: string | { message?: string };
};

function getPasswordStrength(password: string): "weak" | "fair" | "strong" {
  const hasLetters = /[A-Za-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[^A-Za-z0-9]/.test(password);

  if (password.length >= 12 && hasLetters && hasNumbers && hasSymbols) return "strong";
  if (password.length >= 8 && ((hasLetters && hasNumbers) || (hasLetters && hasSymbols) || (hasNumbers && hasSymbols))) {
    return "fair";
  }
  return "weak";
}

export default function SignupPage() {
  const router = useRouter();
  const pathname = usePathname();
  const isTeacherSignup = pathname === "/auth/teacher/signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"STUDENT" | "TEACHER">(isTeacherSignup ? "TEACHER" : "STUDENT");
  const [collegeId, setCollegeId] = useState("");
  const [department, setDepartment] = useState("");
  const [customExpertise, setCustomExpertise] = useState("");
  const [isCustomExpertiseSelected, setIsCustomExpertiseSelected] = useState(false);
  const [teacherIdPhoto, setTeacherIdPhoto] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [oauthError, setOauthError] = useState("");
  const [oauthErrorDescription, setOauthErrorDescription] = useState("");
  const [googleStatus, setGoogleStatus] = useState<"loading" | "enabled" | "unavailable">(
    isTeacherSignup ? "unavailable" : "loading",
  );
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const usingCustomExpertise = isCustomExpertiseSelected;
  const teacherIdPreview = useMemo(() => (teacherIdPhoto ? URL.createObjectURL(teacherIdPhoto) : ""), [teacherIdPhoto]);
  const studentBullets = [
    "Organize notes by subject and tag",
    "Track assignments and exam deadlines",
    "Upload and access files anywhere",
  ];
  const teacherBullets = [
    "Submit your College ID for one-time verification",
    "Help students access quality academic resources",
    "Manage file approvals from your teacher dashboard",
  ];

  useEffect(() => () => {
    if (teacherIdPreview) {
      URL.revokeObjectURL(teacherIdPreview);
    }
  }, [teacherIdPreview]);

  useEffect(() => {
    if (isTeacherSignup) {
      return;
    }

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
        }) => {
          setGoogleStatus(data.ok ? "enabled" : "unavailable");
        },
      )
      .catch(() => {
        setGoogleStatus("unavailable");
      });

    return () => window.clearTimeout(syncFromQuery);
  }, [isTeacherSignup]);

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

  function handleTeacherIdChange(event: ChangeEvent<HTMLInputElement>) {
    setTeacherIdPhoto(event.target.files?.[0] ?? null);
  }

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

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (role === "TEACHER" && (!collegeId.trim() || !department.trim())) {
      setError("College ID and department are required for teacher signup.");
      setLoading(false);
      return;
    }

    if (role === "TEACHER" && !teacherIdPhoto) {
      setError("Teacher signup requires uploading a photo of your college ID.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("role", role);
      formData.append("collegeId", collegeId);
      formData.append("department", department);
      if (teacherIdPhoto) {
        formData.append("teacherIdPhoto", teacherIdPhoto);
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        body: formData,
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

  const strengthTone =
    passwordStrength === "strong"
      ? "bg-[rgb(var(--success))]"
      : passwordStrength === "fair"
        ? "bg-[rgb(var(--warning))]"
        : "bg-[rgb(var(--error))]";
  const strengthWidth = passwordStrength === "strong" ? "w-full" : passwordStrength === "fair" ? "w-2/3" : "w-1/3";
  const strengthLabel = passwordStrength === "strong" ? "Strong" : passwordStrength === "fair" ? "Fair" : "Weak";
  const disableSubmit = loading || passwordsMismatch;

  return (
    <div className="min-h-screen w-full bg-[rgb(var(--background))]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1280px] lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden border-r border-[rgb(var(--border))] lg:flex">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgb(var(--color-primary-light))_0%,rgb(var(--color-surface))_48%,rgb(var(--color-info-light))_100%)]" />
          <div className="absolute right-16 top-16 h-64 w-64 rounded-full bg-[rgb(var(--color-primary))]/14 blur-3xl" />
          <div className="absolute bottom-20 left-10 h-72 w-72 rounded-full bg-[rgb(var(--color-info))]/14 blur-3xl" />
          <div className="hero-grid absolute inset-0 opacity-35" />
          <div className="relative z-10 flex w-full flex-col gap-4 p-12 xl:p-16">
            <Logo size="lg" />
            <div className="max-w-xl space-y-6 pt-1">
              <div className="space-y-3">
                <div className="section-kicker">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Account setup
                </div>
                <h1 className="text-5xl font-bold tracking-tight text-[rgb(var(--text-primary))]">
                  {isTeacherSignup ? "Join as a verified teacher" : "Start your academic workspace"}
                </h1>
              </div>
              <div className="space-y-3">
                {(isTeacherSignup ? teacherBullets : studentBullets).map((item) => (
                  <div key={item} className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/80 px-4 py-3 shadow-[var(--shadow-xs)] backdrop-blur">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
          <div className="w-full max-w-md space-y-6">
            <div className="lg:hidden">
              <Logo size="md" />
            </div>
            <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))]/80 bg-[rgb(var(--surface))]/92 p-5 shadow-[var(--shadow-lg)] backdrop-blur-2xl sm:p-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="section-kicker">New account</div>
                  <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))] sm:text-3xl">
                    {isTeacherSignup ? "Teacher signup" : "Create account"}
                  </h2>
                  <p className="text-sm text-[rgb(var(--text-secondary))]">
                    {isTeacherSignup
                      ? "Register a teacher profile. Admin approval is required before file review access."
                      : "Create your StudyVault account and start organizing your semester."}
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
                  <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--color-warning))]/30 bg-[rgb(var(--color-warning-light))] px-4 py-3 text-sm text-[rgb(var(--color-warning))]">
                    <div className="flex items-start gap-3">
                      <span className="text-base" aria-hidden="true">⏱</span>
                      <div>
                        <p className="font-semibold">Teacher profile remains pending until admin verifies your College ID and expertise.</p>
                        <p className="mt-1 text-xs text-amber-800">Approval typically takes 1–2 business days.</p>
                      </div>
                    </div>
                  </div>
                ) : googleStatus === "loading" ? (
                  <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-3 py-2 text-sm text-[rgb(var(--text-secondary))]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading sign-in options...</span>
                  </div>
                ) : googleStatus === "enabled" ? (
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
                  <>
                    <button
                      type="button"
                      disabled
                      className="inline-flex min-h-[46px] w-full items-center justify-center gap-3 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--text-tertiary))] opacity-80"
                    >
                      Continue with Google (unavailable)
                    </button>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[rgb(var(--border))]" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-[rgb(var(--surface))] px-3 text-xs uppercase tracking-wide text-[rgb(var(--text-tertiary))]">or use email</span>
                      </div>
                    </div>
                  </>
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
                          value={usingCustomExpertise ? CUSTOM_TEACHER_EXPERTISE : department}
                          onChange={(event) => {
                            if (event.target.value === CUSTOM_TEACHER_EXPERTISE) {
                              setIsCustomExpertiseSelected(true);
                              setDepartment(customExpertise);
                              return;
                            }
                            setIsCustomExpertiseSelected(false);
                            setDepartment(event.target.value);
                          }}
                          required
                        >
                          <option value="">Select expertise</option>
                          {TEACHER_EXPERTISE_FIELDS.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                          <option value={CUSTOM_TEACHER_EXPERTISE}>Other (enter manually)</option>
                        </select>
                      </div>
                      {usingCustomExpertise ? (
                        <ModernInput
                          id="customExpertise"
                          label="Custom Expertise"
                          type="text"
                          value={customExpertise}
                          onChange={(event) => {
                            setCustomExpertise(event.target.value);
                            setDepartment(event.target.value);
                          }}
                          placeholder="Type your field of expertise"
                          required
                        />
                      ) : null}
                      <div className="space-y-2">
                        <label htmlFor="teacherIdPhoto" className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                          College ID Photo
                        </label>
                        <label
                          htmlFor="teacherIdPhoto"
                          onDragOver={(event) => {
                            event.preventDefault();
                            setDragActive(true);
                          }}
                          onDragLeave={() => setDragActive(false)}
                          onDrop={(event) => {
                            event.preventDefault();
                            setDragActive(false);
                            const file = event.dataTransfer.files?.[0] ?? null;
                            setTeacherIdPhoto(file);
                          }}
                          className={`flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed px-5 py-8 text-center transition hover:border-[rgb(var(--primary))]/50 hover:bg-[rgb(var(--surface))] ${
                            dragActive
                              ? "border-[rgb(var(--primary))]/60 bg-[rgb(var(--primary-soft))]"
                              : "border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))]"
                          }`}
                        >
                          <UploadCloud className="h-8 w-8 text-[rgb(var(--primary))]" />
                          <p className="mt-3 text-sm font-semibold text-[rgb(var(--text-primary))]">Drag & drop your College ID photo here</p>
                          <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">or click to browse · JPG, PNG, WEBP · Max 5MB</p>
                        </label>
                        <input
                          id="teacherIdPhoto"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleTeacherIdChange}
                          className="sr-only"
                          required
                        />
                        {teacherIdPhoto ? (
                          <div className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3">
                            <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{teacherIdPhoto.name}</p>
                            {teacherIdPreview ? (
                              <Image
                                src={teacherIdPreview}
                                alt="Selected College ID preview"
                                width={480}
                                height={160}
                                unoptimized
                                className="mt-3 h-28 w-full rounded-[var(--radius-md)] object-cover"
                              />
                            ) : null}
                          </div>
                        ) : null}
                      </div>
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
                    <div className="flex items-center gap-3 text-xs">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[rgb(var(--surface-hover))]">
                        <div className={`h-full rounded-full transition-all duration-300 ${strengthTone} ${strengthWidth}`} />
                      </div>
                      <span className="font-semibold text-[rgb(var(--text-secondary))]">{strengthLabel}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                      Confirm password <span className="text-[rgb(var(--error))]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        className={`input pr-12 ${passwordsMismatch ? "input-error" : ""}`}
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((value) => !value)}
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))] transition-colors hover:text-[rgb(var(--text-primary))]"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {passwordsMismatch ? <p className="text-xs text-[rgb(var(--error))]">Passwords do not match</p> : null}
                  </div>

                  <ModernButton type="submit" variant="primary" size="lg" isLoading={loading} fullWidth disabled={disableSubmit}>
                    {!loading && <ArrowRight className="h-4 w-4" />}
                    <span>{loading ? "Creating account..." : "Create account"}</span>
                  </ModernButton>

                  {!isTeacherSignup ? (
                    <p className="text-center text-xs text-[rgb(var(--text-tertiary))]">
                      By signing up you agree to our{" "}
                      <Link href="/terms" className="font-semibold">
                        Terms
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="font-semibold">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  ) : null}
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
