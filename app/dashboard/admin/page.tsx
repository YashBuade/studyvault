import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentUserId } from "@/lib/require-user";
import { isAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { AdminReportsClient } from "@/src/components/dashboard/admin-reports-client";
import { ModuleShell } from "@/components/dashboard/module-shell";

export default async function AdminPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login");

  const isAdmin = await isAdminUser(userId);
  if (!isAdmin) redirect("/dashboard");

  const [pendingTeacherCount, recentTeacherRequests] = await Promise.all([
    prisma.user.count({
      where: { role: "TEACHER", teacherVerificationStatus: "PENDING" },
    }),
    prisma.user.findMany({
      where: { role: "TEACHER" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        teacherVerificationStatus: true,
        createdAt: true,
      },
    }),
  ]);

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
        highlights={[
          { label: "Pending Teacher Verifications", value: String(pendingTeacherCount) },
          { label: "Recent Teacher Requests", value: String(recentTeacherRequests.length) },
        ]}
      >
        <section className="mb-5 rounded-[var(--radius-lg)] border border-[rgb(var(--primary))]/45 bg-[rgb(var(--surface-elevated))] p-4 shadow-[var(--shadow-md)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--primary))]">Dedicated Teacher Verification Section</p>
              <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                Admin must manually verify each teacher by college ID, expertise, and ID photo before reviewer access is granted.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full border border-amber-400/60 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              {pendingTeacherCount} Pending
            </span>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {recentTeacherRequests.map((teacher) => (
              <div
                key={teacher.id}
                className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2"
              >
                <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{teacher.name}</p>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">{teacher.email}</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-[rgb(var(--text-tertiary))]">
                  {teacher.teacherVerificationStatus} | {teacher.createdAt.toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/dashboard/admin/teachers"
              className="rounded-[var(--radius-md)] border border-[rgb(var(--primary))]/60 bg-[rgb(var(--primary-soft))] px-3 py-2 text-xs font-semibold text-[rgb(var(--primary-hover))] transition hover:bg-[rgb(var(--surface-hover))]"
            >
              Open Teacher Validation Desk
            </Link>
            <Link
              href="/admin/analytics"
              className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-xs font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--surface-hover))]"
            >
              Open Admin Analytics
            </Link>
            <Link
              href="/dashboard/teacher/review"
              className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-xs font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--surface-hover))]"
            >
              Open File Verification Queue
            </Link>
          </div>
        </section>
        <section className="mb-5 grid gap-3 rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 sm:grid-cols-3">
          <Link
            href="/dashboard/admin/teachers"
            className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-4 py-3 text-sm font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--surface-active))]"
          >
            Open Teacher Verification Queue
          </Link>
          <Link
            href="/admin/analytics"
            className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-4 py-3 text-sm font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--surface-active))]"
          >
            Open Admin Analytics Dashboard
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
