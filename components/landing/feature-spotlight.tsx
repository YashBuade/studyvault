"use client";

import { useId, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarCheck2,
  FileUp,
  Globe,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

type SpotlightFeature = {
  key: string;
  shortTitle: string;
  title: string;
  description: string;
  bullets: string[];
  icon: LucideIcon;
  accentClassName: string;
};

const FEATURES: SpotlightFeature[] = [
  {
    key: "notes",
    shortTitle: "Notes",
    title: "Notes that stay organized",
    description: "Capture ideas fast, then structure them with tags, subjects, and search.",
    bullets: ["Tag by topic", "Keep drafts private", "Publish the polished version"],
    icon: BookOpen,
    accentClassName: "text-[rgb(var(--primary))]",
  },
  {
    key: "planner",
    shortTitle: "Planner",
    title: "Deadlines you won’t miss",
    description: "Track assignments and exams in one view with clear priorities.",
    bullets: ["Upcoming due dates", "Quick status updates", "Study sessions, simplified"],
    icon: CalendarCheck2,
    accentClassName: "text-emerald-600 dark:text-emerald-300",
  },
  {
    key: "files",
    shortTitle: "Files",
    title: "Files that connect to your work",
    description: "Upload PDFs and docs and keep them attached to the notes that matter.",
    bullets: ["Keep references nearby", "Reusable resources", "Clean, consistent library"],
    icon: FileUp,
    accentClassName: "text-sky-600 dark:text-sky-300",
  },
  {
    key: "library",
    shortTitle: "Library",
    title: "A public library with guardrails",
    description: "Share notes thoughtfully while keeping your workspace private by default.",
    bullets: ["Draft → publish workflow", "Separation of roles", "Moderation-friendly"],
    icon: Globe,
    accentClassName: "text-cyan-700 dark:text-cyan-300",
  },
];

function PreviewCard({ title, subtitle, meta }: { title: string; subtitle: string; meta: string }) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-[var(--shadow-xs)] dark:bg-[rgb(var(--surface-elevated))] dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">{title}</p>
          <p className="mt-1 text-xs text-[rgb(var(--text-secondary))]">{subtitle}</p>
        </div>
        <span className="rounded-full bg-[rgb(var(--surface-hover))] px-2.5 py-1 text-[11px] font-semibold text-[rgb(var(--text-secondary))]">
          {meta}
        </span>
      </div>
    </div>
  );
}

function FeaturePreview({ featureKey }: { featureKey: string }) {
  if (featureKey === "notes") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <PreviewCard title="Atomic Structure" subtitle="Tags: chemistry, exam-2" meta="Updated" />
        <PreviewCard title="Pointers in C" subtitle="Tags: programming, practice" meta="Pinned" />
        <div className="sm:col-span-2">
          <div className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] p-4 dark:bg-[rgb(var(--surface-2))]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--text-tertiary))]">
              Search
            </p>
            <div className="mt-2 h-10 rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-2 text-sm text-[rgb(var(--text-secondary))]">
              “photosynthesis”
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (featureKey === "planner") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <PreviewCard title="Physics assignment" subtitle="Due: in 2 days" meta="High" />
        <PreviewCard title="Discrete math quiz" subtitle="Due: next week" meta="Medium" />
        <div className="sm:col-span-2 rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 dark:bg-[rgb(var(--surface-elevated))]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">This week</p>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-[rgb(var(--text-secondary))]">
              <Sparkles className="h-4 w-4 text-[rgb(var(--primary))]" />
              Focus plan
            </span>
          </div>
          <div className="mt-3 grid gap-2">
            {["Review notes (45m)", "Solve past papers (30m)", "Upload references"].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-3 py-2 text-sm text-[rgb(var(--text-secondary))]"
              >
                <span>{item}</span>
                <span className="h-2 w-2 rounded-full bg-[rgb(var(--color-success))]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (featureKey === "files") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <PreviewCard title="Thermodynamics.pdf" subtitle="Linked to: Heat Engines notes" meta="PDF" />
        <PreviewCard title="Linear Algebra.docx" subtitle="Linked to: Vector spaces" meta="DOC" />
        <div className="sm:col-span-2 rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] p-4 dark:bg-[rgb(var(--surface-2))]">
          <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">Attach to note</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {["Unit 4 summary", "Exam cheat-sheet"].map((item) => (
              <div
                key={item}
                className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-sm text-[rgb(var(--text-secondary))]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <PreviewCard title="Photosynthesis - Chapter 3" subtitle="Visibility: Public" meta="Published" />
      <PreviewCard title="Operating Systems - Syllabus" subtitle="Visibility: Private" meta="Draft" />
      <div className="sm:col-span-2 rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 dark:bg-[rgb(var(--surface-elevated))]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--text-tertiary))]">
          Publishing checklist
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {["Title + tags", "Preview", "Submit"].map((item) => (
            <div
              key={item}
              className="rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-3 py-2 text-sm text-[rgb(var(--text-secondary))]"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FeatureSpotlight() {
  const tabsId = useId();
  const [activeKey, setActiveKey] = useState(FEATURES[0]?.key ?? "notes");

  const activeFeature = useMemo(
    () => FEATURES.find((feature) => feature.key === activeKey) ?? FEATURES[0],
    [activeKey],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
      <div className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.92)] p-4 shadow-[var(--shadow-sm)] backdrop-blur dark:bg-[rgb(var(--surface-elevated))]/80 dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))] sm:rounded-[32px] sm:p-6">
        <div className="sm:hidden">
          <label
            htmlFor={`${tabsId}-mobile`}
            className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--text-tertiary))]"
          >
            Pick a feature
          </label>
          <select
            id={`${tabsId}-mobile`}
            value={activeKey}
            onChange={(event) => setActiveKey(event.target.value)}
            className="mt-2 w-full rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-3 text-sm font-semibold text-[rgb(var(--text-primary))] shadow-[var(--shadow-xs)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary)/0.25)]"
          >
            {FEATURES.map((feature) => (
              <option key={feature.key} value={feature.key}>
                {feature.shortTitle}
              </option>
            ))}
          </select>
        </div>

        <div role="tablist" aria-label="StudyVault feature spotlight" className="hidden flex-wrap gap-2 sm:flex">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            const selected = feature.key === activeKey;
            return (
              <button
                key={feature.key}
                type="button"
                id={`${tabsId}-${feature.key}-tab`}
                role="tab"
                aria-controls={`${tabsId}-${feature.key}-panel`}
                aria-selected={selected}
                onClick={() => setActiveKey(feature.key)}
                className={[
                  "inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-full)] border px-3 py-2 text-sm font-semibold transition",
                  selected
                    ? "border-[rgb(var(--primary)/0.35)] bg-[rgb(var(--primary-light))]/25 text-[rgb(var(--text-primary))] shadow-[var(--shadow-xs)]"
                    : "border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-hover))]",
                ].join(" ")}
              >
                <Icon className={["h-4 w-4", feature.accentClassName].join(" ")} />
                <span>{feature.shortTitle}</span>
              </button>
            );
          })}
        </div>

        <div
          id={`${tabsId}-${activeFeature.key}-panel`}
          role="tabpanel"
          aria-labelledby={`${tabsId}-${activeFeature.key}-tab`}
          className="mt-5 sm:mt-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--text-tertiary))]">
            Spotlight
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[rgb(var(--text-primary))]">
            {activeFeature.title}
          </h3>
          <p className="mt-3 text-sm text-[rgb(var(--text-secondary))]">{activeFeature.description}</p>

          <ul className="mt-5 grid gap-2">
            {activeFeature.bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex items-start gap-2 rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-3 py-2 text-sm text-[rgb(var(--text-secondary))]"
              >
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[rgb(var(--primary))]" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[24px] border border-[rgb(var(--border)/0.75)] bg-[rgb(var(--surface)/0.9)] p-4 shadow-[var(--shadow-xl)] backdrop-blur-2xl dark:bg-[rgb(var(--surface-elevated))]/80 dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))] sm:rounded-[32px] sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[rgb(var(--primary)/0.10)] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-[rgb(var(--color-info)/0.12)] blur-3xl" />

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--text-tertiary))]">
              Preview
            </p>
            <p className="mt-1 text-lg font-semibold text-[rgb(var(--text-primary))]">
              A snapshot of the workflow
            </p>
          </div>
          <div className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] px-3 py-1 text-xs font-semibold text-[rgb(var(--text-secondary))]">
            Interactive
          </div>
        </div>

        <div className="mt-6">
          <FeaturePreview featureKey={activeFeature.key} />
        </div>
      </div>
    </div>
  );
}
