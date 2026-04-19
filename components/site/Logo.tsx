"use client";

import { useId } from "react";

import { SITE_BRAND_NAME } from "@/lib/site-brand";

export function Logo({ className = "" }: { className?: string }) {
  const markId = useId().replace(/:/g, "");
  const gradId = `shynvo-mark-${markId}`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0c1219" />
            <stop offset="0.45" stopColor="#121a2a" />
            <stop offset="1" stopColor="#0a1620" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill={`url(#${gradId})`} />
        <rect
          width="32"
          height="32"
          rx="9"
          fill="none"
          stroke="rgba(94,225,255,0.22)"
          strokeWidth="1"
        />
        <path
          d="M8 16h4l2-6 4 12 2-6h4"
          stroke="currentColor"
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent drop-shadow-[0_0_8px_rgba(94,225,255,0.4)]"
        />
      </svg>
      <span className="text-lg font-semibold tracking-tight">{SITE_BRAND_NAME}</span>
    </div>
  );
}
