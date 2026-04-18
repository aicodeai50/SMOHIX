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

/**
 * Append Lemon Squeezy checkout custom data so webhooks can link `subscriptions.user_id`.
 * Pass the signed-in user’s UUID (same as `auth.users.id`).
 * @see https://docs.lemonsqueezy.com/help/checkout/passing-custom-data
 */
export function appendCheckoutCustomData(
  checkoutUrl: string,
  entries: Record<string, string>,
): string {
  const u = new URL(checkoutUrl);
  for (const [key, value] of Object.entries(entries)) {
    if (!key || !value) continue;
    u.searchParams.set(`checkout[custom][${key}]`, value);
  }
  return u.toString();
}

/** Paid checkout URL including `shynvo_user_id` for the webhook upsert. */
export function getCheckoutUrlForUser(userId: string): string | undefined {
  const base = getCheckoutUrl();
  if (!base) return undefined;
  return appendCheckoutCustomData(base, { shynvo_user_id: userId });
}

/**
 * Lemon Squeezy **Customer portal** (manage payment method, cancel, invoices).
 * Paste the URL from Lemon → Settings → Customer portal (or your hosted billing link).
 * Prefer `NEXT_PUBLIC_*` if you need it client-side; server reads both.
 */
export function getCustomerPortalUrl(): string | undefined {
  const pub = process.env.NEXT_PUBLIC_LEMONSQUEEZY_CUSTOMER_PORTAL_URL?.trim();
  const srv = process.env.LEMONSQUEEZY_CUSTOMER_PORTAL_URL?.trim();
  return pub || srv || undefined;
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
