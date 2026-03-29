"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

type FaqItem = {
  question: string;
  answer: string;
};

const DEFAULT_FAQ: FaqItem[] = [
  {
    question: "Is StudyVault free to use?",
    answer:
      "You can start with a student account and explore the public notes library without friction. Pricing and access tiers depend on your institution’s setup.",
  },
  {
    question: "Can I keep my notes private?",
    answer:
      "Yes. Your workspace is private by default. You decide what gets published to the public library.",
  },
  {
    question: "How do teachers access uploads?",
    answer:
      "Teachers sign up with their college ID and expertise, then review uploaded files after admin approval.",
  },
  {
    question: "Does it work well on mobile?",
    answer:
      "Yes. The landing experience and dashboard flows are designed to stay fast, touch-friendly, and readable on small screens.",
  },
];

export function FaqAccordion({ items }: { items?: FaqItem[] }) {
  const list = useMemo(() => items ?? DEFAULT_FAQ, [items]);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="grid gap-3">
      {list.map((item, index) => {
        const open = openIndex === index;
        return (
          <div
            key={item.question}
            className="rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.92)] shadow-[var(--shadow-sm)] backdrop-blur dark:bg-[rgb(var(--surface-elevated))]/80 dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))]"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : index)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                {item.question}
              </span>
              <ChevronDown
                className={[
                  "h-5 w-5 shrink-0 text-[rgb(var(--text-tertiary))] transition-transform duration-200",
                  open ? "rotate-180" : "rotate-0",
                ].join(" ")}
              />
            </button>
            <div
              className={[
                "grid transition-[grid-template-rows] duration-300 ease-out",
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              ].join(" ")}
            >
              <div className="overflow-hidden px-5 pb-4">
                <p className="text-sm text-[rgb(var(--text-secondary))]">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
