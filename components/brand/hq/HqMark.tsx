import type { SVGProps } from "react";

import {
  HQ_DOMAIN_SUFFIX_PATHS,
  HQ_DOMAIN_VIEWBOX,
  HQ_FRAME_PATHS,
  HQ_FRAME_STROKE,
  HQ_LETTER_PATHS,
  HQ_MARK_VIEWBOX,
  HQ_MICRO_PATHS,
  HQ_MICRO_VIEWBOX,
  HQ_STROKE,
} from "@/lib/brand/hq/geometry";

export type HqMarkTone = "light" | "dark" | "mono";

type BaseProps = Omit<SVGProps<SVGSVGElement>, "children" | "viewBox"> & {
  tone?: HqMarkTone;
  /** When true, hide decorative geometry from assistive tech (visible word nearby). */
  decorative?: boolean;
};

function toneClass(tone: HqMarkTone): string {
  if (tone === "dark") return "text-white";
  if (tone === "mono") return "text-current";
  return "text-foreground";
}

function LetterGroup({ strokeWidth = HQ_STROKE }: { strokeWidth?: number }) {
  return (
    <g fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {Object.values(HQ_LETTER_PATHS).map((d) => (
        <path key={d.slice(0, 12)} d={d} />
      ))}
    </g>
  );
}

function FrameGroup({ strokeWidth = HQ_FRAME_STROKE }: { strokeWidth?: number }) {
  return (
    <g fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square">
      <path d={HQ_FRAME_PATHS.topLeft} />
      <path d={HQ_FRAME_PATHS.bottomRight} />
    </g>
  );
}

/** Primary HQ lockup: framed custom "smohix" wordmark. */
export function HqMark({
  tone = "light",
  decorative = false,
  width,
  height,
  className = "",
  ...rest
}: BaseProps & { width?: number; height?: number }) {
  const w = width ?? 140;
  const h = height ?? 44;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={HQ_MARK_VIEWBOX}
      width={w}
      height={h}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : "Smohix corporate mark"}
      className={`${toneClass(tone)} ${className}`.trim()}
      {...rest}
    >
      {!decorative ? <title>Smohix</title> : null}
      <FrameGroup />
      <LetterGroup />
    </svg>
  );
}

/** Optional domain lockup: framed "smohix.run" for larger corporate contexts. */
export function HqDomainLockup({
  tone = "light",
  decorative = false,
  width,
  height,
  className = "",
  ...rest
}: BaseProps & { width?: number; height?: number }) {
  const w = width ?? 178;
  const h = height ?? 44;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={HQ_DOMAIN_VIEWBOX}
      width={w}
      height={h}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : "Smohix smohix.run"}
      className={`${toneClass(tone)} ${className}`.trim()}
      {...rest}
    >
      {!decorative ? <title>smohix.run</title> : null}
      <FrameGroup />
      <LetterGroup />
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={HQ_STROKE * 0.88}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.92}
      >
        <path d={HQ_DOMAIN_SUFFIX_PATHS.dot} />
        <path d={HQ_DOMAIN_SUFFIX_PATHS.r} />
        <path d={HQ_DOMAIN_SUFFIX_PATHS.u} />
        <path d={HQ_DOMAIN_SUFFIX_PATHS.n} />
      </g>
    </svg>
  );
}

/** HQ micro-mark for 16–24px favicon contexts — distinct from Smohix AI Aperture S. */
export function HqMicroMark({
  tone = "light",
  size = 32,
  decorative = false,
  className = "",
  ...rest
}: BaseProps & { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={HQ_MICRO_VIEWBOX}
      width={size}
      height={size}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : "Smohix"}
      className={`${toneClass(tone)} ${className}`.trim()}
      {...rest}
    >
      {!decorative ? <title>Smohix</title> : null}
      <g fill="none" stroke="currentColor" strokeWidth={1.35} strokeLinecap="square">
        <path d={HQ_MICRO_PATHS.frame} />
        <path d={HQ_MICRO_PATHS.base} />
        <path d={HQ_MICRO_PATHS.rail} />
        <path d={HQ_MICRO_PATHS.tick} strokeLinecap="round" />
      </g>
      <path
        d={HQ_MICRO_PATHS.sHook}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Static SVG strings for export assets and documentation. */
export function renderHqMarkSvg(tone: HqMarkTone = "mono"): string {
  const stroke = tone === "dark" ? "#ffffff" : "#0a0a0a";
  const letters = Object.values(HQ_LETTER_PATHS)
    .map((d) => `<path d="${d}" />`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${HQ_MARK_VIEWBOX}" fill="none" role="img" aria-label="Smohix">
  <g stroke="${stroke}" stroke-width="${HQ_FRAME_STROKE}" stroke-linecap="square">
    <path d="${HQ_FRAME_PATHS.topLeft}" />
    <path d="${HQ_FRAME_PATHS.bottomRight}" />
  </g>
  <g stroke="${stroke}" stroke-width="${HQ_STROKE}" stroke-linecap="round" stroke-linejoin="round">
    ${letters}
  </g>
</svg>`;
}
