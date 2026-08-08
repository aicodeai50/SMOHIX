import { getSiteUrl } from "@/lib/site";
import {
  createPayPalOrder,
  createPayPalSubscription,
  approvalUrlFromLinks,
} from "@/lib/paypal/client";
import { getPayPalPlanId, isPayPalConfigured } from "@/lib/paypal/config";

/** Single contact inbox for product, billing, security, and partnerships. */
export const SITE_EMAIL_CONTACT = "hi@smohix.run";

export type MailtoTopic =
  | "general"
  | "support"
  | "security"
  | "billing"
  | "abuse"
  | "enterprise";

const MAILTO_SUBJECTS: Record<MailtoTopic, string> = {
  general: "Smohix",
  support: "Smohix support",
  security: "Smohix security",
  billing: "Smohix billing",
  abuse: "Smohix abuse report",
  enterprise: "Smohix enterprise",
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

/** Whether PayPal billing is configured server-side */
export function isBillingConfigured(): boolean {
  return isPayPalConfigured();
}

/** Primary trial CTA: billing page when PayPal configured */
export function getTrialHref(): string {
  return isPayPalConfigured() ? "/settings/billing" : "#pricing";
}

/** @deprecated Lemon Squeezy — use PayPal checkout via /api/billing/checkout */
export function getCheckoutUrl(): string | undefined {
  return isPayPalConfigured() ? "/settings/billing?tier=pro" : undefined;
}

/** @deprecated Lemon Squeezy — use PayPal checkout via /api/billing/checkout */
export function getTeamCheckoutUrl(): string | undefined {
  return isPayPalConfigured() ? "/settings/billing?tier=team" : undefined;
}

/** @deprecated Use PayPal subscription flow */
export function appendCheckoutCustomData(
  checkoutUrl: string,
  entries: Record<string, string>,
): string {
  const u = new URL(checkoutUrl, "https://smohix.run");
  for (const [key, value] of Object.entries(entries)) {
    if (!key || !value) continue;
    u.searchParams.set(key, value);
  }
  return u.toString();
}

/** Billing page URL with tier pre-selected for signed-in users */
export function getCheckoutUrlForUser(userId: string): string | undefined {
  if (!isPayPalConfigured()) return undefined;
  return `/settings/billing?tier=pro&uid=${encodeURIComponent(userId)}`;
}

export function getTeamCheckoutUrlForUser(userId: string): string | undefined {
  if (!isPayPalConfigured()) return undefined;
  return `/settings/billing?tier=team&uid=${encodeURIComponent(userId)}`;
}

/** @deprecated PayPal manages subscriptions in-app */
export function getCustomerPortalUrl(): string | undefined {
  return isPayPalConfigured() ? "/settings/billing" : undefined;
}

export type CheckoutTier = "pro" | "team" | "top_up";

export type CreateCheckoutResult =
  | { ok: true; approvalUrl: string; resourceId: string; kind: "subscription" | "order" }
  | { ok: false; error: string };

/** Create PayPal subscription or top-up order for a user */
export async function createBillingCheckout(input: {
  userId: string;
  tier: CheckoutTier;
  topUpAmountCents?: number;
}): Promise<CreateCheckoutResult> {
  if (!isPayPalConfigured()) {
    return { ok: false, error: "PayPal not configured" };
  }

  const site = getSiteUrl();
  const returnUrl = `${site}/settings/billing?checkout=success`;
  const cancelUrl = `${site}/settings/billing?checkout=cancelled`;
  const customId = input.userId;

  if (input.tier === "top_up") {
    const amountCents = input.topUpAmountCents ?? 2500;
    if (amountCents < 500) {
      return { ok: false, error: "Minimum top-up is $5.00" };
    }
    try {
      const order = await createPayPalOrder({
        amountCents,
        description: "Smohix account balance top-up",
        customId,
        returnUrl,
        cancelUrl,
      });
      const approvalUrl = approvalUrlFromLinks(order.links);
      if (!approvalUrl) {
        return { ok: false, error: "No PayPal approval URL returned" };
      }
      return { ok: true, approvalUrl, resourceId: order.id, kind: "order" };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Checkout failed",
      };
    }
  }

  const planId = getPayPalPlanId(input.tier);
  if (!planId) {
    return {
      ok: false,
      error: `PayPal plan not configured for ${input.tier}`,
    };
  }

  try {
    const sub = await createPayPalSubscription({
      planId,
      customId,
      returnUrl,
      cancelUrl,
    });
    const approvalUrl = approvalUrlFromLinks(sub.links);
    if (!approvalUrl) {
      return { ok: false, error: "No PayPal approval URL returned" };
    }
    return { ok: true, approvalUrl, resourceId: sub.id, kind: "subscription" };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Checkout failed",
    };
  }
}
