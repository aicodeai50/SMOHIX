import type { HTMLAttributes } from "react";

import { HQ_ACCENT_COLOR } from "@/lib/brand/hq/geometry";

import { SmohixHqMark, type SmohixHqMarkTone } from "./SmohixHqMark";

export type SmohixHqDomainWordmarkProps = HTMLAttributes<HTMLDivElement> & {
  tone?: SmohixHqMarkTone;
  decorative?: boolean;
  symbolSize?: number;
};

/**
 * Domain wordmark — [S symbol] smohix.run
 * Use only where the headquarters domain must be explicit (social previews, domain assets).
 * Not for primary header/footer navigation branding.
 */
export function SmohixHqDomainWordmark({
  tone = "dark",
  decorative = false,
  symbolSize = 28,
  className = "",
  ...rest
}: SmohixHqDomainWordmarkProps) {
  const primary = tone === "dark" ? "#f4f4f5" : tone === "mono" ? "currentColor" : "#0a0a0a";
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
      <SmohixHqMark tone={tone} micro size={symbolSize} decorative aria-hidden />
      <span
        className={`whitespace-nowrap font-semibold tracking-tight ${textSize}`}
        style={{ letterSpacing: "0.02em" }}
      >
        <span style={{ color: primary }}>smohix</span>
        <span style={{ color: tone === "mono" ? "currentColor" : HQ_ACCENT_COLOR }}>.run</span>
      </span>
    </div>
  );
}
