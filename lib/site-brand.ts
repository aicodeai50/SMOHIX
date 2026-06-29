/**
 * Canonical product name — use for all user-visible branding and default metadata.
 * Do not introduce alternate spellings in UI copy or SEO fields.
 */
export const SITE_BRAND_NAME = "Zentro" as const;
export const SITE_PRIMARY_DOMAIN = "zentro.run" as const;
export const SITE_LEGAL_NAME = "Zentro, Inc." as const;

export const SITE_MARKETING_TITLE =
  "Zentro — Incident Command, Guarded Automation, and Audit Evidence" as const;

export const SITE_MARKETING_DESCRIPTION =
  "Zentro brings incident response, guarded automation, service context, and audit evidence into one workspace. Built for platform, SRE, SOC, and GRC teams that need accountable operations." as const;

export const SITE_MARKETING_TWITTER_DESCRIPTION =
  "Incident command, guarded automation, service context, and audit-ready evidence for accountable operations teams." as const;

export const SITE_TAGLINE =
  "Accountable operations for incidents, automation, and evidence." as const;

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
