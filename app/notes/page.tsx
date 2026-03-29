import { PublicFooter } from "@/components/ui/public-footer";
import { PublicNotesClient } from "@/src/components/public/public-notes-client";

export default function PublicNotesPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <PublicNotesClient />
      <PublicFooter />
    </div>
  );
}
