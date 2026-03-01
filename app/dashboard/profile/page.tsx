import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProfileClient } from "@/components/dashboard/profile-client";
import { getCurrentUserId } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { ModuleShell } from "@/components/dashboard/module-shell";

export default async function ProfilePage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <>
      <PageHeader
        title="Profile"
        description="Manage your personal identity and account details."
        insight="Keep your profile current so shared notes are trusted by collaborators."
      />
      <ModuleShell
        summary="Keep your profile accurate so your notes and contributions are easy to trust and identify."
        checklist={["Use a clear name", "Keep email active", "Update avatar for quick recognition"]}
      >
        <ProfileClient initialProfile={user} />
      </ModuleShell>
    </>
  );
}
