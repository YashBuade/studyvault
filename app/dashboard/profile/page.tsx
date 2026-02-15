import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProfileClient } from "@/components/dashboard/profile-client";
import { getCurrentUserId } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";

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
      <PageHeader title="Profile" description="Manage your personal identity and account details." />
      <ProfileClient initialProfile={user} />
    </>
  );
}