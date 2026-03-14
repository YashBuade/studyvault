import { PageHeader } from "@/components/dashboard/page-header";
import { PublicFooter } from "@/components/ui/public-footer";
import { PublicNavbar } from "@/components/ui/public-navbar";
import { PublicNotesClient } from "@/src/components/public/public-notes-client";

export default function PublicNotesPage() {
  return (
    <div className="min-h-screen">
      <PublicNavbar />
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <PageHeader
          title="Public Notes Library"
          description="Explore polished student notes, verified academic uploads, and fast filters designed for real study sessions."
        />
        <PublicNotesClient />
      </div>
      <PublicFooter />
    </div>
  );
}
