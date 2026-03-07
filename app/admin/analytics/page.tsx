import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/require-user";
import { isAdminUser } from "@/lib/admin";
import { AdminAnalyticsClient } from "@/src/components/dashboard/admin-analytics-client";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login");

  const admin = await isAdminUser(userId);
  if (!admin) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-[rgb(var(--background))] px-4 py-6 sm:px-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--primary))]">Admin Reporting</p>
              <h1 className="mt-1 text-2xl font-semibold text-[rgb(var(--text-primary))]">Analytics Dashboard</h1>
              <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                Real-time platform insights, report preview, and PDF export for StudyVault operations.
              </p>
            </div>
            <Link
              href="/dashboard/admin"
              className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-3 py-2 text-sm font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--surface-active))]"
            >
              Back to Admin Panel
            </Link>
          </div>
        </section>

        <AdminAnalyticsClient />
      </div>
    </main>
  );
}
