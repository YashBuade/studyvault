import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentUserId } from "@/lib/require-user";
import { isAdminUser } from "@/lib/admin";
import { AdminReportsClient } from "@/src/components/dashboard/admin-reports-client";

export default async function AdminPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login");

  const isAdmin = await isAdminUser(userId);
  if (!isAdmin) redirect("/dashboard");

  return (
    <>
      <PageHeader
        title="Admin Panel"
        description="Moderate public notes and handle reports."
        insight="Resolve pending reports quickly to keep the public library trustworthy."
      />
      <AdminReportsClient />
    </>
  );
}
