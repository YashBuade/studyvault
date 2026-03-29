import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, Clock, Mail, XCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { PageHeader } from "@/components/dashboard/page-header";
import { ModuleShell } from "@/components/dashboard/module-shell";

export default async function TeacherDashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  if (user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  const approved = user.teacherVerificationStatus === "APPROVED";
  const pending = user.teacherVerificationStatus === "PENDING";
  const rejected = user.teacherVerificationStatus === "REJECTED";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Workspace"
        description="Teacher access is role-based and controlled by admin verification."
      />
      <ModuleShell
        summary="Teacher workflow starts after admin approval. Then review student files manually and assign verification status."
        checklist={["Wait for admin approval", "Review files in queue", "Mark only valid files as verified"]}
        highlights={[{ label: "Current Status", value: user.teacherVerificationStatus }]}
      >
        {pending ? (
          <section className="rounded-[var(--radius-lg)] border border-amber-500/30 bg-amber-50 p-5 shadow-[var(--shadow-sm)] dark:border-amber-300/30 dark:bg-amber-900/20">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                <Clock size={22} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Verification in progress</p>
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                  Your college ID is being reviewed by an admin. You&apos;ll be notified once approved.
                </p>
                {user.teacherReviewNotes ? (
                  <p className="mt-3 rounded-[var(--radius-md)] border border-amber-500/20 bg-[rgb(var(--surface))]/80 px-3 py-2 text-sm text-amber-900 dark:border-amber-300/20 dark:bg-[rgb(var(--surface-elevated))]/70 dark:text-amber-100">
                    Admin note: {user.teacherReviewNotes}
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {approved ? (
          <section className="rounded-[var(--radius-lg)] border border-emerald-500/30 bg-emerald-50 p-5 shadow-[var(--shadow-sm)] dark:border-emerald-300/30 dark:bg-emerald-900/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                  <BadgeCheck size={22} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Verified Teacher ✓</p>
                  <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">
                    Your teacher account is approved. You can now review uploaded public files.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/teacher/review"
                className="inline-flex min-h-10 w-full items-center justify-center rounded-[var(--radius-md)] border border-emerald-500/30 bg-[rgb(var(--surface))] px-4 py-2 text-center text-sm font-semibold text-emerald-800 shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-md)] sm:w-auto dark:border-emerald-300/20 dark:bg-[rgb(var(--surface-elevated))] dark:text-emerald-100"
              >
                Open review queue
              </Link>
            </div>
          </section>
        ) : null}

        {rejected ? (
          <section className="rounded-[var(--radius-lg)] border border-red-500/30 bg-red-50 p-5 shadow-[var(--shadow-sm)] dark:border-red-300/30 dark:bg-red-900/20">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200">
                <XCircle size={22} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900 dark:text-red-100">Verification was not approved</p>
                <p className="mt-1 text-sm text-red-800 dark:text-red-200">
                  {user.teacherReviewNotes ? user.teacherReviewNotes : "Please review your submission details and try again."}
                </p>
                <a
                  href="mailto:support@studyvault.example"
                  className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-red-500/30 bg-[rgb(var(--surface))] px-4 text-sm font-semibold text-red-800 shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-md)] dark:border-red-300/20 dark:bg-[rgb(var(--surface-elevated))] dark:text-red-100"
                >
                  <Mail size={16} /> Contact support
                </a>
              </div>
            </div>
          </section>
        ) : null}
      </ModuleShell>
    </div>
  );
}
