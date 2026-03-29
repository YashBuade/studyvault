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
import { PublicFooter } from "@/components/ui/public-footer";
import { PublicNavbar } from "@/components/ui/public-navbar";
import { FeatureSpotlight } from "@/components/landing/feature-spotlight";
import { AnimatedStats } from "@/components/landing/animated-stats";
import { FaqAccordion } from "@/components/landing/faq-accordion";
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
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text-primary))]">
      <PublicNavbar />

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-28 top-12 h-80 w-80 rounded-full bg-[rgb(var(--color-info)/0.12)] blur-3xl animate-float-slow" />
        <div className="pointer-events-none absolute -right-24 top-40 h-96 w-96 rounded-full bg-[rgb(var(--color-primary)/0.12)] blur-3xl animate-float-slow animate-stagger-2" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[rgb(var(--color-success)/0.1)] blur-3xl animate-float-slow animate-stagger-3" />
        <section className="px-4 pb-12 pt-14 sm:px-6 sm:pb-14 sm:pt-24 lg:px-8">
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
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[rgb(var(--primary))] px-7 text-base font-semibold text-[rgb(var(--text-inverse))] shadow-[var(--shadow-sm)] transition hover:bg-[rgb(var(--primary-hover))] hover:text-[rgb(var(--text-inverse))] hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary)/0.4)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--surface))] sm:w-auto"
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
                  <div key={item.value} className="rounded-[var(--radius-lg)] border border-[rgb(var(--border)/0.7)] bg-[rgb(var(--surface)/0.9)] p-4 shadow-[var(--shadow-sm)] backdrop-blur dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--surface-elevated))]/80 dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))]">
                    <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{item.value}</p>
                    <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="hero-grid absolute inset-6 rounded-[28px] opacity-60" />
              <div className="relative overflow-hidden rounded-[32px] border border-[rgb(var(--border)/0.75)] bg-[rgb(var(--surface)/0.88)] p-5 shadow-[var(--shadow-xl)] backdrop-blur-2xl dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--surface-elevated))]/80 dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))] sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--text-tertiary))]">Today&apos;s command center</p>
                    <p className="mt-1 text-2xl font-semibold text-[rgb(var(--text-primary))]">Study flow at a glance</p>
                  </div>
                  <div className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-3 py-1 text-xs font-semibold text-[rgb(var(--text-secondary))] dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--surface-elevated))] dark:text-[rgb(var(--text-secondary))]">
                    Dashboard preview
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[var(--radius-xl)] bg-[linear-gradient(135deg,rgb(var(--primary-hover))_0%,rgb(var(--primary))_58%,rgb(var(--accent))_100%)] p-5 text-white shadow-[var(--shadow-lg)]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">Weekly focus</p>
                      <span className="inline-flex items-center rounded-full border border-white/20 bg-white/12 px-2.5 py-1 text-xs font-semibold tabular-nums text-white">
                        82%
                      </span>
                    </div>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/20">
                      <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-emerald-300 via-lime-200 to-cyan-200" />
                    </div>
                    <p className="mt-3 text-sm text-white/90">Strong momentum across notes, deadlines, and file organization.</p>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] p-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--surface-elevated))]">
                      <div className="flex items-center gap-3">
                        <div className="rounded-[var(--radius-md)] bg-[rgb(var(--primary-soft))] p-2 text-[rgb(var(--primary))]">
                          <CalendarCheck2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Next deadline</p>
                          <p className="text-sm text-[rgb(var(--text-secondary))]">Physics assignment</p>
                          <p className="text-xs text-[rgb(var(--text-tertiary))]">Due in 2 days</p>
                        </div>
                        <span className="rounded-full bg-[rgb(var(--color-warning-light))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--color-warning))]">2 days</span>
                      </div>
                    </div>
                    <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] p-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--surface-elevated))]">
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
                  <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--surface-elevated))]">
                    <Users className="h-5 w-5 text-[rgb(var(--primary))]" />
                    <p className="mt-3 text-sm font-semibold text-[rgb(var(--text-primary))]">Multi-role access</p>
                    <p className="mt-1 text-xs text-[rgb(var(--text-secondary))]">Built for students, teachers, and admins.</p>
                  </div>
                  <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--surface-elevated))]">
                    <FileUp className="h-5 w-5 text-[rgb(var(--primary))]" />
                    <p className="mt-3 text-sm font-semibold text-[rgb(var(--text-primary))]">Clean uploads</p>
                    <p className="mt-1 text-xs text-[rgb(var(--text-secondary))]">Files and notes stay connected to your study flow.</p>
                  </div>
                  <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--surface-elevated))]">
                    <ShieldCheck className="h-5 w-5 text-[rgb(var(--primary))]" />
                    <p className="mt-3 text-sm font-semibold text-[rgb(var(--text-primary))]">Private by default</p>
                    <p className="mt-1 text-xs text-[rgb(var(--text-secondary))]">Sharing and moderation controls stay intact.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="mx-auto mb-6 max-w-6xl space-y-3">
            <div className="grid w-full gap-3 md:grid-cols-2">
              <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.9)] p-5 shadow-[var(--shadow-sm)] backdrop-blur dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--surface-elevated))]/80 dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))]">
                <div className="flex items-start gap-3">
                  <div className="rounded-[var(--radius-md)] bg-[rgb(var(--primary-soft))] p-2.5 text-[rgb(var(--primary))]">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">Students</p>
                    <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Use notes, files, planner, assignments, and exams in one dashboard.</p>
                    <Link href="/auth/signup" className="mt-4 inline-flex rounded-[var(--radius-md)] border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--text-primary))] hover:border-[rgb(var(--primary)/0.5)] hover:bg-[rgb(var(--surface-hover))]">
                      Create student account
                    </Link>
                  </div>
                </div>
              </div>
              <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.9)] p-5 shadow-[var(--shadow-sm)] backdrop-blur dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--surface-elevated))]/80 dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))]">
                <div className="flex items-start gap-3">
                  <div className="rounded-[var(--radius-md)] bg-[rgb(var(--primary-soft))] p-2.5 text-[rgb(var(--primary))]">
                    <Presentation className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">Teachers</p>
                    <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">Sign up with college ID and expertise, then review uploaded files after admin approval.</p>
                    <Link href="/auth/teacher/signup" className="mt-4 inline-flex rounded-[var(--radius-md)] border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--text-primary))] hover:border-[rgb(var(--primary)/0.5)] hover:bg-[rgb(var(--surface-hover))]">
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
            <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-gradient-to-br from-[rgb(var(--surface))] to-[rgb(var(--surface-hover))] p-6 shadow-[var(--shadow-md)] animate-slide-up dark:border-[rgb(var(--border))] dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))]">
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
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.92)] p-6 shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgb(var(--primary)/0.4)] hover:shadow-[var(--shadow-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary)/0.35)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))] animate-slide-up dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--surface-elevated))]/80 dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))]"
                >
                  <div className="mb-4 inline-flex rounded-[var(--radius-md)] bg-[linear-gradient(135deg,rgb(var(--color-text-primary))_0%,rgb(var(--color-primary))_52%,rgb(var(--color-accent))_100%)] p-3 text-white shadow-[var(--shadow-sm)] transition-transform group-hover:scale-105">
                    <FeatureIcon className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">{item.title}</h2>
                  <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">{item.description}</p>
                  <span className="mt-4 inline-flex text-sm font-semibold text-[rgb(var(--primary))] group-hover:text-[rgb(var(--primary-hover))]">
                    Open {item.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section id="spotlight" className="scroll-mt-24 px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 max-w-3xl">
              <div className="section-kicker">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Interactive spotlight
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[rgb(var(--text-primary))] sm:text-4xl">
                See the workflow before you sign up
              </h2>
              <p className="mt-3 text-sm text-[rgb(var(--text-secondary))] sm:text-base">
                Tap through the core flows to preview how notes, planning, files, and public sharing connect in one place.
              </p>
            </div>

            <FeatureSpotlight />
          </div>
        </section>

        <section id="stats" className="scroll-mt-24 px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 grid gap-5 lg:grid-cols-2 lg:items-end">
              <div>
                <div className="section-kicker">
                  <Users className="mr-2 h-3.5 w-3.5" />
                  Designed for teams
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[rgb(var(--text-primary))] sm:text-4xl">
                  Built for students, teachers, and admins
                </h2>
                <p className="mt-3 text-sm text-[rgb(var(--text-secondary))] sm:text-base">
                  Clear role boundaries keep the experience clean while enabling sharing, review, and moderation.
                </p>
              </div>
              <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.92)] p-5 shadow-[var(--shadow-sm)] backdrop-blur dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--surface-elevated))]/80 dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))]">
                <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Responsive by default</p>
                <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                  Touch-friendly layouts, readable typography, and motion that respects accessibility settings.
                </p>
              </div>
            </div>

            <AnimatedStats
              items={[
                { label: "Core modules", value: coreModules.length, description: "Notes, files, planner, and privacy" },
                { label: "Roles supported", value: 3, description: "Student, teacher, and admin flows" },
                { label: "Public-first feature", value: 1, description: "Share notes without losing control" },
                { label: "On-ramp options", value: 2, description: "Sign up or explore public notes" },
              ]}
            />
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-start">
            <div>
              <div className="section-kicker">
                <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                FAQ
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[rgb(var(--text-primary))] sm:text-4xl">
                Quick answers
              </h2>
              <p className="mt-3 text-sm text-[rgb(var(--text-secondary))] sm:text-base">
                Everything you need to know before getting started.
              </p>
              <div className="mt-6 rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-gradient-to-br from-[rgb(var(--surface))] to-[rgb(var(--surface-hover))] p-5 shadow-[var(--shadow-md)] dark:border-[rgb(var(--border))] dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))]">
                <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Ready to try it?</p>
                <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                  Create a student account and jump straight into the dashboard.
                </p>
                <Link
                  href="/auth/signup"
                  className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[rgb(var(--primary))] px-5 text-sm font-semibold text-[rgb(var(--text-inverse))] shadow-[var(--shadow-sm)] hover:bg-[rgb(var(--primary-hover))] hover:text-[rgb(var(--text-inverse))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary)/0.4)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--surface))]"
                >
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <FaqAccordion />
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-[32px] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.92)] p-8 shadow-[var(--shadow-xl)] backdrop-blur dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--surface-elevated))]/80 dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))] sm:p-10">
              <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[rgb(var(--primary)/0.12)] blur-3xl" />
              <div className="pointer-events-none absolute -bottom-28 -right-16 h-72 w-72 rounded-full bg-[rgb(var(--color-success)/0.12)] blur-3xl" />
              <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-[rgb(var(--text-primary))] sm:text-4xl">
                    Make your next study session smoother
                  </h2>
                  <p className="mt-3 text-sm text-[rgb(var(--text-secondary))] sm:text-base">
                    Bring notes, deadlines, and files together. Keep what’s private private — and share only what you choose.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Link
                    href="/auth/signup"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[rgb(var(--primary))] px-7 text-base font-semibold text-[rgb(var(--text-inverse))] shadow-[var(--shadow-sm)] hover:bg-[rgb(var(--primary-hover))] hover:text-[rgb(var(--text-inverse))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary)/0.4)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--surface))] sm:w-auto lg:w-full"
                  >
                    Create Account <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/auth/teacher/login"
                    className="inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-7 text-base font-semibold text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-hover))] sm:w-auto lg:w-full"
                  >
                    Teacher portal
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
