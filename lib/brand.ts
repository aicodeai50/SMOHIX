import type { Metadata } from "next";

import { HQ_ASSET_PATHS, HQ_CONCEPT_NAME } from "@/lib/brand/hq/geometry";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

/** Official Smohix HQ corporate identity concept. */
export const HQ_BRAND_CONCEPT = HQ_CONCEPT_NAME;

/**
 * Official Smohix HQ mark — Precision Plate framed wordmark.
 * Master vector: `public/brand/hq/smohix-hq-mark.svg`
 * Favicon/micro: `app/icon.svg` (synced from HQ micro-mark geometry).
 */
export const BRAND_MARK_SOURCE = "public/brand/hq/smohix-hq-mark.svg" as const;

export const BRAND_MICRO_SOURCE = "public/brand/hq/smohix-hq-micro.svg" as const;

/** Public URLs for brand assets on smohix.run. */
export const BRAND_ASSETS = {
  /** Primary corporate wordmark for JSON-LD and external references. */
  markSvg: HQ_ASSET_PATHS.masterMark,
  markDomainSvg: HQ_ASSET_PATHS.domainLockup,
  microMarkSvg: HQ_ASSET_PATHS.microMark,
  /** Next.js favicon route — geometry matches HQ micro-mark. */
  faviconSvg: "/icon.svg",
  markPng: "/icon.png",
  favicon: "/favicon.ico",
  appleIcon: "/apple-icon",
  openGraphImage: "/opengraph-image",
  twitterImage: "/twitter-image",
} as const;

/** Product display names — HQ mark is corporate; products may use distinct marks on their subdomains. */
export const BRAND_PRODUCT_NAMES = {
  company: SITE_BRAND_NAME,
  platform: "Smohix Platform",
  ai: "Smohix AI",
  ownApi: "Smohix Own API",
} as const;

export type BrandProductName =
  (typeof BRAND_PRODUCT_NAMES)[keyof typeof BRAND_PRODUCT_NAMES];

/** Monochrome HQ palette for OG/social surfaces on dark backgrounds. */
export const BRAND_MARK_COLORS = {
  foreground: "#eef0f4",
  background: "#06070b",
  accent: "#5ee1ff",
  muted: "#a8b0c3",
} as const;

export const BRAND_MARK_VIEWBOX = 32 as const;

/** Organization / WebSite JSON-LD logo — primary HQ wordmark. */
export function getBrandLogoUrl(siteUrl: string): string {
  return new URL(BRAND_ASSETS.markSvg, siteUrl).href;
}

/** Metadata icons for root layout — HQ micro-mark favicon assets. */
export function getBrandMetadataIcons(): NonNullable<Metadata["icons"]> {
  return {
    icon: [
      { url: BRAND_ASSETS.favicon, sizes: "48x48" },
      { url: BRAND_ASSETS.markPng, sizes: "512x512", type: "image/png" },
      { url: BRAND_ASSETS.faviconSvg, type: "image/svg+xml" },
    ],
    apple: [{ url: BRAND_ASSETS.appleIcon, sizes: "180x180", type: "image/png" }],
  };
}
