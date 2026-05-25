/**
 * Lemon Squeezy checkout: paste your product/checkout URL from the Lemon dashboard.
 * Public so marketing CTAs can link to checkout without a server round-trip.
 */
export function getCheckoutUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL?.trim();
  return url || undefined;
}

/** Optional second product (e.g. Team) — separate Lemon checkout URL. */
export function getTeamCheckoutUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_LEMONSQUEEZY_TEAM_CHECKOUT_URL?.trim();
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

/** Paid checkout URL including `zentro_user_id` for webhook upsert. */
export function getCheckoutUrlForUser(userId: string): string | undefined {
  const base = getCheckoutUrl();
  if (!base) return undefined;
  return appendCheckoutCustomData(base, { zentro_user_id: userId });
}

/** Team checkout with `zentro_user_id` when team URL is set. */
export function getTeamCheckoutUrlForUser(userId: string): string | undefined {
  const base = getTeamCheckoutUrl();
  if (!base) return undefined;
  return appendCheckoutCustomData(base, { zentro_user_id: userId });
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

/** Single contact inbox for product, billing, security, and partnerships. */
export const SITE_EMAIL_CONTACT = "hi@zentro.run";

export type MailtoTopic =
  | "general"
  | "support"
  | "security"
  | "billing"
  | "abuse"
  | "enterprise";

const MAILTO_SUBJECTS: Record<MailtoTopic, string> = {
  general: "Zentro",
  support: "Zentro support",
  security: "Zentro security",
  billing: "Zentro billing",
  abuse: "Zentro abuse report",
  enterprise: "Zentro enterprise",
};

export function getMailtoHref(topic: MailtoTopic = "general"): string {
  return `mailto:${SITE_EMAIL_CONTACT}?subject=${encodeURIComponent(MAILTO_SUBJECTS[topic])}`;
}

export function getGeneralMailtoHref(): string {
  return getMailtoHref("general");
}

export function getSupportMailtoHref(): string {
  return getMailtoHref("support");
}

/** @deprecated Use getMailtoHref */
export function getContactMailtoHref(): string {
  return getGeneralMailtoHref();
}
