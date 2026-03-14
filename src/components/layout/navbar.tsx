"use client";

import React from "react";

export interface NavbarProps {
  hasUnread?: boolean;
  onNotificationClick?: () => void;
}

export function Navbar({
  hasUnread = false,
  onNotificationClick,
}: NavbarProps) {
  return (
    <nav className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#2A2A2E] bg-[#0A0A0B]/80 px-4 backdrop-blur-xl">
      {/* Logo / title */}
      <span className="text-lg font-bold tracking-tight text-[#F5F5F5]">
        Val&apos;<span className="text-[#34D399]">tionnaire</span>
      </span>

      {/* Notification bell */}
      <button
        onClick={onNotificationClick}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#888] transition-colors hover:bg-[#1C1C1F] hover:text-[#F5F5F5]"
        aria-label="Notifications"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {hasUnread && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#EF4444]" />
        )}
      </button>
    </nav>
  );
}
