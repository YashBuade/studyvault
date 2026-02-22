import { SharedNoteClient } from "@/src/components/public/shared-note-client";

export default async function SharedNotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
      <SharedNoteClient token={token} />
    </div>
  );
}
