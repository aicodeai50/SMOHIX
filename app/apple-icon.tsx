import { ImageResponse } from "next/og";

import { HqMicroMarkOgContent } from "@/components/brand/hq/HqMarkOg";
import { BRAND_MARK_COLORS } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple Touch Icon — Flow Mark S + dot on dark rounded container (symbol only, no text). */
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
          size={168}
          stroke={BRAND_MARK_COLORS.foreground}
          accent={BRAND_MARK_COLORS.accent}
          background={BRAND_MARK_COLORS.background}
          padding={0.14}
        />
      </div>
    ),
    { ...size },
  );
}
