import { PublicProfileClient } from "@/src/components/public/public-profile-client";

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <PublicProfileClient userId={id} />
    </div>
  );
}
