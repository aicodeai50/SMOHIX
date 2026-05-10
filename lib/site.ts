import { SITE_PRIMARY_DOMAIN } from "@/lib/site-brand";

/** Apex domain (no `www`). Primary production host. */
export const SITE_DOMAIN = SITE_PRIMARY_DOMAIN;

/**
 * Canonical site origin. Used for metadata, Open Graph, and absolute links.
 * Override with `NEXT_PUBLIC_SITE_URL` on preview/staging if needed (no trailing slash).
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    const normalized = fromEnv.replace(/\/$/, "");
    try {
      const u = new URL(normalized);
      const h = u.hostname.toLowerCase();
      // Never emit Railway preview URLs in sitemap / JSON-LD / Open Graph (fixes wrong Google favicon/branding).
      if (h.endsWith(".up.railway.app")) {
        return `https://${SITE_DOMAIN}`;
      }
      if (h === `www.${SITE_DOMAIN}`) {
        return `https://${SITE_DOMAIN}`;
      }
      return normalized;
    } catch {
      return normalized;
    }
  }
  return `https://${SITE_DOMAIN}`;
}
