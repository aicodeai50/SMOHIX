import type { HTMLAttributes } from "react";

import { HQ_ACCENT_COLOR } from "@/lib/brand/hq/geometry";

import { SmohixHqMark, type SmohixHqMarkTone } from "./SmohixHqMark";

export type SmohixHqWordmarkProps = HTMLAttributes<HTMLDivElement> & {
  tone?: SmohixHqMarkTone;
  decorative?: boolean;
  /** Symbol height in px — text scales proportionally. */
  symbolSize?: number;
  /** Hide ".run" suffix at extremely constrained widths (symbol-only fallback). */
  symbolOnly?: boolean;
  /** Text size class override. */
  textClassName?: string;
};

function wordColors(tone: SmohixHqMarkTone): { primary: string; accent: string } {
  if (tone === "dark") return { primary: "#f4f4f5", accent: HQ_ACCENT_COLOR };
  if (tone === "mono") return { primary: "currentColor", accent: "currentColor" };
  return { primary: "#0a0a0a", accent: HQ_ACCENT_COLOR };
}

/**
 * Horizontal HQ wordmark — [S symbol] smohix.run
 * Used in header, footer, and navigation branding.
 */
export function SmohixHqWordmark({
  tone = "dark",
  decorative = false,
  symbolSize = 28,
  symbolOnly = false,
  textClassName = "",
  className = "",
  ...rest
}: SmohixHqWordmarkProps) {
  const colors = wordColors(tone);
  const textSize =
    symbolSize >= 26 ? "text-[1.0625rem]" : symbolSize >= 22 ? "text-[0.9375rem]" : "text-sm";

  return (
    <div
      className={`inline-flex min-w-0 items-center gap-2.5 ${className}`.trim()}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : "Smohix smohix.run"}
      {...rest}
    >
      <SmohixHqMark
        tone={tone}
        micro
        size={symbolSize}
        decorative
        aria-hidden
      />
      {!symbolOnly ? (
        <span
          className={`whitespace-nowrap font-semibold tracking-tight ${textSize} ${textClassName}`.trim()}
          style={{ letterSpacing: "0.02em" }}
        >
          <span style={{ color: colors.primary }}>smohix</span>
          <span style={{ color: colors.accent }}>.run</span>
        </span>
      ) : null}
    </div>
  );
}
