"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { ModernButton } from "@/components/ui/modern-button";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function logout() {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoading(false);
    }
  }

  return (
    <ModernButton
      type="button"
      variant="outline"
      size="sm"
      onClick={logout}
      isLoading={isLoading}
      className="flex items-center gap-2"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Logout</span>
    </ModernButton>
  );
}
