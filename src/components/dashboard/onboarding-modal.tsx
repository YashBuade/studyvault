"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/src/components/ui/modal";

const STORAGE_KEY = "studyvault-onboarding-v1";

export function OnboardingModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    const timer = window.setTimeout(() => {
      setOpen(!seen);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  return (
    <Modal
      open={open}
      title="Welcome to StudyVault"
      description="Use Notes to capture ideas, Upload Center for files, and Trash to restore deleted work."
      onClose={dismiss}
      confirmLabel="Start"
      onConfirm={dismiss}
    />
  );
}
