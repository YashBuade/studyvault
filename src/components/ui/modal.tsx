"use client";

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
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[rgb(var(--border))]/80 bg-[rgb(var(--surface))] p-5 shadow-[var(--shadow-xl)] animate-page-in">
        <div className="border-b border-[rgb(var(--border))]/70 pb-3">
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">{title}</h3>
          {description ? <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">{description}</p> : null}
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
