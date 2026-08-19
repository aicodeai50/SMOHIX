import { ImageResponse } from "next/og";

import { HqMicroMarkOgContent } from "@/components/brand/hq/HqMarkOg";
import { BRAND_MARK_COLORS } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple Touch Icon — HQ micro-mark with safe padding on dark background. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_MARK_COLORS.background,
        }}
      >
        <HqMicroMarkOgContent
          size={152}
          stroke={BRAND_MARK_COLORS.foreground}
          background="transparent"
          padding={0.12}
        />
      </div>
    ),
    { ...size },
  );
}
