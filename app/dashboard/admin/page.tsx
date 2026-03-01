import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentUserId } from "@/lib/require-user";
import { isAdminUser } from "@/lib/admin";
import { AdminReportsClient } from "@/src/components/dashboard/admin-reports-client";
import { ModuleShell } from "@/components/dashboard/module-shell";

export default async function AdminPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login");

  const isAdmin = await isAdminUser(userId);
  if (!isAdmin) redirect("/dashboard");

  return (
    <>
      <PageHeader
        title="Admin Panel"
        description="Moderate public content and manage teacher verification."
        insight="Use teacher approvals and file verification to keep academic content trustworthy."
      />
      <ModuleShell
        summary="Admin workflow is simple: validate teachers, oversee expert file verification, and moderate reports."
        checklist={["Approve valid teachers", "Check verification queue health", "Resolve report backlog"]}
      >
        <section className="mb-5 rounded-[var(--radius-lg)] border border-emerald-300/60 bg-emerald-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Dedicated Teacher Verification Section</p>
          <p className="mt-2 text-sm text-emerald-900">
            Every teacher must be validated here using College ID, expertise, and submitted college ID photo before approval.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/dashboard/admin/teachers"
              className="rounded-[var(--radius-md)] border border-emerald-400/70 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100/70"
            >
              Open Teacher Validation Desk
            </Link>
          </div>
        </section>
        <section className="mb-5 grid gap-3 rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 sm:grid-cols-2">
          <Link
            href="/dashboard/admin/teachers"
            className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-4 py-3 text-sm font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--surface-active))]"
          >
            Open Teacher Verification Queue
          </Link>
          <Link
            href="/dashboard/teacher/review"
            className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-4 py-3 text-sm font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--surface-active))]"
          >
            Open File Verification Queue
          </Link>
        </section>
        <AdminReportsClient />
      </ModuleShell>
    </>
  );
}
