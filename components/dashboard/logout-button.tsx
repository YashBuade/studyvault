"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/auth/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm font-medium text-[var(--text)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      Logout
    </button>
  );
}