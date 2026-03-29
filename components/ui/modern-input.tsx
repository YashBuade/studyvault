"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

interface ModernInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const ModernInput = React.forwardRef<HTMLInputElement, ModernInputProps>(
  ({ className = "", label, icon, error, helperText, containerClassName = "", ...props }, ref) => {
    return (
      <div className={`space-y-2 ${containerClassName}`}>
        {label && (
          <label htmlFor={props.id} className="block text-sm font-semibold text-[rgb(var(--text-primary))]">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative group">
          {icon && (
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))] transition-colors group-focus-within:text-[rgb(var(--primary))]">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={`w-full rounded-[var(--radius-md)] border-2 border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-3 text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] transition-all duration-[var(--transition-base)] hover:border-[rgb(var(--border-hover))] focus:outline-none focus:border-[rgb(var(--border-focus))] focus:ring-2 focus:ring-[rgb(var(--primary)/0.25)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--surface))] dark:text-[rgb(var(--text-primary))] dark:placeholder:text-[rgb(var(--text-tertiary))] dark:focus:border-[rgb(var(--border-focus))] ${icon ? "pl-12" : ""} ${
              error ? "border-[rgb(var(--error))] focus:border-[rgb(var(--error))] focus:ring-[rgb(var(--error)/0.20)]" : ""
            } ${className}`}
            {...props}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-[rgb(var(--error))]">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {helperText && !error ? <p className="text-sm text-[rgb(var(--text-tertiary))]">{helperText}</p> : null}
      </div>
    );
  }
);

ModernInput.displayName = "ModernInput";
