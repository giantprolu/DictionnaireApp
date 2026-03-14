"use client";

import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[#F5F5F5]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-10 w-full rounded-[12px] border bg-[#1C1C1F] px-3 text-sm text-[#F5F5F5] placeholder-[#888] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A0B] disabled:opacity-50 disabled:cursor-not-allowed ${
            error
              ? "border-[#EF4444] focus:ring-[#EF4444]"
              : "border-[#2A2A2E] focus:ring-[#34D399] hover:border-[#3A3A3E]"
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs text-[#EF4444]">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
