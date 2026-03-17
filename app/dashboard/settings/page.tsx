import Link from "next/link";
import { BookOpenCheck, CalendarCheck2, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Card } from "@/src/components/ui/card";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { SettingsClient } from "@/components/dashboard/settings-client";

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
                <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--primary))]">Appearance</p>
                <h2 className="mt-1 text-lg font-semibold text-[rgb(var(--text-primary))]">Theme</h2>
                <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                  Toggle between light and dark mode for better readability in different environments.
                </p>
              </div>
              <ThemeToggle />
            </div>
          </Card>

          <div className="md:col-span-2">
            <SettingsClient />
          </div>
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
