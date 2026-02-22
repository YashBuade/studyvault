import { PublicNoteDetailClient } from "@/src/components/public/public-note-detail-client";

export default async function PublicNoteDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
      <PublicNoteDetailClient slug={slug} />
    </div>
  );
}
