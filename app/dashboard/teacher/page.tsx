import Link from "next/link";
import { redirect } from "next/navigation";
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
        <section className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-[var(--shadow-sm)]">
          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            Verification status: {user.teacherVerificationStatus}
          </p>
          <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
            {approved
              ? "Your teacher account is approved. You can now review uploaded public files."
              : "Your teacher account is pending admin verification. You will gain reviewer access after approval."}
          </p>
          {user.teacherReviewNotes ? (
            <p className="mt-2 rounded-md bg-[rgb(var(--surface-hover))] px-3 py-2 text-sm text-[rgb(var(--text-secondary))]">
              Admin note: {user.teacherReviewNotes}
            </p>
          ) : null}
          {approved ? (
            <Link
              href="/dashboard/teacher/review"
              className="mt-4 inline-flex rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-4 py-2 text-sm font-semibold"
            >
              Open file verification queue
            </Link>
          ) : null}
        </section>
      </ModuleShell>
    </div>
  );
}
