import type { SupabaseClient } from "@supabase/supabase-js";

import {
  extractShynvoUserId,
  isSubscriptionResource,
  normalizeSubscriptionAttributes,
  type LemonWebhookPayload,
} from "@/lib/lemonsqueezy/parse-webhook";

const SUBSCRIPTION_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_expired",
  "subscription_resumed",
  "subscription_paused",
  "subscription_unpaused",
  "subscription_payment_success",
  "subscription_payment_failed",
]);

export type SyncSubscriptionResult =
  | { ok: true; action: "skipped" | "upserted"; lemon_subscription_id?: string }
  | { ok: false; reason: string; permanent?: boolean };

/**
 * Upserts a row in `public.subscriptions` from a Lemon subscription webhook.
 * Requires `shynvo_user_id` (or legacy `supabase_user_id`) in `meta.custom_data` to link `user_id`.
 */
export async function syncSubscriptionFromWebhook(
  supabase: SupabaseClient,
  eventName: string,
  payload: LemonWebhookPayload,
): Promise<SyncSubscriptionResult> {
  if (!SUBSCRIPTION_EVENTS.has(eventName)) {
    return { ok: true, action: "skipped" };
  }

  const data = payload.data;
  if (!isSubscriptionResource(data)) {
    return {
      ok: false,
      permanent: true,
      reason: "payload_missing_subscription_resource",
    };
  }

  const lemon_subscription_id = data.id;
  const attrs = normalizeSubscriptionAttributes(data.attributes);
  const userId = extractShynvoUserId(payload.meta);

  if (!userId) {
    return {
      ok: false,
      permanent: true,
      reason:
        "missing_custom_data_shynvo_user_id — add shynvo_user_id to Lemon checkout custom data",
    };
  }

  const status = attrs.status ?? "unknown";
  const row = {
    user_id: userId,
    lemon_subscription_id,
    lemon_customer_id: attrs.customer_id ?? null,
    lemon_order_id: attrs.order_id ?? null,
    lemon_product_id: attrs.product_id ?? null,
    lemon_variant_id: attrs.variant_id ?? null,
    status,
    renews_at: attrs.renews_at ?? null,
    ends_at: attrs.ends_at ?? null,
    trial_ends_at: attrs.trial_ends_at ?? null,
    raw_payload: payload as unknown as Record<string, unknown>,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("subscriptions").upsert(row, {
    onConflict: "lemon_subscription_id",
  });

  if (error) {
    return { ok: false, reason: error.message, permanent: false };
  }

  return { ok: true, action: "upserted", lemon_subscription_id };
}
