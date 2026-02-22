"use client";

import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "gradient" | "elevated";
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", variant = "default", children, ...props }, ref) => {
    const variants = {
      default:
        "bg-[rgb(var(--surface))] border border-[rgb(var(--border))] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
      gradient:
        "bg-gradient-to-br from-[rgb(var(--surface))] via-[rgb(var(--surface-hover))] to-[rgb(var(--background-alt))] border border-[rgb(var(--border))] shadow-[var(--shadow-sm)]",
      elevated:
        "bg-[rgb(var(--surface-elevated))] shadow-[var(--shadow-lg)] hover:shadow-[var(--shadow-hover)] border border-[rgb(var(--border))]",
    };

    return (
      <div
        ref={ref}
        className={`rounded-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
