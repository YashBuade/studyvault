"use client";

type Tab = { id: string; label: string };

type TabsProps = {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
};

export function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            value === tab.id
              ? "bg-[var(--brand)] text-white shadow-[var(--shadow)]"
              : "border border-[var(--border)] bg-[var(--panel)] text-[var(--muted)] hover:bg-[var(--surface)]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
