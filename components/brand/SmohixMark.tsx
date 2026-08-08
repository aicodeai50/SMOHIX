"use client";

import { useId } from "react";

import { BRAND_MARK_VIEWBOX } from "@/lib/brand";

import { SmohixMarkSvgPaths } from "./smohixMarkPaths";

type SmohixMarkProps = {
  /** Rendered pixel size (viewBox stays 32×32). Default 32. */
  size?: number;
  className?: string;
};

/** Official Smohix icon/mark only — use everywhere a logo glyph is needed. */
export function SmohixMark({ size = 32, className = "" }: SmohixMarkProps) {
  const markId = useId().replace(/:/g, "");
  const gradientId = `smohix-mark-${markId}`;

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
      <SmohixMarkSvgPaths gradientId={gradientId} />
    </svg>
  );
}
