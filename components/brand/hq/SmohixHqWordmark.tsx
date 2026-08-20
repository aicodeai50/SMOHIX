import type { HTMLAttributes } from "react";

import { SmohixHqMark, type SmohixHqMarkTone } from "./SmohixHqMark";

export type SmohixHqWordmarkProps = HTMLAttributes<HTMLDivElement> & {
  tone?: SmohixHqMarkTone;
  decorative?: boolean;
  /** Symbol height in px — text scales proportionally. */
  symbolSize?: number;
  /** Force symbol-only (overrides responsive behavior). */
  symbolOnly?: boolean;
  textClassName?: string;
};

function labelColor(tone: SmohixHqMarkTone): string {
  if (tone === "dark") return "#f4f4f5";
  if (tone === "mono") return "currentColor";
  return "#0a0a0a";
}

/**
 * Primary HQ brand wordmark — [S symbol] Smohix
 * Use in header, footer, and navigation. Do not append ".run" here.
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
  const textSize =
    symbolSize >= 26 ? "text-[1.0625rem]" : symbolSize >= 22 ? "text-[0.9375rem]" : "text-sm";

  return (
    <div
      className={`inline-flex min-w-0 items-center gap-2.5 ${className}`.trim()}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : "Smohix"}
      {...rest}
    >
      <SmohixHqMark tone={tone} micro size={symbolSize} decorative aria-hidden />
      {!symbolOnly ? (
        <span
          className={`whitespace-nowrap font-semibold tracking-tight max-[279px]:hidden ${textSize} ${textClassName}`.trim()}
          style={{ letterSpacing: "0.02em", color: labelColor(tone) }}
        >
          Smohix
        </span>
      ) : null}
    </div>
  );
}
