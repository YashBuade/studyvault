import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getCurrentUser } from "@/lib/current-user";
import { PageTransition } from "@/src/components/ui/page-transition";
import { OnboardingModal } from "@/src/components/dashboard/onboarding-modal";
import { QuickStartPanel } from "@/components/dashboard/quick-start-panel";
import { DismissibleBanner } from "@/components/dashboard/dismissible-banner";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { MobileTabBar } from "@/components/dashboard/mobile-tab-bar";

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
    <div className="min-h-screen bg-[rgb(var(--background))] dark:bg-slate-950">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-28 top-20 h-80 w-80 rounded-full bg-[rgb(var(--color-primary-light)/0.7)] blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[rgb(var(--color-info-light)/0.75)] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[rgb(var(--color-success-light)/0.6)] blur-3xl" />
        <div className="hero-grid absolute inset-0 opacity-20" />
      </div>

      <DashboardSidebar
        isAdmin={user.role === "ADMIN"}
        isTeacher={user.role === "TEACHER"}
        teacherStatus={user.teacherVerificationStatus}
        isVerifiedTeacher={user.role === "TEACHER" && user.teacherVerificationStatus === "APPROVED"}
        name={user.name}
        email={user.email}
      />
      <div className="md:pl-72">
        <DashboardTopbar name={user.name} email={user.email} />

        <main className="px-4 py-6 pb-24 sm:px-6 md:px-8 md:py-8 md:pb-8">
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
      <MobileTabBar />
    </div>
  );
}
