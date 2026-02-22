import { PageHeader } from "@/components/dashboard/page-header";
import { ExamsClient } from "@/src/components/dashboard/exams-client";
import { getCurrentUserId } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ExamsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login");

  const upcoming = await prisma.exam.count({ where: { userId, status: "UPCOMING", date: { gte: new Date() } } });
  const insight =
    upcoming >= 3
      ? `${upcoming} upcoming exams. Prioritize revision plan by nearest exam date.`
      : upcoming > 0
        ? `${upcoming} upcoming exam${upcoming > 1 ? "s" : ""}. Keep daily recap notes active.`
        : "No upcoming exams right now. Great time to consolidate notes.";

  return (
    <>
      <PageHeader title="Exams" description="Track upcoming exams with urgency indicators." insight={insight} />
      <ExamsClient />
    </>
  );
}
