"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const ModernButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      icon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold transition-all duration-[var(--transition-base)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--surface))] motion-safe:hover:-translate-y-0.5 dark:focus-visible:ring-offset-[rgb(var(--background))]";

    const variants = {
      primary:
        "bg-[rgb(var(--primary))] text-[rgb(var(--text-inverse))] shadow-[var(--shadow-sm)] hover:bg-[rgb(var(--primary-hover))] hover:text-[rgb(var(--text-inverse))] hover:shadow-[var(--shadow-md)] focus-visible:ring-[rgb(var(--primary)/0.40)] dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))]",
      secondary:
        "border border-[rgb(var(--border))] bg-[rgb(var(--surface-hover))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-active))] hover:text-[rgb(var(--text-primary))] hover:border-[rgb(var(--border-hover))] focus-visible:ring-[rgb(var(--primary)/0.30)] dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))]",
      outline:
        "border border-[rgb(var(--border))] bg-transparent text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-hover))] hover:text-[rgb(var(--text-primary))] hover:border-[rgb(var(--border-hover))] focus-visible:ring-[rgb(var(--primary)/0.30)] dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))]",
      ghost:
        "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-hover))] hover:text-[rgb(var(--text-primary))]",
      danger:
        "bg-[rgb(var(--error))] text-[rgb(var(--text-inverse))] shadow-[var(--shadow-sm)] hover:opacity-95 hover:text-[rgb(var(--text-inverse))] hover:shadow-[var(--shadow-md)] focus-visible:ring-[rgb(var(--error)/0.35)] dark:shadow-none dark:ring-1 dark:ring-[rgb(var(--border))]",
    };

    const sizes = {
      sm: "px-3 py-2 text-sm min-h-9",
      md: "px-4 py-2.5 text-sm min-h-11",
      lg: "px-6 py-3 text-base min-h-12",
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        style={
          variant === "primary"
            ? { backgroundImage: "linear-gradient(138deg, rgb(var(--primary)) 0%, rgb(var(--primary-hover)) 100%)" }
            : undefined
        }
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {icon && <span className="text-lg">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  }
);

ModernButton.displayName = "ModernButton";

export { ModernButton as Button };
