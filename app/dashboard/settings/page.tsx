import { Bell, Lock, MoonStar } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

const preferences = [
  { icon: Bell, title: "Notifications", description: "Assignment reminders and weekly digests are enabled." },
  { icon: Lock, title: "Security", description: "Your account uses secure HTTP-only session cookies." },
  { icon: MoonStar, title: "Theme", description: "Switch between polished light and dark workspace modes." },
] as const;

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Control workspace behavior, privacy, and preferences." />

      <section className="max-w-3xl space-y-3">
        {preferences.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-[var(--brand-soft)] p-2 text-[var(--brand)]">
                  <Icon size={18} />
                </div>
                <div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">{item.description}</p>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}