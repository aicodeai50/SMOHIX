import { ImageResponse } from "next/og";

import { SmohixMarkOgContent } from "@/components/brand/smohixMarkPaths";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple Touch Icon — rendered from the official Smohix mark (`app/icon.svg`). */
export default function AppleIcon() {
  return new ImageResponse(<SmohixMarkOgContent size={180} />, { ...size });
}
