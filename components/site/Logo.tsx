"use client";

import { useId } from "react";

import { SITE_BRAND_NAME } from "@/lib/site-brand";

export function Logo({ className = "" }: { className?: string }) {
  const markId = useId().replace(/:/g, "");
  const gradId = `zentro-mark-${markId}`;
  const glowId = `zentro-glow-${markId}`;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width="36"
        height="36"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="zentro-logo-glow shrink-0"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0b0f14" />
            <stop offset="0.45" stopColor="#121922" />
            <stop offset="1" stopColor="#0a1018" />
          </linearGradient>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#5ee1ff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#5ee1ff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="16" cy="16" r="18" fill={`url(#${glowId})`} />
        <rect width="32" height="32" rx="8" fill={`url(#${gradId})`} />
        <rect
          width="32"
          height="32"
          rx="8"
          fill="none"
          stroke="rgba(94, 225, 255, 0.35)"
          strokeWidth="1"
        />
        <path
          d="M9.35 10.35h13.3M22.65 10.35L9.35 21.65M9.35 21.65h13.3"
          stroke="currentColor"
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent"
        />
      </svg>
      <span className="zentro-brand-wordmark whitespace-nowrap text-xl font-bold tracking-tight">
        {SITE_BRAND_NAME}
      </span>
    </div>
  );
}
