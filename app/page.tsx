import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  BookOpen,
  CalendarCheck2,
  FolderOpen,
  FileUp,
  Globe,
  GraduationCap,
  Lock,
  Pencil,
  Presentation,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { PublicFooter } from "@/components/ui/public-footer";
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

const highlights = [
  { value: "One place", label: "Notes, files, exams, and planning under one roof" },
  { value: "Role-ready", label: "Student, teacher, and admin flows stay cleanly separated" },
  { value: "Share smart", label: "Public library support without losing private control" },
];

export default async function HomePage() {
  const session = await getSessionFromCookies();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <header className="sticky top-0 z-40 border-b border-[rgb(var(--border))]/80 bg-[rgb(var(--surface))]/75 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Logo size="md" showText href="/" />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/notes" className="px-3 py-2 text-sm font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]">
                Public Library
              </Link>
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
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-300/15 blur-3xl dark:bg-emerald-500/15" />
        <section className="px-4 pb-14 pt-16 sm:px-6 sm:pt-24 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div className="animate-fade-in">
              <div className="section-kicker">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                All-in-one academic workspace
              </div>
              <h1 className="mt-5 max-w-4xl text-balance text-4xl font-bold tracking-tight text-[rgb(var(--text-primary))] animate-slide-up sm:text-6xl">
                One place for notes, deadlines, and files. Zero chaos.
              </h1>
              <p className="mt-5 max-w-3xl text-base text-[rgb(var(--text-secondary))] animate-slide-up animate-stagger-1 sm:text-lg">
                StudyVault brings together everything students need — notes, planning, file uploads, and assignment tracking — in one fast, focused workspace.
              </p>
              <div className="mt-9 flex flex-col items-center justify-start gap-3 sm:flex-row sm:items-stretch animate-slide-up animate-stagger-2">
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
                  Explore Public Notes
                </Link>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {highlights.map((item) => (
                  <div key={item.value} className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))]/70 bg-[rgb(var(--surface))]/90 p-4 shadow-[var(--shadow-sm)] backdrop-blur">
                    <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{item.value}</p>
                    <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="hero-grid absolute inset-6 rounded-[28px] opacity-60" />
              <div className="relative overflow-hidden rounded-[32px] border border-[rgb(var(--border))]/75 bg-[rgb(var(--surface))]/88 p-5 shadow-[var(--shadow-xl)] backdrop-blur-2xl sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--text-tertiary))]">Today&apos;s command center</p>
                    <p className="mt-1 text-2xl font-semibold text-[rgb(var(--text-primary))]">Study flow at a glance</p>
                  </div>
                  <div className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-3 py-1 text-xs font-semibold text-[rgb(var(--text-secondary))]">
                    Dashboard preview
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[var(--radius-xl)] bg-gradient-to-br from-slate-950 via-sky-950 to-emerald-950 p-5 text-white shadow-[var(--shadow-lg)]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/70">Weekly focus</p>
                      <span className="text-sm font-semibold text-emerald-200">82%</span>
                    </div>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/15">
                      <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-emerald-400 to-green-300" />
                    </div>
                    <p className="mt-3 text-sm text-white/80">Strong momentum across notes, deadlines, and file organization.</p>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-[var(--radius-md)] bg-[rgb(var(--primary-soft))] p-2 text-[rgb(var(--primary))]">
                          <CalendarCheck2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Next deadline</p>
                          <p className="text-sm text-[rgb(var(--text-secondary))]">Physics assignment</p>
                          <p className="text-xs text-[rgb(var(--text-tertiary))]">Due in 2 days</p>
                        </div>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">2 days</span>
                      </div>
                    </div>
                    <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-[var(--radius-md)] bg-[rgb(var(--primary-soft))] p-2 text-[rgb(var(--primary))]">
                          <Globe className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Public library</p>
                          <p className="text-sm text-[rgb(var(--text-secondary))]">Share polished notes while keeping drafts private</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
                    <Users className="h-5 w-5 text-[rgb(var(--primary))]" />
                    <p className="mt-3 text-sm font-semibold text-[rgb(var(--text-primary))]">Multi-role access</p>
                    <p className="mt-1 text-xs text-[rgb(var(--text-secondary))]">Built for students, teachers, and admins.</p>
                  </div>
                  <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
                    <FileUp className="h-5 w-5 text-[rgb(var(--primary))]" />
                    <p className="mt-3 text-sm font-semibold text-[rgb(var(--text-primary))]">Clean uploads</p>
                    <p className="mt-1 text-xs text-[rgb(var(--text-secondary))]">Files and notes stay connected to your study flow.</p>
                  </div>
                  <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
                    <ShieldCheck className="h-5 w-5 text-[rgb(var(--primary))]" />
                    <p className="mt-3 text-sm font-semibold text-[rgb(var(--text-primary))]">Private by default</p>
                    <p className="mt-1 text-xs text-[rgb(var(--text-secondary))]">Sharing and moderation controls stay intact.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto mb-6 max-w-6xl space-y-3">
            <div className="grid w-full gap-3 md:grid-cols-2">
              <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/90 p-5 shadow-[var(--shadow-sm)] backdrop-blur">
                <div className="flex items-start gap-3">
                  <div className="rounded-[var(--radius-md)] bg-[rgb(var(--primary-soft))] p-2.5 text-[rgb(var(--primary))]">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">Students</p>
                    <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Use notes, files, planner, assignments, and exams in one dashboard.</p>
                    <Link href="/auth/signup" className="mt-4 inline-flex rounded-[var(--radius-md)] border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--text-primary))] hover:border-[rgb(var(--primary))]/50 hover:bg-[rgb(var(--surface-hover))]">
                      Create student account
                    </Link>
                  </div>
                </div>
              </div>
              <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/90 p-5 shadow-[var(--shadow-sm)] backdrop-blur">
                <div className="flex items-start gap-3">
                  <div className="rounded-[var(--radius-md)] bg-[rgb(var(--primary-soft))] p-2.5 text-[rgb(var(--primary))]">
                    <Presentation className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">Teachers</p>
                    <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Sign up with college ID and expertise, then review uploaded files after admin approval.</p>
                    <Link href="/auth/teacher/signup" className="mt-4 inline-flex rounded-[var(--radius-md)] border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--text-primary))] hover:border-[rgb(var(--primary))]/50 hover:bg-[rgb(var(--surface-hover))]">
                      Open teacher signup
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              Admin?{" "}
              <Link href="/auth/admin/login" className="font-semibold text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]">
                Sign in to the admin portal
              </Link>
            </p>
          </div>
          <div className="mx-auto mb-6 max-w-6xl">
            <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-gradient-to-br from-[rgb(var(--surface))] to-[rgb(var(--surface-hover))] p-6 shadow-[var(--shadow-md)] animate-slide-up">
              <h2 className="text-2xl font-semibold tracking-tight text-[rgb(var(--text-primary))]">Everything in one learning cockpit</h2>
              <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                Notes, deadlines, files, and analytics connected in one workflow so students can plan better and study with less friction.
              </p>
            </div>
          </div>
          <div className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-2 xl:grid-cols-4">
            {coreModules.map((item) => {
              const FeatureIcon =
                item.title === "Notes"
                  ? Pencil
                  : item.title === "Files"
                    ? FolderOpen
                    : item.title === "Planner"
                      ? Calendar
                      : Lock;
              return (
                <div
                  key={item.title}
                  className="group rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/92 p-6 shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgb(var(--primary))]/40 hover:shadow-[var(--shadow-lg)] animate-slide-up"
                >
                  <div className="mb-4 inline-flex rounded-[var(--radius-md)] bg-gradient-to-br from-[#0f172a] via-[#0f4c81] to-[#0b7a68] p-3 text-white shadow-[var(--shadow-sm)] transition-transform group-hover:scale-105">
                    <FeatureIcon className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">{item.title}</h2>
                  <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">{item.description}</p>
                  <Link href={item.href} className="mt-4 inline-flex text-sm font-semibold text-[rgb(var(--primary))] hover:text-[rgb(var(--primary-hover))]">
                    Open {item.title}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
