"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X, type LucideIcon } from "lucide-react";

type ToastVariant = "info" | "success" | "error";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  pushToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<
  ToastVariant,
  { icon: LucideIcon; className: string }
> = {
  info: {
    icon: Info,
    className: "border-[rgb(var(--color-primary)/0.15)] bg-[rgb(var(--color-primary-light))] text-[rgb(var(--color-primary))]",
  },
  success: {
    icon: CheckCircle2,
    className: "border-[rgb(var(--color-success)/0.15)] bg-[rgb(var(--color-success-light))] text-[rgb(var(--color-success))]",
  },
  error: {
    icon: AlertCircle,
    className: "border-[rgb(var(--color-danger)/0.15)] bg-[rgb(var(--color-danger-light))] text-[rgb(var(--color-danger))]",
  },
};

function createToastId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `toast_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const value = useMemo<ToastContextValue>(
    () => ({
      pushToast(message, variant = "info") {
        const id = createToastId();
        setToasts((prev) => [...prev, { id, message, variant }]);
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 2600);
      },
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2">
        {toasts.map((toast) => {
          const Icon = variantStyles[toast.variant].icon;

          return (
            <div
              key={toast.id}
              className={`animate-slide-up flex min-w-[240px] items-start gap-3 rounded-[var(--radius-lg)] border px-4 py-3 text-sm shadow-[var(--shadow-lg)] ${variantStyles[toast.variant].className}`}
              role="status"
              aria-live="polite"
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1 text-sm font-medium">{toast.message}</p>
              <button
                type="button"
                aria-label="Dismiss notification"
                className="icon-button h-8 w-8 shrink-0 text-current hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== toast.id))}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
