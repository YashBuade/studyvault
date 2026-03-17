"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, Bell, Eye, EyeOff, Mail, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Modal } from "@/src/components/ui/modal";
import { useToast } from "@/src/components/ui/toast-provider";

type ApiResponse<T> = { ok: boolean; data?: T; error?: { message?: string } };
type Profile = { id: number; name: string; email: string; avatarUrl: string | null };

const PREFS_KEY = "studyvault-settings-prefs-v1";

type SettingsPrefs = {
  defaultNoteVisibility: "public" | "private";
  emailNotifications: boolean;
  inAppNotifications: boolean;
};

function loadPrefs(): SettingsPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) {
      return { defaultNoteVisibility: "public", emailNotifications: true, inAppNotifications: true };
    }
    const parsed = JSON.parse(raw) as Partial<SettingsPrefs>;
    return {
      defaultNoteVisibility: parsed.defaultNoteVisibility === "private" ? "private" : "public",
      emailNotifications: typeof parsed.emailNotifications === "boolean" ? parsed.emailNotifications : true,
      inAppNotifications: typeof parsed.inAppNotifications === "boolean" ? parsed.inAppNotifications : true,
    };
  } catch {
    return { defaultNoteVisibility: "public", emailNotifications: true, inAppNotifications: true };
  }
}

function savePrefs(prefs: SettingsPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function SettingsClient() {
  const { pushToast } = useToast();
  const [prefs, setPrefs] = useState<SettingsPrefs | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(false);

  const [confirmEmail, setConfirmEmail] = useState("");
  const [dangerOpen, setDangerOpen] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  useEffect(() => {
    async function loadProfile() {
      setLoadingProfile(true);
      setProfileError(false);
      try {
        const res = await fetch("/api/profile");
        const payload = (await res.json()) as ApiResponse<Profile>;
        if (res.ok && payload.ok && payload.data) {
          setProfile(payload.data);
        } else {
          setProfileError(true);
        }
      } catch {
        setProfileError(true);
      } finally {
        setLoadingProfile(false);
      }
    }
    void loadProfile();
  }, []);

  const canDelete = useMemo(() => {
    if (!profile) return false;
    return confirmEmail.trim().toLowerCase() === profile.email.toLowerCase();
  }, [confirmEmail, profile]);

  function update(next: SettingsPrefs, toastMsg?: string) {
    setPrefs(next);
    savePrefs(next);
    if (toastMsg) pushToast(toastMsg, "success");
  }

  async function submitDelete(event?: FormEvent) {
    event?.preventDefault();
    if (!canDelete) {
      pushToast("Type your email to confirm.", "error");
      return;
    }
    pushToast("Account deletion is not enabled yet. Contact support to proceed.", "info");
    setDangerOpen(false);
  }

  if (!prefs) return null;

  return (
    <div className="space-y-4">
      <Card title="Privacy" description="Default visibility for newly created notes.">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => update({ ...prefs, defaultNoteVisibility: "public" }, "Default visibility set to Public")}
            className={`flex items-start gap-3 rounded-[var(--radius-lg)] border p-4 text-left shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)] ${
              prefs.defaultNoteVisibility === "public"
                ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary-soft))]"
                : "border-[rgb(var(--border))] bg-[rgb(var(--surface))]"
            }`}
          >
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[rgb(var(--surface))] text-[rgb(var(--primary))]">
              <Eye size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Public</p>
              <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Visible in the public library (recommended only for polished notes).</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => update({ ...prefs, defaultNoteVisibility: "private" }, "Default visibility set to Private")}
            className={`flex items-start gap-3 rounded-[var(--radius-lg)] border p-4 text-left shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)] ${
              prefs.defaultNoteVisibility === "private"
                ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary-soft))]"
                : "border-[rgb(var(--border))] bg-[rgb(var(--surface))]"
            }`}
          >
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[rgb(var(--surface))] text-[rgb(var(--primary))]">
              <EyeOff size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Private</p>
              <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Only visible to you. You can publish specific notes later.</p>
            </div>
          </button>
        </div>
      </Card>

      <Card title="Notifications" description="Choose how you want to be notified.">
        <div className="space-y-3">
          <label className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))]">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Email notifications</p>
                <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Weekly digests and deadline reminders.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.emailNotifications}
              onChange={(event) => update({ ...prefs, emailNotifications: event.target.checked }, "Notification preference updated")}
              className="h-5 w-5 rounded border border-[rgb(var(--border))]"
              aria-label="Toggle email notifications"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[rgb(var(--primary-soft))] text-[rgb(var(--primary))]">
                <Bell size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">In-app notifications</p>
                <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Likes, comments, and system updates.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.inAppNotifications}
              onChange={(event) => update({ ...prefs, inAppNotifications: event.target.checked }, "Notification preference updated")}
              className="h-5 w-5 rounded border border-[rgb(var(--border))]"
              aria-label="Toggle in-app notifications"
            />
          </label>
        </div>
      </Card>

      <Card className="border-red-500/30">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-[rgb(var(--color-danger-light))] p-2 text-[rgb(var(--error))]">
            <AlertCircle size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Danger Zone</p>
            <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Deleting your account is permanent and cannot be undone.</p>

            <div className="mt-4 space-y-2">
              {loadingProfile ? (
                <p className="text-sm text-[rgb(var(--text-secondary))]">Loading your email…</p>
              ) : profileError ? (
                <p className="text-sm text-[rgb(var(--text-secondary))]">Unable to load your email. You can still contact support.</p>
              ) : (
                <p className="text-sm text-[rgb(var(--text-secondary))]">
                  Type <span className="font-semibold text-[rgb(var(--text-primary))]">{profile?.email}</span> to confirm.
                </p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  value={confirmEmail}
                  onChange={(event) => setConfirmEmail(event.target.value)}
                  placeholder="your@email.com"
                  type={showEmail ? "text" : "password"}
                />
                <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setShowEmail((p) => !p)}>
                  {showEmail ? "Hide" : "Show"}
                </Button>
              </div>
              <Button
                type="button"
                variant="danger"
                className="w-full sm:w-auto"
                disabled={!canDelete}
                onClick={() => setDangerOpen(true)}
              >
                <Trash2 size={16} /> Delete account
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Modal
        open={dangerOpen}
        title="Delete account"
        description="This will permanently delete your account. This action cannot be undone."
        onClose={() => setDangerOpen(false)}
        onConfirm={() => void submitDelete()}
        confirmLabel="Delete permanently"
        danger
      />
    </div>
  );
}

