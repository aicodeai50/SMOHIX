import { BRAND_PRODUCT_NAMES } from "@/lib/brand";

import { HqMark, type HqMarkTone } from "./hq/HqMark";

/** Precision Plate wordmark aspect ratio (140×44 viewBox). */
const HQ_MARK_ASPECT = 140 / 44;

export type BrandLogoProps = {
  className?: string;
  /** Stroke tone for the framed smohix wordmark. */
  tone?: HqMarkTone;
  /** Wordmark height in px — default fits h-16 header without increasing chrome height. */
  height?: number;
  /** When true, hide SVG from assistive tech (parent link provides accessible name). */
  decorative?: boolean;
};

/**
 * Official Smohix HQ corporate logo — Precision Plate framed "smohix" wordmark.
 * Used across marketing, console, auth, and admin surfaces on smohix.run.
 */
export function BrandLogo({
  className = "",
  tone = "light",
  height = 26,
  decorative = false,
}: BrandLogoProps) {
  const width = Math.round(height * HQ_MARK_ASPECT);
  return (
    <div className={`flex items-center ${className}`.trim()}>
      <HqMark tone={tone} width={width} height={height} decorative={decorative} />
    </div>
  );
}

export { BRAND_PRODUCT_NAMES };
