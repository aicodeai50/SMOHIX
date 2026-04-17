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

/** General inquiries (sales, partnerships, hello). */
export function getGeneralMailtoHref(): string {
  return "mailto:hi@shynvo.app?subject=Shynvo%20inquiry";
}

/** Product / billing / technical support. */
export function getSupportMailtoHref(): string {
  return "mailto:support@shynvo.app?subject=Shynvo%20support";
}

/** @deprecated Prefer getGeneralMailtoHref or getSupportMailtoHref */
export function getContactMailtoHref(): string {
  return getGeneralMailtoHref();
}
