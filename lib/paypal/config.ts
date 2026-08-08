export type PayPalMode = "sandbox" | "live";

export function getPayPalMode(): PayPalMode {
  const mode = process.env.PAYPAL_MODE?.trim().toLowerCase();
  return mode === "live" ? "live" : "sandbox";
}

export function getPayPalApiBase(): string {
  return getPayPalMode() === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function getPayPalClientId(): string | undefined {
  return process.env.PAYPAL_CLIENT_ID?.trim() || undefined;
}

export function getPayPalClientSecret(): string | undefined {
  return process.env.PAYPAL_CLIENT_SECRET?.trim() || undefined;
}

export function isPayPalConfigured(): boolean {
  return Boolean(getPayPalClientId() && getPayPalClientSecret());
}

/** PayPal subscription plan IDs — create in PayPal dashboard */
export function getPayPalPlanId(tier: "pro" | "team"): string | undefined {
  const key =
    tier === "pro" ? "PAYPAL_PLAN_ID_PRO" : "PAYPAL_PLAN_ID_TEAM";
  return process.env[key]?.trim() || undefined;
}

export function getPayPalWebhookId(): string | undefined {
  return process.env.PAYPAL_WEBHOOK_ID?.trim() || undefined;
}

export { getSmohixOwnApiUrl } from "@/lib/backend-urls";
