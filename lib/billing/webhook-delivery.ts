import type { SupabaseClient } from "@supabase/supabase-js";

const PG_UNIQUE_VIOLATION = "23505";

export type ClaimDeliveryResult =
  | { ok: true; duplicate: false }
  | { ok: true; duplicate: true }
  | { ok: false; reason: string };

/**
 * Claim a webhook delivery by `delivery_id` (SHA-256 of raw body).
 * Returns `duplicate: true` if this exact payload was already processed successfully.
 */
export async function claimWebhookDelivery(
  supabase: SupabaseClient,
  deliveryId: string,
  eventName: string,
): Promise<ClaimDeliveryResult> {
  const { error } = await supabase.from("webhook_event_deliveries").insert({
    delivery_id: deliveryId,
    event_name: eventName,
  });

  if (!error) {
    return { ok: true, duplicate: false };
  }

  if (error.code === PG_UNIQUE_VIOLATION) {
    return { ok: true, duplicate: true };
  }

  return { ok: false, reason: error.message };
}

export async function releaseWebhookDelivery(
  supabase: SupabaseClient,
  deliveryId: string,
): Promise<void> {
  await supabase.from("webhook_event_deliveries").delete().eq("delivery_id", deliveryId);
}
