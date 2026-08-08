"use client";

import Link from "next/link";

import { AppIcon } from "@/components/icons/AppIcon";
import { trackEvent } from "@/lib/analytics";
import { COMMERCIAL_PATHS, type CommercialPathId } from "@/lib/commercial-journey";
import { mBody } from "@/lib/marketing-layout";

const PATH_ICONS: Record<CommercialPathId, "layoutDashboard" | "workflow" | "keyRound"> = {
  try: "layoutDashboard",
  pilot: "workflow",
  build: "keyRound",
};

export function CommercialPaths({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`grid gap-4 ${compact ? "sm:grid-cols-3" : "md:grid-cols-3"} ${className}`}
      role="list"
      aria-label="Ways to work with Smohix"
    >
      {COMMERCIAL_PATHS.map((path) => (
        <Link
          key={path.id}
          href={path.href}
          role="listitem"
          onClick={() => trackEvent(path.analyticsEvent, { path: path.href, label: path.title })}
          className={`group flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            compact ? "p-4" : "p-5"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] transition-colors group-hover:bg-accent/15">
              <AppIcon
                name={PATH_ICONS[path.id]}
                size={18}
                className="text-primary-muted group-hover:text-accent"
                aria-hidden
              />
            </div>
            <h3 className={`font-semibold text-foreground ${compact ? "text-sm" : ""}`}>
              {path.title}
            </h3>
          </div>
          {!compact ? (
            <p className={`mt-3 flex-1 ${mBody}`}>{path.description}</p>
          ) : null}
          <span className={`mt-3 text-sm font-medium text-accent ${compact ? "mt-2" : ""}`}>
            {path.cta} →
          </span>
        </Link>
      ))}
    </div>
  );
}
