import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { Logo } from "@/components/ui/logo";
import { getCurrentUser } from "@/lib/current-user";
import { PageTransition } from "@/src/components/ui/page-transition";
import { OnboardingModal } from "@/src/components/dashboard/onboarding-modal";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-28 top-20 h-80 w-80 rounded-full bg-sky-300/25 blur-3xl dark:bg-sky-500/18" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-indigo-300/22 blur-3xl dark:bg-indigo-500/18" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-300/15 blur-3xl dark:bg-emerald-500/12" />
      </div>

      <DashboardSidebar
        isAdmin={user.role === "ADMIN"}
        isTeacher={user.role === "TEACHER"}
        teacherStatus={user.teacherVerificationStatus}
        isVerifiedTeacher={user.role === "TEACHER" && user.teacherVerificationStatus === "APPROVED"}
      />
      <div className="md:pl-72">
        <header className="sticky top-0 z-30 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))]/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 md:px-8">
            <div className="md:hidden">
              <Logo size="sm" showText={false} />
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <Logo size="sm" showText={false} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-tertiary))]">StudyVault</p>
                <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Learning Workspace</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden rounded-full border border-[rgb(var(--border))] bg-gradient-to-r from-[rgb(var(--surface-hover))] to-[rgb(var(--surface))] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--text-secondary))] sm:block">
                {user.role === "ADMIN"
                  ? "Admin"
                  : user.role === "TEACHER"
                    ? user.teacherVerificationStatus === "APPROVED"
                      ? "Verified Teacher"
                      : "Teacher Pending"
                    : "Student"}
              </div>
              <div className="hidden rounded-full bg-[rgb(var(--surface-hover))] px-3 py-1 text-xs font-medium text-[rgb(var(--text-secondary))] sm:block">
                {user.name || user.email}
              </div>
              <ThemeToggle />
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-7xl">
            {user.role === "TEACHER" && user.teacherVerificationStatus !== "APPROVED" ? (
              <div className="mb-4 rounded-[var(--radius-md)] border border-amber-300/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
                Teacher verification is pending admin approval. Reviewer tools unlock after approval.
              </div>
            ) : null}
            <section className="mb-5 rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[var(--shadow-xs)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[rgb(var(--text-tertiary))]">Quick Start</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/dashboard/notes" className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-3 py-2 text-xs font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--surface-active))]">1. Capture notes</Link>
                <Link href="/dashboard/upload-center" className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-3 py-2 text-xs font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--surface-active))]">2. Upload files</Link>
                <Link href="/dashboard/planner" className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-3 py-2 text-xs font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--surface-active))]">3. Plan your week</Link>
                <Link href="/notes" className="rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-3 py-2 text-xs font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--surface-active))]">4. Explore public library</Link>
              </div>
            </section>
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>

      <OnboardingModal />
    </div>
  );
}
