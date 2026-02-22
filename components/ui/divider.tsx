"use client";

export function Divider({ text }: { text?: string }) {
  if (!text) {
    return <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent my-6" />;
  }

  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-3 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 font-medium">{text}</span>
      </div>
    </div>
  );
}
