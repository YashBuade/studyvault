import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentUserId } from "@/lib/require-user";
import { NotificationsClient } from "@/src/components/dashboard/notifications-client";
import { ModuleShell } from "@/components/dashboard/module-shell";

export default async function NotificationsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login");

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Stay on top of activity in your notes and workspace."
        insight="Check notifications daily so note interactions and moderation updates do not pile up."
      />
      <ModuleShell
        summary="Review updates daily so verification and collaboration actions are never missed."
        checklist={["Open unread items first", "Resolve moderation alerts quickly", "Clear stale notifications"]}
      >
        <NotificationsClient />
      </ModuleShell>
    </>
  );
}
