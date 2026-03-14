"use client";

import React from "react";

const variantClasses = {
  default:
    "bg-[#34D399] text-[#0A0A0B] hover:bg-[#2bb583] active:bg-[#259e72] font-semibold",
  secondary:
    "bg-[#1C1C1F] text-[#F5F5F5] border border-[#2A2A2E] hover:bg-[#242428] active:bg-[#2A2A2E]",
  outline:
    "bg-transparent text-[#F5F5F5] border border-[#2A2A2E] hover:border-[#34D399] hover:text-[#34D399] active:bg-[#1C1C1F]",
  ghost:
    "bg-transparent text-[#F5F5F5] hover:bg-[#1C1C1F] active:bg-[#242428]",
  danger:
    "bg-[#EF4444] text-white hover:bg-[#DC2626] active:bg-[#B91C1C] font-semibold",
} as const;

const sizeClasses = {
  sm: "h-8 px-3 text-sm rounded-[10px] gap-1.5",
  md: "h-10 px-4 text-sm rounded-[12px] gap-2",
  lg: "h-12 px-6 text-base rounded-[14px] gap-2.5",
} as const;

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? "h-4 w-4"}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      size = "md",
      loading = false,
      disabled,
      children,
      className = "",
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center font-medium transition-colors duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34D399] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0B] disabled:opacity-50 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
