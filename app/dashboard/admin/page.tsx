import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentUserId } from "@/lib/require-user";
import { isAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { AdminReportsClient } from "@/src/components/dashboard/admin-reports-client";
import { ModuleShell } from "@/components/dashboard/module-shell";

function formatRelativeDate(input: Date) {
  const date = new Date(input);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays >= 2 && diffDays <= 6) return `${diffDays} days ago`;
  if (diffDays >= 7 && diffDays <= 29) {
    const weeks = Math.round(diffDays / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }

  const includeYear = now.getFullYear() !== date.getFullYear();
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(date);
}

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
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Pending Verifications",
              value: String(pendingTeacherCount),
              icon: Clock,
              context: pendingTeacherCount === 0 ? "Queue is clear" : "Needs review",
            },
            {
              label: "Recent Requests",
              value: String(recentTeacherRequests.length),
              icon: Users,
              context: "Last 5 signups",
            },
            {
              label: "Verification Desk",
              value: "Open",
              icon: ShieldCheck,
              context: "Approve / reject teachers",
              href: "/dashboard/admin/teachers",
            },
            {
              label: "File Reviews",
              value: "Queue",
              icon: CheckCircle2,
              context: "Teacher review portal",
              href: "/dashboard/teacher/review",
            },
          ].map((stat) => {
            const Icon = stat.icon;
            const content = (
              <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-4 hover:shadow-[var(--shadow-md)] transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{stat.value}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">{stat.label}</p>
                    <p className="mt-1 text-xs text-[rgb(var(--text-secondary))]">{stat.context}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[rgb(var(--surface-hover))] text-[rgb(var(--text-tertiary))]">
                    <Icon size={18} />
                  </div>
                </div>
              </div>
            );

            return stat.href ? (
              <Link key={stat.label} href={stat.href} className="block">
                {content}
              </Link>
            ) : (
              <div key={stat.label}>{content}</div>
            );
          })}
        </section>

        <section className="mb-5 rounded-[var(--radius-lg)] border border-[rgb(var(--primary))]/30 bg-[linear-gradient(135deg,rgb(var(--color-primary-light))_0%,rgb(var(--surface))_52%,rgb(var(--color-info-light))_100%)] p-4 shadow-[var(--shadow-md)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--primary))]">Dedicated Teacher Verification Section</p>
              <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                Admin must manually verify each teacher by college ID, expertise, and ID photo before reviewer access is granted.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full border border-[rgb(var(--color-warning))]/30 bg-[rgb(var(--color-warning-light))] px-3 py-1 text-xs font-semibold text-[rgb(var(--color-warning))]">
              {pendingTeacherCount} Pending
            </span>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {recentTeacherRequests.map((teacher) => (
              <div
                key={teacher.id}
                className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-[var(--shadow-sm)] p-4 hover:shadow-[var(--shadow-md)] transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">{teacher.name}</p>
                    <p className="truncate text-sm text-[rgb(var(--text-secondary))]">{teacher.email}</p>
                    <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">Submitted {formatRelativeDate(teacher.createdAt)}</p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                      teacher.teacherVerificationStatus === "APPROVED"
                        ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-900/30 dark:text-emerald-200"
                        : teacher.teacherVerificationStatus === "REJECTED"
                          ? "border-red-500/40 bg-red-50 text-red-700 dark:border-red-300/30 dark:bg-red-900/30 dark:text-red-200"
                          : "border-amber-500/40 bg-amber-50 text-amber-800 dark:border-amber-300/30 dark:bg-amber-900/30 dark:text-amber-200"
                    }`}
                  >
                    {teacher.teacherVerificationStatus}
                  </span>
                </div>
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
        <AdminReportsClient />
      </ModuleShell>
    </>
  );
}
