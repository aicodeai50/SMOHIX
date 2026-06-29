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
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1" />
            <stop offset="1" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <rect width="36" height="36" rx="9" fill={`url(#${gradId})`} />
        <path
          d="M10 18h16M18 10v16"
          stroke="#FAFAFA"
          strokeWidth="2.25"
          strokeLinecap="round"
        />
        <circle cx="18" cy="18" r="4" fill="#FAFAFA" fillOpacity="0.95" />
      </svg>
      <span className="whitespace-nowrap text-xl font-bold tracking-tight text-foreground">
        {SITE_BRAND_NAME}
      </span>
    </div>
  );
}
