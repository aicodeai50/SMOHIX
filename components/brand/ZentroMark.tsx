"use client";

import { useId } from "react";

import { BRAND_MARK_VIEWBOX } from "@/lib/brand";

import { ZentroMarkSvgPaths } from "./zentroMarkPaths";

type ZentroMarkProps = {
  /** Rendered pixel size (viewBox stays 32×32). Default 32. */
  size?: number;
  className?: string;
};

/** Official Zentro icon/mark only — use everywhere a logo glyph is needed. */
export function ZentroMark({ size = 32, className = "" }: ZentroMarkProps) {
  const markId = useId().replace(/:/g, "");
  const gradientId = `zentro-mark-${markId}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${BRAND_MARK_VIEWBOX} ${BRAND_MARK_VIEWBOX}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={["shrink-0", className].filter(Boolean).join(" ")}
      aria-hidden
    >
      <ZentroMarkSvgPaths gradientId={gradientId} />
    </svg>
  );
}
