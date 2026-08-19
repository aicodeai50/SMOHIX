/**
 * Canonical product name — use for all user-visible branding and default metadata.
 * Do not introduce alternate spellings in UI copy or SEO fields.
 */
export const SITE_BRAND_NAME = "Smohix" as const;
/** Public-facing domain brand */
export const SITE_PUBLIC_BRAND = "Smohix.run" as const;
export const SITE_PRIMARY_DOMAIN = "smohix.run" as const;
export const SITE_LEGAL_NAME = "Smohix, Inc." as const;
export const SITE_COMPANY_NAME = "Smohix Technologies" as const;

/** Recommended public usage: "Smohix.run by Smohix Technologies" */
export const SITE_BRAND_BYLINE = `${SITE_PUBLIC_BRAND} by ${SITE_COMPANY_NAME}` as const;

export const SITE_MARKETING_TITLE =
  "Smohix Technologies — Intelligent Software, AI Products & Developer Platforms" as const;

export const SITE_MARKETING_DESCRIPTION =
  "Smohix Technologies builds AI products, developer platforms, APIs, and enterprise solutions — one ecosystem at smohix.run with workspaces for AI, platform operations, assistant productivity, and private deployment." as const;

export const SITE_MARKETING_TWITTER_DESCRIPTION =
  "Official headquarters of Smohix Technologies — AI products, platform workspaces, APIs, and developer tools in one ecosystem." as const;

/** SEO keywords derived from shipped product and marketing surfaces — not invented claims. */
export const SITE_SEO_KEYWORDS = [
  "Smohix",
  "Smohix Technologies",
  "Smohix AI",
  "Smohix Platform",
  "Smohix Assistant",
  "Smohix PRI",
  "Smohix Log",
  "Smohix Identity",
  "Smohix Own API",
  "AI products",
  "developer platform",
  "enterprise AI",
  "developer APIs",
  "AI operations",
  "private AI",
  "smohix.run",
] as const;

export const SITE_TAGLINE =
  "Intelligent software for organizations that need to move fast — with control." as const;

/** 8px base spacing scale (multiples of 0.5rem) */
export const SPACING_UNIT_PX = 8 as const;

/** Brand palette — distinct indigo/emerald identity for Smohix product platform */
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
