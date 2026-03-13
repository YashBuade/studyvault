import { PageHeader } from "@/components/dashboard/page-header";
import { PublicFooter } from "@/components/ui/public-footer";
import { PublicNotesClient } from "@/src/components/public/public-notes-client";

export default function PublicNotesPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        <PageHeader
          title="Public Notes Library"
          description="Explore globally shared notes and discover useful study material."
        />
        <PublicNotesClient />
      </div>
      <PublicFooter />
    </div>
  );
}
