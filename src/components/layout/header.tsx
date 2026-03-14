"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";

export interface HeaderProps {
  title?: string;
  showNotification?: boolean;
  hasUnread?: boolean;
  onNotificationClick?: () => void;
}

export function Header({
  title,
  showNotification = true,
  hasUnread = false,
  onNotificationClick,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isDashboard = pathname === "/dashboard";
  const displayTitle = title ?? "Val'tionnaire";

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#2A2A2E] bg-[#0A0A0B]/80 px-4 backdrop-blur-xl">
      {/* Left: back button or spacer */}
      <div className="flex w-10 items-center">
        {!isDashboard && (
          <button
            onClick={() => router.back()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#888] transition-colors hover:bg-[#1C1C1F] hover:text-[#F5F5F5]"
            aria-label="Retour"
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
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
      </div>

      {/* Center: title */}
      <h1 className="text-base font-bold text-[#F5F5F5] truncate max-w-[60%] text-center">
        {displayTitle}
      </h1>

      {/* Right: notification bell */}
      <div className="flex w-10 items-center justify-end">
        {showNotification && (
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
        )}
      </div>
    </header>
  );
}
