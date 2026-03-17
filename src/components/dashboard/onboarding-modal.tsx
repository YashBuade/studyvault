"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Modal } from "@/src/components/ui/modal";

const STORAGE_KEY = "studyvault-onboarding-v1";

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    const timer = window.setTimeout(() => {
      setOpen(!seen);
      setStep(0);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  const steps = [
    {
      kicker: "Step 1 of 3",
      title: "Create your first note",
      body: "Capture a quick summary, add a subject, and keep everything searchable.",
      cta: "Try it",
      href: "/dashboard/notes",
    },
    {
      kicker: "Step 2 of 3",
      title: "Upload a study file",
      body: "Drop PDFs, slides, and images so you can attach them to notes later.",
      cta: "Try it",
      href: "/dashboard/upload-center",
    },
    {
      kicker: "Step 3 of 3",
      title: "Track a deadline",
      body: "Add an assignment and let urgency labels help you prioritize.",
      cta: "Try it",
      href: "/dashboard/assignments",
    },
  ] as const;

  const current = steps[Math.max(0, Math.min(step, steps.length - 1))]!;
  const isFinal = step >= steps.length - 1;

  function goTo(href: string) {
    dismiss();
    router.push(href);
  }

  return (
    <Modal
      open={open}
      title="Welcome to StudyVault"
      description="Finish these quick steps to get comfortable with your dashboard."
      onClose={dismiss}
      cancelLabel="Skip"
      confirmLabel={isFinal ? "Get started \u2192" : current.cta}
      onConfirm={() => (isFinal ? dismiss() : goTo(current.href))}
    >
      <div key={step} className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--primary))]">{current.kicker}</p>
          <div className="flex items-center gap-2">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-2.5 w-2.5 rounded-full transition ${idx <= step ? "bg-[rgb(var(--primary))]" : "bg-[rgb(var(--surface-hover))]"}`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-base font-semibold text-[rgb(var(--text-primary))]">{current.title}</h4>
          <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">{current.body}</p>
        </div>

        {!isFinal ? (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="text-sm font-semibold text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))]"
              onClick={dismiss}
            >
              Skip onboarding
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[rgb(var(--primary))] hover:text-[rgb(var(--primary-hover))]"
              onClick={() => setStep((prev) => Math.min(prev + 1, steps.length - 1))}
            >
              Next step <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <p className="text-sm text-[rgb(var(--text-tertiary))]">You can always revisit these tools from the sidebar.</p>
        )}
      </div>
    </Modal>
  );
}

