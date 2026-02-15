"use client";

import { FormEvent, useState } from "react";
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
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { pushToast } = useToast();

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });

    const payload = (await response.json()) as ApiResponse<Profile>;

    if (!response.ok || !payload.ok || !payload.data) {
      setMessage(payload.error?.message ?? "Could not update profile.");
      setLoading(false);
      return;
    }

    setMessage("Profile updated.");
    setAvatarUrl(payload.data.avatarUrl);
    setLoading(false);
    pushToast("Profile updated", "success");
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch("/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const payload = (await response.json()) as ApiResponse<{ updated: boolean }>;

    if (!response.ok || !payload.ok) {
      setMessage(payload.error?.message ?? "Could not update password.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setMessage("Password updated.");
    pushToast("Password changed", "success");
  }

  async function uploadAvatar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!avatar) {
      setMessage("Select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", avatar);

    const response = await fetch("/api/profile/avatar", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as ApiResponse<{ avatarUrl: string }>;

    if (!response.ok || !payload.ok || !payload.data) {
      setMessage(payload.error?.message ?? "Avatar upload failed.");
      return;
    }

    setAvatarUrl(payload.data.avatarUrl);
    setAvatar(null);
    setMessage("Avatar updated.");
    pushToast("Avatar uploaded", "success");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Profile" description="Update your account identity.">
        <form onSubmit={updateProfile} className="space-y-3">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile avatar"
              width={56}
              height={56}
              className="h-14 w-14 rounded-full border border-[var(--border)] object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold">
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" />
          <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" />
          <Button type="submit" loading={loading}>
            Save Profile
          </Button>
        </form>
      </Card>

      <Card title="Change Password" description="Set a stronger password.">
        <form onSubmit={changePassword} className="space-y-3">
          <Input
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            type="password"
            placeholder="Current password"
          />
          <Input
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            type="password"
            placeholder="New password"
          />
          <Button type="submit" variant="secondary">
            Update Password
          </Button>
        </form>
      </Card>

      <Card title="Profile Picture" description="Upload an image avatar.">
        <form onSubmit={uploadAvatar} className="space-y-3">
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setAvatar(event.target.files?.[0] ?? null)}
            className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm"
          />
          <Button type="submit" variant="secondary">
            Upload Avatar
          </Button>
        </form>
      </Card>

      {message ? <Alert message={message} variant="info" /> : null}
    </div>
  );
}
