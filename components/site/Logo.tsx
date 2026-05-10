"use client";

import { useId } from "react";

import { SITE_BRAND_NAME } from "@/lib/site-brand";

export function Logo({ className = "" }: { className?: string }) {
  const markId = useId().replace(/:/g, "");
  const gradId = `zentro-mark-${markId}`;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width="36"
        height="36"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0b0f14" />
            <stop offset="0.5" stopColor="#121922" />
            <stop offset="1" stopColor="#0a1018" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="6" fill={`url(#${gradId})`} />
        <rect
          width="32"
          height="32"
          rx="6"
          fill="none"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth="1"
        />
        <path
          d="M9.35 10.35h13.3M22.65 10.35L9.35 21.65M9.35 21.65h13.3"
          stroke="currentColor"
          strokeWidth="1.78"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent"
        />
      </svg>
      <span className="whitespace-nowrap text-xl font-semibold tracking-tight">
        {SITE_BRAND_NAME}
      </span>
    </div>
  );
}
