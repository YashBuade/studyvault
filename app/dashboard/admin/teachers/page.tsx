import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentUserId } from "@/lib/require-user";
import { isAdminUser } from "@/lib/admin";
import { AdminTeachersClient } from "@/src/components/dashboard/admin-teachers-client";

export default async function AdminTeachersPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login");

  const admin = await isAdminUser(userId);
  if (!admin) redirect("/dashboard");

  return (
    <>
      <PageHeader
        title="Teacher Verification"
        description="Approve or reject teacher accounts based on submitted college identification."
      />
      <AdminTeachersClient />
    </>
  );
}
