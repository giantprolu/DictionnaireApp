import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: string;
  children: React.ReactNode;
}

export function Badge({
  color = "#34D399",
  children,
  className = "",
  style,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium leading-tight ${className}`}
      style={{
        backgroundColor: `${color}1A`, // ~10% opacity hex suffix
        color,
        border: `1px solid ${color}33`, // ~20% opacity
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
