import { PageHeader } from "@/components/dashboard/page-header";
import { AssignmentsClient } from "@/src/components/dashboard/assignments-client";
import { getCurrentUserId } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ModuleShell } from "@/components/dashboard/module-shell";

export default async function AssignmentsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login");

  const [pending, overdue] = await Promise.all([
    prisma.assignment.count({ where: { userId, status: "PENDING" } }),
    prisma.assignment.count({ where: { userId, status: { not: "COMPLETED" }, dueDate: { lt: new Date() } } }),
  ]);

  const insight =
    overdue > 0
      ? `Urgent: ${overdue} overdue assignment${overdue > 1 ? "s" : ""}. Clear these first.`
      : `${pending} assignment${pending !== 1 ? "s" : ""} pending. Plan them into focused time blocks.`;

  return (
    <>
      <PageHeader title="Assignments" description="Manage deadlines with status and priority tracking." insight={insight} />
      <ModuleShell
        summary="Break assignments into actionable tasks, keep due dates accurate, and clear overdue work first."
        checklist={["Log every assignment", "Set realistic due dates", "Close overdue items first"]}
        highlights={[
          { label: "Pending", value: String(pending) },
          { label: "Overdue", value: String(overdue) },
        ]}
      >
        <AssignmentsClient />
      </ModuleShell>
    </>
  );
}
