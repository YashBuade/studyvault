import { PageHeader } from "@/components/dashboard/page-header";
import { ExamsClient } from "@/src/components/dashboard/exams-client";

export default function ExamsPage() {
  return (
    <>
      <PageHeader title="Exams" description="Track upcoming exams with urgency indicators." />
      <ExamsClient />
    </>
  );
}