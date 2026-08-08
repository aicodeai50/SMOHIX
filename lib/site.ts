import { SITE_PRIMARY_DOMAIN } from "@/lib/site-brand";

/** Apex domain (no `www`). Primary production host. */
export const SITE_DOMAIN = SITE_PRIMARY_DOMAIN;

/** Hard production origin used for SEO, sitemap, and Open Graph. */
export const PRODUCTION_SITE_URL = `https://${SITE_PRIMARY_DOMAIN}` as const;

/**
 * Hostnames that must never appear in public canonical / OG / sitemap URLs.
 * Includes the retired Zentro HQ domain so a stale NEXT_PUBLIC_SITE_URL cannot
 * leak into Search Console as the homepage canonical.
 */
const LEGACY_PUBLIC_SEO_HOSTS = new Set([
  "zentro.run",
  "www.zentro.run",
]);

function isLocalDevHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/**
 * Canonical site origin for metadata, Open Graph, JSON-LD, and absolute links.
 *
 * Production SEO always resolves to https://smohix.run — even if Railway still
 * has NEXT_PUBLIC_SITE_URL=https://zentro.run (common after rebrand) or a
 * *.up.railway.app preview URL.
 *
 * Localhost overrides are preserved for local development only.
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!fromEnv) {
    return PRODUCTION_SITE_URL;
  }

  try {
    const u = new URL(fromEnv.replace(/\/$/, ""));
    const h = u.hostname.toLowerCase();

    if (isLocalDevHost(h)) {
      return u.origin;
    }

    // Stale rebrand / preview hosts → production apex.
    if (
      LEGACY_PUBLIC_SEO_HOSTS.has(h) ||
      h.endsWith(".zentro.run") ||
      h.endsWith(".up.railway.app") ||
      h === `www.${SITE_DOMAIN}` ||
      h === SITE_DOMAIN
    ) {
      return PRODUCTION_SITE_URL;
    }

    // Unknown public hosts: do not invent alternate SEO origins.
    return PRODUCTION_SITE_URL;
  } catch {
    return PRODUCTION_SITE_URL;
  }
}

/** Absolute canonical URL for a public path (homepage uses trailing slash). */
export function getCanonicalUrl(path = "/"): string {
  const base = getSiteUrl().replace(/\/$/, "");
  if (!path || path === "/") {
    return `${base}/`;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized.replace(/\/$/, "")}`;
}
