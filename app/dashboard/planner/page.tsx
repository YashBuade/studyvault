import { PageHeader } from "@/components/dashboard/page-header";
import { PlannerClient } from "@/src/components/dashboard/planner-client";
import { getCurrentUserId } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getPlannerPrompt } from "@/lib/student-insights";
import { ModuleShell } from "@/components/dashboard/module-shell";

export default async function PlannerPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login");

  const [todoCount, inProgressCount, doneCount] = await Promise.all([
    prisma.plannerItem.count({ where: { userId, status: "TODO" } }),
    prisma.plannerItem.count({ where: { userId, status: "IN_PROGRESS" } }),
    prisma.plannerItem.count({ where: { userId, status: "DONE" } }),
  ]);

  const insight = getPlannerPrompt(todoCount, inProgressCount, doneCount);

  return (
    <>
      <PageHeader title="Planner" description="Customize categories, drag-and-drop priorities, and due dates." insight={insight} />
      <ModuleShell
        summary="Use planner as your execution board: move tasks daily from TODO to IN PROGRESS to DONE."
        checklist={["Create weekly plan", "Move active tasks to in progress", "Finish with end-of-day cleanup"]}
        highlights={[
          { label: "TODO", value: String(todoCount) },
          { label: "In Progress", value: String(inProgressCount) },
          { label: "Done", value: String(doneCount) },
        ]}
      >
        <PlannerClient />
      </ModuleShell>
    </>
  );
}
