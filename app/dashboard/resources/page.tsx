import { PageHeader } from "@/components/dashboard/page-header";
import { ResourcesClient } from "@/src/components/dashboard/resources-client";

export default function ResourcesPage() {
  return (
    <>
      <PageHeader
        title="Resources"
        description="Organize resources with folders, tags, and search."
        insight="Build one folder per course and keep a 'Revision' folder for quick exam-week access."
      />
      <ResourcesClient />
    </>
  );
}
