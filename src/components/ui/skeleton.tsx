import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "line" | "circle" | "card";
}

const variantClasses: Record<string, string> = {
  line: "h-4 w-full rounded-lg",
  circle: "h-10 w-10 rounded-full",
  card: "h-32 w-full rounded-xl",
};

export function Skeleton({
  variant = "line",
  className = "",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-[#2A2A2E] ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
