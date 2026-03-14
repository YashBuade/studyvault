"use client";

export function Divider({ text }: { text?: string }) {
  if (!text) {
    return (
      <div className="my-6 h-px bg-gradient-to-r from-transparent via-[rgb(var(--color-border-strong))] to-transparent" />
    );
  }

  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[rgb(var(--color-border-strong))] to-transparent"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-[rgb(var(--color-surface))] px-3 font-medium text-[rgb(var(--color-text-secondary))]">
          {text}
        </span>
      </div>
    </div>
  );
}
