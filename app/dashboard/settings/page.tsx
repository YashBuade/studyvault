import Link from "next/link";
import { Bell, BookOpenCheck, CalendarCheck2, Lock, MoonStar, ShieldCheck, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Card } from "@/src/components/ui/card";
import { ModuleShell } from "@/components/dashboard/module-shell";

const preferences = [
  { icon: Bell, title: "Notifications", description: "Weekly digests and deadline reminders are active." },
  { icon: Lock, title: "Security", description: "HTTP-only session cookies keep your account secure." },
  { icon: ShieldCheck, title: "Privacy", description: "Control public sharing defaults for notes and files." },
  { icon: MoonStar, title: "Theme", description: "Switch between light and dark workspace modes instantly." },
] as const;

const productivityModules = [
  {
    icon: BookOpenCheck,
    title: "Structured Note Hub",
    description: "Capture class notes, enrich with tags, and keep revision-ready summaries.",
    href: "/dashboard/notes",
    cta: "Open Notes",
  },
  {
    icon: CalendarCheck2,
    title: "Deadlines and Planner",
    description: "Track assignments and exam dates from one timeline.",
    href: "/dashboard/planner",
    cta: "Open Planner",
  },
  {
    icon: Sparkles,
    title: "Focus Workspace",
    description: "Use analytics and task states to prioritize what to study next.",
    href: "/dashboard/analytics",
    cta: "Open Analytics",
  },
] as const;

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Control workspace behavior, visual preferences, and privacy defaults."
        insight="Set the right theme and workflow defaults once, then keep your daily study sessions friction-free."
      />
      <ModuleShell
        summary="Use settings once to align your workspace, then focus on study execution with fewer distractions."
        checklist={["Set preferred theme", "Review security/privacy defaults", "Use quick links to core modules"]}
      >
      <section className="grid max-w-5xl gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Theme Controls</h2>
              <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                Toggle between light and dark mode for better readability in different environments.
              </p>
            </div>
            <ThemeToggle />
          </div>
        </Card>

        {preferences.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="flex items-start gap-3">
              <div className="rounded-xl bg-[rgb(var(--primary-soft))] p-2 text-[rgb(var(--primary))]">
                <Icon size={18} />
              </div>
              <div>
                <h2 className="font-semibold text-[rgb(var(--text-primary))]">{item.title}</h2>
                <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">{item.description}</p>
              </div>
            </Card>
          );
        })}
      </section>

      <section className="mt-6 grid max-w-5xl gap-4 md:grid-cols-3">
        {productivityModules.map((module) => {
          const Icon = module.icon;
          return (
            <Card key={module.title} className="flex h-full flex-col justify-between gap-3">
              <div>
                <div className="inline-flex rounded-lg bg-[rgb(var(--primary-soft))] p-2 text-[rgb(var(--primary))]">
                  <Icon size={18} />
                </div>
                <h3 className="mt-3 text-base font-semibold text-[rgb(var(--text-primary))]">{module.title}</h3>
                <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">{module.description}</p>
              </div>
              <Link
                href={module.href}
                className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[rgb(var(--border))] px-4 text-sm font-semibold text-[rgb(var(--text-primary))] transition-all hover:bg-[rgb(var(--surface-hover))] hover:shadow-[var(--shadow-sm)]"
              >
                {module.cta}
              </Link>
            </Card>
          );
        })}
      </section>
      </ModuleShell>
    </>
  );
}
