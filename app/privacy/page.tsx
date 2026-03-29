import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PublicNavbar } from "@/components/ui/public-navbar";
import { PublicFooter } from "@/components/ui/public-footer";

export const metadata: Metadata = {
  title: "Privacy Policy — StudyVault",
  description: "Privacy Policy for StudyVault, a student-built workspace for notes, files, assignments, and planning.",
};

const sections = [
  {
    title: "What We Collect",
    body: "We collect the information needed to run the app, including your email address, account details, notes, uploaded files, and basic usage activity inside the workspace.",
  },
  {
    title: "How We Use It",
    body: "Your data is used to sign you in, store your notes and files, show your planner, assignments, and exams, and support features like sharing public notes when you choose to enable that.",
  },
  {
    title: "How It Is Stored",
    body: "StudyVault stores your account and workspace data in the project database and file storage connected to the app. Reasonable steps are taken to protect access, but no online service can promise perfect security.",
  },
  {
    title: "Your Rights",
    body: "You can request deletion of your account and the data connected to it. If you no longer want to use the project, contact us and ask for your account to be removed.",
  },
  {
    title: "Contact",
    body: "For privacy-related questions, use the contact method shared with this project or reach out through the repository or project owner if that is how you received access.",
  },
] as const;

export default function PrivacyPage() {
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
            <p className="section-kicker">Privacy</p>
            <h1 className="mt-4">Privacy Policy</h1>
            <p className="mt-3 text-sm text-[rgb(var(--text-tertiary))]">Last updated: March 14, 2026</p>
            <p className="mt-5 text-base text-[rgb(var(--text-secondary))]">
              StudyVault is a college project, not a commercial product. Your data is used only to provide the service.
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
