import Link from "next/link";
import { ArrowRight, BookOpen, CalendarCheck2, FileUp, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { getSessionFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";

const coreModules = [
  {
    icon: BookOpen,
    title: "Notes",
    description: "Create, organize, and search your study notes with tags and subjects.",
    href: "/dashboard/notes",
  },
  {
    icon: FileUp,
    title: "Files",
    description: "Upload and manage PDFs, docs, and reference files in one place.",
    href: "/dashboard/my-files",
  },
  {
    icon: CalendarCheck2,
    title: "Planner",
    description: "Track assignments and exams with deadlines and progress status.",
    href: "/dashboard/planner",
  },
  {
    icon: ShieldCheck,
    title: "Privacy",
    description: "Choose what is private and what is shared in your workspace.",
    href: "/dashboard/settings",
  },
];

export default async function HomePage() {
  const session = await getSessionFromCookies();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <header className="sticky top-0 z-40 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Logo size="md" showText href="/" />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/auth/admin/login" className="px-3 py-2 text-sm font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]">
              Admin Portal
              </Link>
              <Link href="/auth/teacher/login" className="px-3 py-2 text-sm font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]">
              Teacher Portal
              </Link>
            </div>
            <Link href="/auth/login" className="px-3 py-2 text-sm font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]">
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex h-10 items-center rounded-[var(--radius-md)] bg-[rgb(var(--primary))] px-4 text-sm font-semibold text-[rgb(var(--text-inverse))] shadow-[var(--shadow-sm)] transition hover:bg-[rgb(var(--primary-hover))] hover:text-[rgb(var(--text-inverse))] hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--surface))] sm:px-5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-28 top-12 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/20" />
        <div className="pointer-events-none absolute -right-24 top-40 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl dark:bg-indigo-500/20" />
        <section className="px-4 pb-14 pt-16 sm:px-6 sm:pt-24 lg:px-8">
          <div className="mx-auto max-w-5xl text-center animate-fade-in">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-[rgb(var(--text-primary))] sm:text-6xl animate-slide-up">
              A focused workspace for student learning
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base text-[rgb(var(--text-secondary))] animate-slide-up animate-stagger-1 sm:text-lg">
              StudyVault combines notes, files, assignments, exams, and planning tools so students can manage academic work in one system.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row animate-slide-up animate-stagger-2">
              <Link
                href="/auth/signup"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[rgb(var(--primary))] px-7 text-base font-semibold text-[rgb(var(--text-inverse))] shadow-[var(--shadow-sm)] transition hover:bg-[rgb(var(--primary-hover))] hover:text-[rgb(var(--text-inverse))] hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--surface))] sm:w-auto"
              >
                Create Account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/notes"
                className="inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] border border-[rgb(var(--border))] px-7 text-base font-semibold text-[rgb(var(--text-primary))] transition hover:bg-[rgb(var(--surface-hover))] sm:w-auto"
              >
                Open Public Notes
              </Link>
              <Link
                href="/auth/teacher/signup"
                className="inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] border border-emerald-400/70 bg-emerald-100/70 px-7 text-base font-semibold text-emerald-800 transition hover:bg-emerald-200/80 sm:w-auto"
              >
                Teacher Signup
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto mb-6 grid w-full max-w-6xl gap-3 md:grid-cols-3">
            <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[var(--shadow-sm)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">Students</p>
              <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Use notes, files, planner, assignments, and exams in one dashboard.</p>
              <Link href="/auth/signup" className="mt-3 inline-flex text-sm font-semibold">Create student account</Link>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[var(--shadow-sm)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">Teachers</p>
              <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Sign up with college ID and expertise, then review uploaded files after admin approval.</p>
              <Link href="/auth/teacher/signup" className="mt-3 inline-flex text-sm font-semibold">Open teacher signup</Link>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[var(--shadow-sm)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">Admins</p>
              <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Validate teachers, manage quality checks, and moderate reported public content.</p>
              <Link href="/auth/admin/login" className="mt-3 inline-flex text-sm font-semibold">Open admin portal</Link>
            </div>
          </div>
          <div className="mx-auto mb-6 max-w-6xl">
            <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-gradient-to-br from-[rgb(var(--surface))] to-[rgb(var(--surface-hover))] p-6 shadow-[var(--shadow-md)] animate-slide-up">
              <h2 className="text-2xl font-semibold tracking-tight text-[rgb(var(--text-primary))]">Everything in one learning cockpit</h2>
              <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                Notes, deadlines, files, and analytics connected in one workflow so students can plan better and study with less friction.
              </p>
            </div>
          </div>
          <div className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-2">
            {coreModules.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] animate-slide-up"
                >
                  <div className="mb-4 inline-flex rounded-[var(--radius-md)] bg-gradient-to-br from-[#1d4ed8] to-[#2563eb] p-3 text-white shadow-[var(--shadow-sm)] transition-transform group-hover:scale-105">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">{item.title}</h2>
                  <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">{item.description}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
