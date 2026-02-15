import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogoutButton } from "@/components/dashboard/logout-button";
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
    <div className="min-h-screen">
      <DashboardSidebar />
      <div className="md:pl-72">
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/80 px-4 py-4 backdrop-blur md:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 pt-10 md:pt-0">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Workspace</p>
              <p className="text-sm font-semibold text-[var(--text)]">StudyVault Console</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LogoutButton />
            </div>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8 md:py-10">
          <div className="mx-auto max-w-6xl">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
      <OnboardingModal />
    </div>
  );
}
