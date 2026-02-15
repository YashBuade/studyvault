import { PageHeader } from "@/components/dashboard/page-header";
import { ResourcesClient } from "@/src/components/dashboard/resources-client";

export default function ResourcesPage() {
  return (
    <>
      <PageHeader title="Resources" description="Organize resources with folders, tags, and search." />
      <ResourcesClient />
    </>
  );
}