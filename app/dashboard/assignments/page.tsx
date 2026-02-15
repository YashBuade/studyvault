import { PageHeader } from "@/components/dashboard/page-header";
import { AssignmentsClient } from "@/src/components/dashboard/assignments-client";

export default function AssignmentsPage() {
  return (
    <>
      <PageHeader title="Assignments" description="Manage deadlines with status and priority tracking." />
      <AssignmentsClient />
    </>
  );
}