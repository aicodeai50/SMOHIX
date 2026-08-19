import type { SVGProps } from "react";

import {
  HQ_ACCENT_COLOR,
  HQ_MICRO_REGISTRATION_DOT,
  HQ_MICRO_S_LOWER_PATH,
  HQ_MICRO_S_UPPER_PATH,
  HQ_MICRO_STROKE,
  HQ_MICRO_VIEWBOX,
  HQ_REGISTRATION_DOT,
  HQ_S_LOWER_PATH,
  HQ_S_UPPER_PATH,
  HQ_SYMBOL_STROKE,
  HQ_SYMBOL_VIEWBOX,
} from "@/lib/brand/hq/geometry";

export type SmohixHqMarkTone = "light" | "dark" | "mono";

type MarkProps = Omit<SVGProps<SVGSVGElement>, "children" | "viewBox"> & {
  tone?: SmohixHqMarkTone;
  /** When true, hide from assistive tech (visible word nearby). */
  decorative?: boolean;
  /** Use micro geometry optimized for ≤32px. */
  micro?: boolean;
  /** Hide registration dot (not used for official symbol variant). */
  hideDot?: boolean;
};

function strokeColor(tone: SmohixHqMarkTone): string {
  if (tone === "dark") return "#f4f4f5";
  if (tone === "mono") return "currentColor";
  return "#0a0a0a";
}

function dotColor(tone: SmohixHqMarkTone): string {
  if (tone === "mono") return "currentColor";
  return HQ_ACCENT_COLOR;
}

function SymbolPaths({
  micro,
  stroke,
  dot,
  tone,
  hideDot,
}: {
  micro: boolean;
  stroke: string;
  dot: string;
  tone: SmohixHqMarkTone;
  hideDot: boolean;
}) {
  const upper = micro ? HQ_MICRO_S_UPPER_PATH : HQ_S_UPPER_PATH;
  const lower = micro ? HQ_MICRO_S_LOWER_PATH : HQ_S_LOWER_PATH;
  const strokeWidth = micro ? HQ_MICRO_STROKE : HQ_SYMBOL_STROKE;
  const registration = micro ? HQ_MICRO_REGISTRATION_DOT : HQ_REGISTRATION_DOT;

  return (
    <>
      <path
        d={upper}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={lower}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {!hideDot ? (
        <circle
          cx={registration.cx}
          cy={registration.cy}
          r={registration.r}
          fill={dotColor(tone)}
        />
      ) : null}
    </>
  );
}

/**
 * HQ symbol — custom geometric S + cyan registration dot.
 * Used for favicon, app icon, badges, and compact surfaces. No text.
 */
export function SmohixHqMark({
  tone = "light",
  decorative = false,
  micro = false,
  hideDot = false,
  size,
  width,
  height,
  className = "",
  ...rest
}: MarkProps & { size?: number; width?: number; height?: number }) {
  const viewBox = micro ? HQ_MICRO_VIEWBOX : HQ_SYMBOL_VIEWBOX;
  const dim = size ?? width ?? height ?? (micro ? 32 : 100);
  const w = width ?? dim;
  const h = height ?? dim;
  const stroke = strokeColor(tone);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={w}
      height={h}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : "Smohix"}
      className={`shrink-0 ${className}`.trim()}
      {...rest}
    >
      {!decorative ? <title>Smohix</title> : null}
      <SymbolPaths micro={micro} stroke={stroke} dot={stroke} tone={tone} hideDot={hideDot} />
    </svg>
  );
}

/** Static SVG export for public assets. */
export function renderSmohixHqMarkSvg(
  tone: SmohixHqMarkTone = "dark",
  micro = false,
): string {
  const stroke = strokeColor(tone);
  const dot = dotColor(tone);
  const upper = micro ? HQ_MICRO_S_UPPER_PATH : HQ_S_UPPER_PATH;
  const lower = micro ? HQ_MICRO_S_LOWER_PATH : HQ_S_LOWER_PATH;
  const strokeWidth = micro ? HQ_MICRO_STROKE : HQ_SYMBOL_STROKE;
  const registration = micro ? HQ_MICRO_REGISTRATION_DOT : HQ_REGISTRATION_DOT;
  const viewBox = micro ? HQ_MICRO_VIEWBOX : HQ_SYMBOL_VIEWBOX;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" role="img" aria-label="Smohix">
  <path d="${upper}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />
  <path d="${lower}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="${registration.cx}" cy="${registration.cy}" r="${registration.r}" fill="${dot}" />
</svg>`;
}
