"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Alert } from "@/src/components/ui/alert";

type AuthErrorResponse = {
  error?: string | { message?: string };
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
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
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as AuthErrorResponse;

      if (!response.ok) {
        setError((typeof data.error === "string" ? data.error : data.error?.message) ?? "Login failed.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to login right now.");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-lg md:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Welcome back</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Log in to continue to your StudyVault workspace.</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="pr-12"
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-[var(--muted)]"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error ? <Alert variant="error" message={error} /> : null}

        <Button type="submit" loading={loading} className="w-full">
          {loading ? <LoaderCircle size={16} className="animate-spin" /> : null}
          Login
        </Button>
      </form>

      <p className="mt-4 text-sm text-[var(--muted)]">
        New to StudyVault?{" "}
        <Link href="/auth/signup" className="font-medium text-[var(--brand)] hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}