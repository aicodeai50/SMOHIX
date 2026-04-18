/**
 * Minimal JSON:API style parsing for Lemon Squeezy webhooks.
 * @see https://docs.lemonsqueezy.com/help/webhooks/webhook-requests
 */

export type LemonMeta = {
  event_name?: string;
  custom_data?: Record<string, unknown>;
};

export type LemonResource<T extends string = string> = {
  type?: T;
  id?: string;
  attributes?: Record<string, unknown>;
};

export type LemonWebhookPayload = {
  meta?: LemonMeta;
  data?: LemonResource;
};

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function asNumberString(v: unknown): string | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "string" && v.length > 0) return v;
  return undefined;
}

/** Checkout custom data: pass `{ "shynvo_user_id": "<auth uuid>" }` from your app. */
export function extractShynvoUserId(meta: LemonMeta | undefined): string | undefined {
  const raw = meta?.custom_data?.shynvo_user_id ?? meta?.custom_data?.supabase_user_id;
  const s = asString(raw);
  if (!s) return undefined;
  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.exec(
      s.trim(),
    );
  return uuid ? s.trim() : undefined;
}

export function parseWebhookJson(raw: string): LemonWebhookPayload | null {
  try {
    return JSON.parse(raw) as LemonWebhookPayload;
  } catch {
    return null;
  }
}

export type SubscriptionAttributes = {
  store_id?: string;
  customer_id?: string;
  order_id?: string;
  product_id?: string;
  variant_id?: string;
  status?: string;
  renews_at?: string | null;
  ends_at?: string | null;
  trial_ends_at?: string | null;
  user_email?: string;
};

export function normalizeSubscriptionAttributes(
  attrs: Record<string, unknown> | undefined,
): SubscriptionAttributes {
  if (!attrs) return {};
  return {
    store_id: asNumberString(attrs.store_id),
    customer_id: asNumberString(attrs.customer_id),
    order_id: asNumberString(attrs.order_id),
    product_id: asNumberString(attrs.product_id),
    variant_id: asNumberString(attrs.variant_id),
    status: asString(attrs.status),
    renews_at: attrs.renews_at === null ? null : asString(attrs.renews_at),
    ends_at: attrs.ends_at === null ? null : asString(attrs.ends_at),
    trial_ends_at: attrs.trial_ends_at === null ? null : asString(attrs.trial_ends_at),
    user_email: asString(attrs.user_email),
  };
}

export function isSubscriptionResource(
  data: LemonResource | undefined,
): data is LemonResource<"subscriptions"> {
  return data?.type === "subscriptions" && typeof data.id === "string" && data.id.length > 0;
}
