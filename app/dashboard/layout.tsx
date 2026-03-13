import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { Logo } from "@/components/ui/logo";
import { getCurrentUser } from "@/lib/current-user";
import { PageTransition } from "@/src/components/ui/page-transition";
import { OnboardingModal } from "@/src/components/dashboard/onboarding-modal";
import { QuickStartPanel } from "@/components/dashboard/quick-start-panel";
import { DismissibleBanner } from "@/components/dashboard/dismissible-banner";
import { MobilePageTitle } from "@/components/dashboard/mobile-page-title";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";

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
        <div className="hero-grid absolute inset-0 opacity-20" />
      </div>

      <DashboardSidebar
        isAdmin={user.role === "ADMIN"}
        isTeacher={user.role === "TEACHER"}
        teacherStatus={user.teacherVerificationStatus}
        isVerifiedTeacher={user.role === "TEACHER" && user.teacherVerificationStatus === "APPROVED"}
      />
      <div className="md:pl-72">
        <header className="sticky top-0 z-30 border-b border-[rgb(var(--border))]/80 bg-[rgb(var(--surface))]/80 backdrop-blur-2xl">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6 md:px-8">
            <div className="md:hidden">
              <div className="grid grid-cols-[40px_1fr_40px] items-center gap-2">
                <Logo size="sm" showText={false} />
                <MobilePageTitle />
                <span aria-hidden="true" />
              </div>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <Logo size="sm" showText={false} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--text-tertiary))]">StudyVault</p>
                <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Learning Workspace</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden rounded-full border border-[rgb(var(--border))]/80 bg-[rgb(var(--surface))]/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--text-secondary))] shadow-[var(--shadow-xs)] sm:block">
                {user.role === "ADMIN"
                  ? "Admin"
                  : user.role === "TEACHER"
                    ? user.teacherVerificationStatus === "APPROVED"
                      ? "Verified Teacher"
                      : "Teacher Pending"
                    : "Student"}
              </div>
              <div className="hidden rounded-full border border-[rgb(var(--border))]/60 bg-[rgb(var(--surface-hover))]/80 px-3 py-1 text-xs font-medium text-[rgb(var(--text-secondary))] shadow-[var(--shadow-xs)] sm:block">
                {user.name || user.email}
              </div>
              <ThemeToggle />
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-7xl">
            <Breadcrumbs />
            {user.role === "TEACHER" && user.teacherVerificationStatus !== "APPROVED" ? (
              <DismissibleBanner>
                Teacher verification is pending admin approval. Reviewer tools unlock after approval.
              </DismissibleBanner>
            ) : null}
            <QuickStartPanel />
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>

      <OnboardingModal />
    </div>
  );
}
