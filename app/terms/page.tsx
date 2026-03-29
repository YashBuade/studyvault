import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PublicNavbar } from "@/components/ui/public-navbar";
import { PublicFooter } from "@/components/ui/public-footer";

export const metadata: Metadata = {
  title: "Terms of Service — StudyVault",
  description: "Terms of Service for StudyVault, a student-built workspace for notes, files, assignments, and planning.",
};

const sections = [
  {
    title: "Acceptance",
    body: "By using StudyVault, you agree to these terms and to use the app responsibly.",
  },
  {
    title: "Use of Service",
    body: "StudyVault is intended as a student workspace for organizing notes, files, assignments, exams, and planning tasks.",
  },
  {
    title: "Account Responsibilities",
    body: "You are responsible for the accuracy of the information you enter and for keeping your sign-in details private.",
  },
  {
    title: "Content You Upload",
    body: "You keep responsibility for the notes, files, and other content you upload. Please avoid uploading anything you do not have the right to use or share.",
  },
  {
    title: "Prohibited Use",
    body: "Do not use the service to upload harmful, abusive, illegal, or misleading content, or to interfere with the normal operation of the app.",
  },
  {
    title: "Disclaimers",
    body: "This is a student-built project. Use it at your own discretion. The app is provided as-is and may change, break, or be unavailable at times.",
  },
  {
    title: "Changes to Terms",
    body: "These terms may be updated as the project evolves. Continued use of the app after changes means you accept the updated terms.",
  },
] as const;

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text-primary))]">
      <PublicNavbar />
      <main className="page-shell py-12 sm:py-16">
        <div className="content-shell">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>

          <article className="mt-6 rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 shadow-[var(--shadow-sm)] dark:bg-[rgb(var(--surface-elevated))] dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))] sm:p-8">
            <p className="section-kicker">Terms</p>
            <h1 className="mt-4">Terms of Service</h1>
            <p className="mt-5 text-base text-[rgb(var(--text-secondary))]">
              This is a student-built project. Use it at your own discretion.
            </p>

            <div className="mt-8 space-y-8">
              {sections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">{section.title}</h2>
                  <p className="mt-3 text-[rgb(var(--text-secondary))]">{section.body}</p>
                </section>
              ))}
            </div>
          </article>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
