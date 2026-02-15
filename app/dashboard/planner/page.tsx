import { PageHeader } from "@/components/dashboard/page-header";
import { PlannerClient } from "@/src/components/dashboard/planner-client";

export default function PlannerPage() {
  return (
    <>
      <PageHeader title="Planner" description="Customize categories, drag-and-drop priorities, and due dates." />
      <PlannerClient />
    </>
  );
}