"use client";

import { useState } from "react";
import { Modal } from "@/src/components/ui/modal";

const STORAGE_KEY = "studyvault-onboarding-v1";

export function OnboardingModal() {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return !localStorage.getItem(STORAGE_KEY);
  });

  return (
    <Modal
      open={open}
      title="Welcome to StudyVault"
      description="Use Notes to capture ideas, Upload Center for files, and Trash to restore deleted work."
      onClose={() => {
        localStorage.setItem(STORAGE_KEY, "true");
        setOpen(false);
      }}
      confirmLabel="Start"
      onConfirm={() => {
        localStorage.setItem(STORAGE_KEY, "true");
        setOpen(false);
      }}
    />
  );
}
