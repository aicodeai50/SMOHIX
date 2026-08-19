import { ImageResponse } from "next/og";

import { HqLockupOgContent } from "@/components/brand/hq/HqMarkOg";
import { BRAND_MARK_COLORS } from "@/lib/brand";
import {
  SITE_BRAND_NAME,
  SITE_MARKETING_TWITTER_DESCRIPTION,
  SITE_PRIMARY_DOMAIN,
} from "@/lib/site-brand";

export const alt = SITE_BRAND_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "64px 80px",
          background: `linear-gradient(160deg, ${BRAND_MARK_COLORS.background} 0%, #0a0e16 50%, #06070b 100%)`,
          color: BRAND_MARK_COLORS.foreground,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 40,
            flex: 1,
            justifyContent: "center",
          }}
        >
          <HqLockupOgContent
            symbolSize={200}
            stroke={BRAND_MARK_COLORS.foreground}
            accent={BRAND_MARK_COLORS.accent}
          />
          <div
            style={{
              display: "flex",
              fontSize: 26,
              lineHeight: 1.45,
              color: BRAND_MARK_COLORS.muted,
              maxWidth: 820,
              textAlign: "center",
            }}
          >
            {SITE_MARKETING_TWITTER_DESCRIPTION}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            width: "100%",
            alignItems: "baseline",
            justifyContent: "space-between",
            fontSize: 20,
            color: "#6b7280",
          }}
        >
          <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
            {SITE_PRIMARY_DOMAIN}
          </span>
          <span style={{ display: "flex", fontSize: 17, opacity: 0.75 }}>
            Enterprise AI operations and cybersecurity
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
