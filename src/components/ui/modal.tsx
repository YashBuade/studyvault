"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/src/components/ui/button";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  children?: React.ReactNode;
};

export function Modal({
  open,
  title,
  description,
  onClose,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark:bg-black/60" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-[var(--shadow-lg)] animate-fade-in dark:bg-[rgb(var(--surface-elevated))] dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))]">
        <div className="flex items-start justify-between gap-4 border-b border-[rgb(var(--border))] pb-3">
          <div>
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">{title}</h3>
          {description ? <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">{description}</p> : null}
          </div>
          <button type="button" aria-label="Close dialog" className="icon-button shrink-0" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          {onConfirm ? (
            <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
