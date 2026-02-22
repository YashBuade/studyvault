import { redirect } from "next/navigation";
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
        <div className="absolute -left-28 top-20 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/15" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl dark:bg-indigo-500/15" />
      </div>

      <DashboardSidebar isAdmin={user.role === "ADMIN"} />
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
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>

      <OnboardingModal />
    </div>
  );
}
