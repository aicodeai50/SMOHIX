/**
 * Lemon Squeezy checkout: paste your product/checkout URL from the Lemon dashboard.
 * Public so marketing CTAs can link to checkout without a server round-trip.
 */
export function getCheckoutUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL?.trim();
  return url || undefined;
}

/** Primary trial CTA: Lemon checkout when configured, else in-page anchor. */
export function getTrialHref(): string {
  return getCheckoutUrl() ?? "#trial";
}

/** General / contact (hello, partnerships, sales). */
export const SITE_EMAIL_CONTACT = "hi@shynvo.app";

/** Product, billing, and technical support. */
export const SITE_EMAIL_SUPPORT = "support@shynvo.app";

export function getGeneralMailtoHref(): string {
  return `mailto:${SITE_EMAIL_CONTACT}?subject=${encodeURIComponent("Shynvo inquiry")}`;
}

export function getSupportMailtoHref(): string {
  return `mailto:${SITE_EMAIL_SUPPORT}?subject=${encodeURIComponent("Shynvo support")}`;
}

/** @deprecated Prefer getGeneralMailtoHref or getSupportMailtoHref */
export function getContactMailtoHref(): string {
  return getGeneralMailtoHref();
}
