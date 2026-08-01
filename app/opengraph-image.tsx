import { ImageResponse } from "next/og";

import { ZentroMarkOgContent } from "@/components/brand/zentroMarkPaths";
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
          background: "linear-gradient(145deg, #06070b 0%, #0c1018 42%, #080a10 100%)",
          color: "#eef0f4",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <ZentroMarkOgContent size={96} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 860 }}>
            <div style={{ fontSize: 58, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1.1 }}>
              {SITE_BRAND_NAME}
            </div>
            <div
              style={{
                width: 120,
                height: 4,
                borderRadius: 2,
                background: "#5ee1ff",
                opacity: 0.85,
              }}
            />
            <div style={{ fontSize: 30, lineHeight: 1.45, color: "#a8b0c3", maxWidth: 920 }}>
              {SITE_MARKETING_TWITTER_DESCRIPTION}
            </div>
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
