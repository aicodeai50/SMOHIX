import type { HTMLAttributes } from "react";

import { HQ_ACCENT_COLOR } from "@/lib/brand/hq/geometry";

import { SmohixHqMark, type SmohixHqMarkTone } from "./SmohixHqMark";

export type SmohixHqLockupProps = HTMLAttributes<HTMLDivElement> & {
  tone?: SmohixHqMarkTone;
  decorative?: boolean;
  /** Symbol width in px. */
  symbolSize?: number;
  /** Layout direction. */
  direction?: "vertical" | "horizontal";
};

function wordColors(tone: SmohixHqMarkTone): { primary: string; accent: string } {
  if (tone === "dark") return { primary: "#f4f4f5", accent: HQ_ACCENT_COLOR };
  if (tone === "mono") return { primary: "currentColor", accent: "currentColor" };
  return { primary: "#0a0a0a", accent: HQ_ACCENT_COLOR };
}

/**
 * HQ brand lockup — large S symbol + smohix.run
 * Used for OG, social cards, and corporate identity surfaces.
 */
export function SmohixHqLockup({
  tone = "dark",
  decorative = false,
  symbolSize = 120,
  direction = "vertical",
  className = "",
  ...rest
}: SmohixHqLockupProps) {
  const colors = wordColors(tone);
  const isVertical = direction === "vertical";
  const textSize = symbolSize >= 100 ? "text-3xl" : symbolSize >= 72 ? "text-2xl" : "text-xl";

  return (
    <div
      className={`inline-flex items-center ${isVertical ? "flex-col gap-5" : "flex-row gap-4"} ${className}`.trim()}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : "Smohix smohix.run"}
      {...rest}
    >
      <SmohixHqMark tone={tone} size={symbolSize} decorative />
      <span
        className={`whitespace-nowrap font-semibold tracking-tight ${textSize}`}
        style={{ letterSpacing: "0.04em" }}
      >
        <span style={{ color: colors.primary }}>smohix</span>
        <span style={{ color: colors.accent }}>.run</span>
      </span>
    </div>
  );
}
