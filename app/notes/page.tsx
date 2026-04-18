import { PublicFooter } from "@/components/ui/public-footer";
import { PublicNotesClient } from "@/src/components/public/public-notes-client";

export default function PublicNotesPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-28 top-20 h-80 w-80 rounded-full bg-[rgb(var(--color-primary-light)/0.7)] blur-3xl animate-float-slow" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[rgb(var(--color-info-light)/0.75)] blur-3xl animate-float-slow animate-stagger-2" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[rgb(var(--color-success-light)/0.6)] blur-3xl animate-float-slow animate-stagger-3" />
        <div className="hero-grid absolute inset-0 opacity-20 animate-grid-drift" />
      </div>

      <PublicNotesClient />
      <PublicFooter />
    </div>
  );
}
