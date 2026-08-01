/**
 * Canonical product name — use for all user-visible branding and default metadata.
 * Do not introduce alternate spellings in UI copy or SEO fields.
 */
export const SITE_BRAND_NAME = "Zentro" as const;
/** Public-facing domain brand */
export const SITE_PUBLIC_BRAND = "Zentro.run" as const;
export const SITE_PRIMARY_DOMAIN = "zentro.run" as const;
export const SITE_LEGAL_NAME = "Zentro, Inc." as const;
export const SITE_COMPANY_NAME = "Zentro Technologies" as const;

/** Recommended public usage: "Zentro.run by Zentro Technologies" */
export const SITE_BRAND_BYLINE = `${SITE_PUBLIC_BRAND} by ${SITE_COMPANY_NAME}` as const;

export const SITE_MARKETING_TITLE =
  "Zentro Technologies — AI Platform for Accountable Operations" as const;

export const SITE_MARKETING_DESCRIPTION =
  "Zentro Technologies builds unified AI platforms, APIs, and agent infrastructure for developers, enterprises, and regulated teams — incident command, guarded automation, and audit-ready evidence at zentro.run." as const;

export const SITE_MARKETING_TWITTER_DESCRIPTION =
  "Official home of Zentro Technologies — AI-first platform, APIs, and developer tools for accountable operations." as const;

export const SITE_TAGLINE =
  "AI infrastructure with accountability built in." as const;

/** 8px base spacing scale (multiples of 0.5rem) */
export const SPACING_UNIT_PX = 8 as const;

/** Brand palette — distinct indigo/emerald identity for Zentro product platform */
export const BRAND_COLORS = {
  primary: "#6366F1",
  primaryMuted: "#818CF8",
  accent: "#10B981",
  accentMuted: "#34D399",
  background: "#09090B",
  surface: "#18181B",
  surfaceElevated: "#27272A",
  foreground: "#FAFAFA",
  muted: "#A1A1AA",
  border: "rgba(255, 255, 255, 0.08)",
} as const;
