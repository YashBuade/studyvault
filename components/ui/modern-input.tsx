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
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))] group-focus-within:text-[rgb(var(--primary))] transition-colors pointer-events-none">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={`w-full px-4 py-3 ${icon ? "pl-12" : ""} bg-[rgb(var(--surface))] border-2 border-[rgb(var(--border))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] rounded-[var(--radius-md)] transition-all duration-[var(--transition-base)] hover:border-[rgb(var(--border-hover))] focus:outline-none focus:border-[rgb(var(--border-focus))] focus:ring-2 focus:ring-[rgb(var(--primary))]/25 disabled:opacity-50 disabled:cursor-not-allowed ${
              error ? "border-[rgb(var(--error))] focus:border-[rgb(var(--error))] focus:ring-[rgb(var(--error))]/20" : ""
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

        {helperText && !error && <p className="text-sm text-[rgb(var(--text-tertiary))]">{helperText}</p>}
      </div>
    );
  }
);

ModernInput.displayName = "ModernInput";
