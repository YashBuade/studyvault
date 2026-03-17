"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { Alert } from "@/src/components/ui/alert";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { useToast } from "@/src/components/ui/toast-provider";

type Profile = {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
};

type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: { message: string };
};

export function ProfileClient({ initialProfile }: { initialProfile: Profile }) {
  const [name, setName] = useState(initialProfile.name);
  const [email, setEmail] = useState(initialProfile.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl);
  const [message, setMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { pushToast } = useToast();

  const initials = useMemo(() => {
    const parts = (name || email)
      .split(" ")
      .map((part) => part.trim())
      .filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : parts[0]?.[1] ?? "";
    return `${first}${last}`.toUpperCase();
  }, [email, name]);

  const avatarGradient = useMemo(() => {
    const seed = (name || email || "profile").toLowerCase();
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const hue1 = Math.abs(hash) % 360;
    const hue2 = (hue1 + 40) % 360;
    return `linear-gradient(135deg, hsl(${hue1} 85% 55%), hsl(${hue2} 85% 55%))`;
  }, [email, name]);

  const passwordStrength = useMemo(() => {
    const value = newPassword;
    const checks = [
      value.length >= 8,
      /[a-z]/.test(value),
      /[A-Z]/.test(value),
      /\d/.test(value),
      /[^A-Za-z0-9]/.test(value),
    ];
    const score = checks.filter(Boolean).length;
    const label = score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong";
    const pct = Math.round((score / 5) * 100);
    return { score, label, pct };
  }, [newPassword]);

  const passwordsMatch = confirmNewPassword.length === 0 ? true : newPassword === confirmNewPassword;

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });

    const payload = (await response.json()) as ApiResponse<Profile>;

    if (!response.ok || !payload.ok || !payload.data) {
      setMessage(payload.error?.message ?? "Could not update profile.");
      setSavingProfile(false);
      return;
    }

    setMessage("Profile updated.");
    setAvatarUrl(payload.data.avatarUrl);
    setSavingProfile(false);
    pushToast("Profile updated", "success");
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordsMatch) {
      setMessage("Passwords do not match.");
      return;
    }
    setSavingPassword(true);

    const response = await fetch("/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const payload = (await response.json()) as ApiResponse<{ updated: boolean }>;

    if (!response.ok || !payload.ok) {
      setMessage(payload.error?.message ?? "Could not update password.");
      setSavingPassword(false);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setMessage("Password updated.");
    pushToast("Password changed", "success");
    setSavingPassword(false);
  }

  async function uploadAvatar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!avatar) {
      setMessage("Select an image first.");
      return;
    }
    setUploadingAvatar(true);

    const formData = new FormData();
    formData.append("avatar", avatar);

    const response = await fetch("/api/profile/avatar", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as ApiResponse<{ avatarUrl: string }>;

    if (!response.ok || !payload.ok || !payload.data) {
      setMessage(payload.error?.message ?? "Avatar upload failed.");
      setUploadingAvatar(false);
      return;
    }

    setAvatarUrl(payload.data.avatarUrl);
    setAvatar(null);
    setMessage("Avatar updated.");
    pushToast("Avatar uploaded", "success");
    setUploadingAvatar(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--primary))]">Your workspace</p>
          <h1 className="mt-1 text-2xl font-semibold text-[rgb(var(--text-primary))]">Profile</h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Update your identity, photo, and password.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <Card title="Avatar" description="Your public profile photo and initials.">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile avatar"
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-3xl border border-[rgb(var(--border))] object-cover dark:border-slate-700"
                />
              ) : (
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-3xl border border-[rgb(var(--border))] text-xl font-semibold text-white dark:border-slate-700"
                  style={{ backgroundImage: avatarGradient }}
                >
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">{name || "Your name"}</p>
                <p className="truncate text-sm text-[rgb(var(--text-secondary))]">{email}</p>
                <form onSubmit={uploadAvatar} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="flex w-full cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-2 text-sm font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--surface-hover))] sm:w-auto">
                    Choose photo
                    <input type="file" accept="image/*" onChange={(event) => setAvatar(event.target.files?.[0] ?? null)} className="sr-only" />
                  </label>
                  <Button type="submit" variant="secondary" loading={uploadingAvatar} className="w-full sm:w-auto" disabled={!avatar}>
                    {uploadingAvatar ? "Uploading..." : "Upload photo"}
                  </Button>
                </form>
                {avatar ? <p className="mt-2 text-xs text-[rgb(var(--text-tertiary))]">Selected: {avatar.name}</p> : null}
              </div>
            </div>
          </Card>

          <Card title="Personal Information" description="Your name and email address.">
            <form onSubmit={updateProfile} className="space-y-3">
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" />
              <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" />
              <Button type="submit" loading={savingProfile} className="w-full sm:w-auto">
                {savingProfile ? "Saving..." : "Save changes"}
              </Button>
            </form>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Account Security" description="Change your password safely.">
            <form onSubmit={changePassword} className="space-y-3">
              <Input value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} type="password" placeholder="Current password" />
              <div className="space-y-2">
                <Input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" placeholder="New password" />
                <div className="h-2 overflow-hidden rounded-full bg-[rgb(var(--surface-hover))]">
                  <div
                    className={`h-full transition-all ${passwordStrength.pct >= 80 ? "bg-emerald-500" : passwordStrength.pct >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{ width: `${passwordStrength.pct}%` }}
                  />
                </div>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">Strength: {passwordStrength.label}</p>
              </div>
              <div>
                <Input
                  value={confirmNewPassword}
                  onChange={(event) => setConfirmNewPassword(event.target.value)}
                  type="password"
                  placeholder="Confirm new password"
                />
                {!passwordsMatch ? <p className="mt-2 text-xs text-[rgb(var(--error))]">Passwords do not match.</p> : null}
              </div>
              <Button
                type="submit"
                variant="secondary"
                loading={savingPassword}
                className="w-full sm:w-auto"
                disabled={!currentPassword.trim() || !newPassword.trim() || !passwordsMatch}
              >
                {savingPassword ? "Saving..." : "Update password"}
              </Button>
            </form>
          </Card>

          <Card title="Account Status" description="Your workspace access and security.">
            <div className="space-y-2 text-sm text-[rgb(var(--text-secondary))]">
              <div className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3 shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]">
                <span>Workspace access</span>
                <span className="text-[rgb(var(--text-primary))]">Active</span>
              </div>
              <div className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3 shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]">
                <span>Session status</span>
                <span className="text-[rgb(var(--text-primary))]">Secure</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {message ? <Alert message={message} variant="info" /> : null}
    </div>
  );
}
