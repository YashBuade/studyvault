"use client";

import { CheckCircle2, Users, Shield, Zap } from "lucide-react";

export function TrustSignals() {
  const signals = [
    {
      icon: Shield,
      title: "Private by default",
      description: "Choose what stays private and what gets shared publicly.",
    },
    {
      icon: Users,
      title: "Built for classmates",
      description: "Public notes are meant to be useful, not crowded with fluff.",
    },
    {
      icon: Zap,
      title: "Fast workspace",
      description: "Notes, files, and tasks stay in one focused flow.",
    },
    {
      icon: CheckCircle2,
      title: "Student project",
      description: "StudyVault is a college-built project, not a commercial app.",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
      {signals.map((signal, i) => {
        const Icon = signal.icon;
        return (
          <div
            key={i}
            className="flex items-start gap-3 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-2))] p-3 transition-colors hover:border-[rgb(var(--color-info))]/35"
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[rgb(var(--color-info))]" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">{signal.title}</p>
              <p className="mt-1 text-xs text-[rgb(var(--color-text-secondary))]">{signal.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
