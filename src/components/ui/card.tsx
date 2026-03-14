import React from "react";

/* -------------------------------------------------------------------------- */
/*  Card                                                                      */
/* -------------------------------------------------------------------------- */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-[#2A2A2E] bg-[#1C1C1F] text-[#F5F5F5] shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  CardHeader                                                                */
/* -------------------------------------------------------------------------- */

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

function CardHeader({ className = "", children, ...props }: CardHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-1.5 p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  CardTitle                                                                 */
/* -------------------------------------------------------------------------- */

export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

function CardTitle({ className = "", children, ...props }: CardTitleProps) {
  return (
    <h3
      className={`text-lg font-semibold leading-tight text-[#F5F5F5] ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

/* -------------------------------------------------------------------------- */
/*  CardDescription                                                           */
/* -------------------------------------------------------------------------- */

export interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

function CardDescription({
  className = "",
  children,
  ...props
}: CardDescriptionProps) {
  return (
    <p
      className={`text-sm text-[#888] ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/*  CardContent                                                               */
/* -------------------------------------------------------------------------- */

export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

function CardContent({ className = "", children, ...props }: CardContentProps) {
  return (
    <div className={`px-5 pb-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  CardFooter                                                                */
/* -------------------------------------------------------------------------- */

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

function CardFooter({ className = "", children, ...props }: CardFooterProps) {
  return (
    <div
      className={`flex items-center border-t border-[#2A2A2E] px-5 py-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
