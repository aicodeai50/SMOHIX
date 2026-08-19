import { ImageResponse } from "next/og";

import { HqMarkOgContent } from "@/components/brand/hq/HqMarkOg";
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
          justifyContent: "space-between",
          padding: "72px 80px",
          background: `linear-gradient(145deg, ${BRAND_MARK_COLORS.background} 0%, #0c1018 42%, #080a10 100%)`,
          color: BRAND_MARK_COLORS.foreground,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 980 }}>
          <HqMarkOgContent width={480} height={150} stroke={BRAND_MARK_COLORS.foreground} />
          <div
            style={{
              width: 120,
              height: 4,
              borderRadius: 2,
              background: BRAND_MARK_COLORS.accent,
              opacity: 0.85,
            }}
          />
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.45,
              color: BRAND_MARK_COLORS.muted,
              maxWidth: 920,
            }}
          >
            {SITE_MARKETING_TWITTER_DESCRIPTION}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            fontSize: 22,
            color: "#6b7280",
          }}
        >
          <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
            {SITE_PRIMARY_DOMAIN}
          </span>
          <span style={{ fontSize: 18, opacity: 0.75 }}>Enterprise AI operations and cybersecurity</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
