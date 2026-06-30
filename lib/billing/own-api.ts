import { getZentroOwnApiUrl } from "@/lib/backend-urls";

export type OwnApiBillingEvent = {
  userId: string;
  type: "subscription_activated" | "top_up" | "subscription_cancelled";
  amountCents?: number;
  tier?: "pro" | "team";
  paypalResourceId?: string;
};

/**
 * Notify ZENTRO-OWN-API of billing events when centralized billing is configured.
 * Failures are logged but do not block local webhook processing.
 */
export async function notifyOwnApiBilling(
  event: OwnApiBillingEvent,
): Promise<void> {
  const base = getZentroOwnApiUrl();
  if (!base) return;

  const secret = process.env.ZENTRO_OWN_API_SECRET?.trim();
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/v1/billing/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify(event),
    });
    if (!res.ok && process.env.NODE_ENV === "development") {
      console.warn("[own-api billing]", res.status, await res.text());
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[own-api billing] unreachable", e);
    }
  }
}
