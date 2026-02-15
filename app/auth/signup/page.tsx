"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Alert } from "@/src/components/ui/alert";

type AuthErrorResponse = {
  error?: string | { message?: string };
};

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    if (!name || !email || password.length < 6) {
      setError("Name, email, and a 6+ character password are required.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = (await response.json()) as AuthErrorResponse;

      if (!response.ok) {
        setError((typeof data.error === "string" ? data.error : data.error?.message) ?? "Signup failed.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to create your account right now.");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-lg md:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Start organizing your notes and resources in StudyVault.</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Full name
          </label>
          <Input id="name" type="text" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex Doe" />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <Input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
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
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
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
          Sign Up
        </Button>
      </form>

      <p className="mt-4 text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-[var(--brand)] hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}