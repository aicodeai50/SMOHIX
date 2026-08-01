import type { Metadata } from "next";

import { SITE_BRAND_NAME } from "@/lib/site-brand";

/**
 * Official Zentro mark — single source of truth for every logo, icon, favicon, OG, and PWA asset.
 * The live file is `app/icon.svg` (served at /icon.svg). Do not redesign or replace this mark.
 */
export const BRAND_MARK_SOURCE = "app/icon.svg" as const;

/** Public URLs for brand assets (derived from the official mark). */
export const BRAND_ASSETS = {
  markSvg: "/icon.svg",
  markPng: "/icon.png",
  favicon: "/favicon.ico",
  appleIcon: "/apple-icon",
  openGraphImage: "/opengraph-image",
  twitterImage: "/twitter-image",
} as const;

/** Product display names — same official mark, different product labels. */
export const BRAND_PRODUCT_NAMES = {
  company: SITE_BRAND_NAME,
  platform: "Zentro Platform",
  ai: "Zentro AI",
  ownApi: "Zentro Own API",
} as const;

export type BrandProductName =
  (typeof BRAND_PRODUCT_NAMES)[keyof typeof BRAND_PRODUCT_NAMES];

/** Colors extracted from the official `app/icon.svg` mark. */
export const BRAND_MARK_COLORS = {
  backgroundStart: "#0b0f14",
  backgroundMid: "#121922",
  backgroundEnd: "#0a1018",
  glyph: "#5ee1ff",
  border: "rgba(255,255,255,0.09)",
} as const;

export const BRAND_MARK_VIEWBOX = 32 as const;

export function getBrandLogoUrl(siteUrl: string): string {
  return new URL(BRAND_ASSETS.markSvg, siteUrl).href;
}

/** Metadata icons for root layout — all routes inherit these from the official mark. */
export function getBrandMetadataIcons(): NonNullable<Metadata["icons"]> {
  return {
    icon: [
      { url: BRAND_ASSETS.favicon, sizes: "48x48" },
      { url: BRAND_ASSETS.markPng, sizes: "512x512", type: "image/png" },
      { url: BRAND_ASSETS.markSvg, type: "image/svg+xml" },
    ],
    apple: [{ url: BRAND_ASSETS.appleIcon, sizes: "180x180", type: "image/png" }],
  };
}
