import { createHash } from "node:crypto";

import { appendAuditEvent } from "@/lib/audit/append";
import { verifyLemonSqueezySignature } from "@/lib/lemonsqueezy-verify";
import { extractShynvoUserId, parseWebhookJson } from "@/lib/lemonsqueezy/parse-webhook";
import { syncSubscriptionFromWebhook } from "@/lib/billing/sync-lemon-subscription";
import {
  claimWebhookDelivery,
  releaseWebhookDelivery,
} from "@/lib/billing/webhook-delivery";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { clientIpFromRequest, takeToken } from "@/lib/rate-limit/memory";

export const runtime = "nodejs";

const WEBHOOK_IP_LIMIT = 60;
const WEBHOOK_IP_WINDOW_MS = 60_000;

function deliveryIdFromBody(rawBody: string): string {
  return createHash("sha256").update(rawBody, "utf8").digest("hex");
}

/**
 * Lemon Squeezy → Settings → Webhooks → URL:
 * `https://shynvo.app/api/webhooks/lemonsqueezy`
 *
 * Env: `LEMONSQUEEZY_WEBHOOK_SIGNING_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`,
 * `SUPABASE_SERVICE_ROLE_KEY` (required to persist subscriptions).
 *
 * Checkout **custom data** must include `shynvo_user_id` = the signed-in user’s UUID
 * (same as `auth.users.id`) so webhooks can attach the subscription.
 */
export async function POST(request: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SIGNING_SECRET?.trim();
  if (!secret) {
    return Response.json(
      { error: "Webhook signing secret not configured" },
      { status: 501 },
    );
  }

  const ip = clientIpFromRequest(request);
  const ipRl = takeToken(`lemon_webhook:${ip}`, WEBHOOK_IP_LIMIT, WEBHOOK_IP_WINDOW_MS);
  if (!ipRl.ok) {
    return Response.json(
      { error: "Too_many_requests", retry_after: ipRl.retryAfterSec },
      {
        status: 429,
        headers: { "Retry-After": String(ipRl.retryAfterSec) },
      },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");
  if (!verifyLemonSqueezySignature(rawBody, signature, secret)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const headerEvent = request.headers.get("x-event-name")?.trim();
  const payload = parseWebhookJson(rawBody);
  if (!payload) {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName =
    headerEvent || payload.meta?.event_name?.trim() || "unknown";

  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    return Response.json(
      {
        error:
          "Database admin not configured — set SUPABASE_SERVICE_ROLE_KEY for webhook persistence",
      },
      { status: 503 },
    );
  }

  const deliveryId = deliveryIdFromBody(rawBody);
  const claimed = await claimWebhookDelivery(supabase, deliveryId, eventName);
  if (!claimed.ok) {
    return Response.json({ error: claimed.reason }, { status: 500 });
  }
  if (claimed.duplicate) {
    return Response.json({ received: true, duplicate: true, event: eventName });
  }

  try {
    const sync = await syncSubscriptionFromWebhook(supabase, eventName, payload);
    if (!sync.ok) {
      if (!sync.permanent) {
        await releaseWebhookDelivery(supabase, deliveryId);
        return Response.json(
          { received: false, event: eventName, error: sync.reason },
          { status: 500 },
        );
      }
      if (process.env.NODE_ENV === "development") {
        console.warn("[lemonsqueezy webhook] ignored", eventName, sync.reason);
      }
      return Response.json({
        received: true,
        ignored: true,
        event: eventName,
        reason: sync.reason,
      });
    }

    if (process.env.NODE_ENV === "development") {
      console.info("[lemonsqueezy webhook]", eventName, sync);
    }

    if (sync.action === "upserted" && sync.lemon_subscription_id) {
      const uid = extractShynvoUserId(payload.meta);
      if (uid) {
        await appendAuditEvent({
          event_type: "billing.subscription_synced",
          user_id: uid,
          details: {
            lemon_subscription_id: sync.lemon_subscription_id,
            webhook_event: eventName,
          },
        });
      }
    }

    return Response.json({
      received: true,
      event: eventName,
      subscription: sync,
    });
  } catch (e) {
    await releaseWebhookDelivery(supabase, deliveryId);
    const message = e instanceof Error ? e.message : "Webhook handler error";
    return Response.json({ error: message }, { status: 500 });
  }
}
