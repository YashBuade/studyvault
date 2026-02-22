"use client";

import { useEffect, useRef, useState } from "react";
import { isGoogleClientIdConfigured } from "@/lib/google-auth-config";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            ux_mode?: "popup" | "redirect";
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_black" | "filled_blue";
              size?: "small" | "medium" | "large";
              text?: "signin_with" | "signup_with" | "continue_with";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: string | number;
            }
          ) => void;
        };
      };
    };
  }
}

type GoogleOAuthButtonProps = {
  mode: "signin" | "signup";
  onCredential: (token: string) => Promise<void>;
  onError: (message: string) => void;
};

const GOOGLE_SCRIPT_ID = "studyvault-google-gsi";

function ensureGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Google Sign-In is only available in browser."));
      return;
    }

    const existing = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Sign-In.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Sign-In."));
    document.head.appendChild(script);
  });
}

export function GoogleOAuthButton({ mode, onCredential, onError }: GoogleOAuthButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!isGoogleClientIdConfigured(clientId)) {
      onError("Google OAuth is not configured.");
      return;
    }

    let active = true;

    ensureGoogleScript()
      .then(() => {
        if (!active || !containerRef.current || !window.google?.accounts?.id) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: "popup",
          callback: async (response) => {
            if (!response.credential) {
              onError("Google returned an invalid credential.");
              return;
            }
            await onCredential(response.credential);
          },
        });

        containerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: document.documentElement.classList.contains("dark") ? "filled_black" : "outline",
          size: "large",
          text: mode === "signup" ? "signup_with" : "signin_with",
          shape: "pill",
          logo_alignment: "left",
          width: "360",
        });
        setReady(true);
      })
      .catch((error) => {
        onError(error instanceof Error ? error.message : "Google Sign-In could not be initialized.");
      });

    return () => {
      active = false;
    };
  }, [mode, onCredential, onError]);

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="min-h-[44px] w-full overflow-hidden rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))]"
      />
      {!ready && <div className="mt-2 h-2 w-full animate-pulse rounded-full bg-[rgb(var(--surface-hover))]" />}
    </div>
  );
}
