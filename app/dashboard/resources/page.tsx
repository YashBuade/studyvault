import { PageHeader } from "@/components/dashboard/page-header";
import { ResourcesClient } from "@/src/components/dashboard/resources-client";
import { ModuleShell } from "@/components/dashboard/module-shell";

export default function ResourcesPage() {
  return (
    <>
      <PageHeader
        title="Resources"
        description="Organize resources with folders, tags, and search."
        insight="Build one folder per course and keep a 'Revision' folder for quick exam-week access."
      />
      <ModuleShell
        summary="Keep links and reference content organized by folder so revision stays fast during busy weeks."
        checklist={["Create folders per subject", "Tag each resource", "Update stale links weekly"]}
      >
        <ResourcesClient />
      </ModuleShell>
    </>
  );
}
