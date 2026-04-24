/** Apex domain (no `www`). Primary production host. */
export const SITE_DOMAIN = "shynvo.app";

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
      if (u.hostname.toLowerCase() === `www.${SITE_DOMAIN}`) {
        return `https://${SITE_DOMAIN}`;
      }
      return normalized;
    } catch {
      return normalized;
    }
  }
  return `https://${SITE_DOMAIN}`;
}
