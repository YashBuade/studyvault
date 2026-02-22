"use client";

import { CheckCircle2, Users, Shield, Zap } from "lucide-react";

export function TrustSignals() {
  const signals = [
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is encrypted and stored securely",
    },
    {
      icon: Users,
      title: "Trusted by 10K+ Students",
      description: "Join thousands of students already using StudyVault",
    },
    {
      icon: Zap,
      title: "Always Available",
      description: "Access your notes and files anytime, anywhere",
    },
    {
      icon: CheckCircle2,
      title: "100% Free",
      description: "No hidden fees or premium walls",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
      {signals.map((signal, i) => {
        const Icon = signal.icon;
        return (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
          >
            <Icon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{signal.title}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{signal.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
