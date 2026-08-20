import type { HTMLAttributes } from "react";

import { HQ_ACCENT_COLOR } from "@/lib/brand/hq/geometry";

import { SmohixHqMark, type SmohixHqMarkTone } from "./SmohixHqMark";

export type SmohixHqLockupProps = HTMLAttributes<HTMLDivElement> & {
  tone?: SmohixHqMarkTone;
  decorative?: boolean;
  /** Symbol width in px. */
  symbolSize?: number;
  direction?: "vertical" | "horizontal";
};

function colors(tone: SmohixHqMarkTone): { brand: string; accent: string } {
  if (tone === "dark") return { brand: "#f4f4f5", accent: HQ_ACCENT_COLOR };
  if (tone === "mono") return { brand: "currentColor", accent: "currentColor" };
  return { brand: "#0a0a0a", accent: HQ_ACCENT_COLOR };
}

/**
 * HQ presentation lockup — S symbol + Smohix brand + smohix.run domain
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
  const palette = colors(tone);
  const isVertical = direction === "vertical";
  const brandSize = symbolSize >= 100 ? "text-3xl" : symbolSize >= 72 ? "text-2xl" : "text-xl";
  const domainSize = symbolSize >= 100 ? "text-xl" : symbolSize >= 72 ? "text-lg" : "text-base";

  return (
    <div
      className={`inline-flex items-center ${isVertical ? "flex-col gap-4" : "flex-row gap-4"} ${className}`.trim()}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : "Smohix smohix.run"}
      {...rest}
    >
      <SmohixHqMark tone={tone} size={symbolSize} decorative />
      <div
        className={`flex flex-col ${isVertical ? "items-center gap-1" : "items-start gap-0.5"}`}
      >
        <span
          className={`whitespace-nowrap font-semibold tracking-tight ${brandSize}`}
          style={{ letterSpacing: "0.03em", color: palette.brand }}
        >
          Smohix
        </span>
        <span
          className={`whitespace-nowrap font-semibold tracking-tight ${domainSize}`}
          style={{ letterSpacing: "0.04em" }}
        >
          <span style={{ color: palette.brand }}>smohix</span>
          <span style={{ color: palette.accent }}>.run</span>
        </span>
      </div>
    </div>
  );
}
