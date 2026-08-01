import { ImageResponse } from "next/og";

import { ZentroMarkOgContent } from "@/components/brand/zentroMarkPaths";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple Touch Icon — rendered from the official Zentro mark (`app/icon.svg`). */
export default function AppleIcon() {
  return new ImageResponse(<ZentroMarkOgContent size={180} />, { ...size });
}
