import { createHash } from "node:crypto";

import { appendAuditEvent } from "@/lib/audit/append";
import { syncPayPalSubscription, recordTopUpCapture } from "@/lib/billing/plan";
import {
  claimWebhookDelivery,
  releaseWebhookDelivery,
} from "@/lib/billing/webhook-delivery";
import { capturePayPalOrder, getPayPalAccessToken } from "@/lib/paypal/client";
import { getPayPalWebhookId, isPayPalConfigured } from "@/lib/paypal/config";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { clientIpFromRequest, takeToken } from "@/lib/rate-limit/memory";

export const runtime = "nodejs";

const WEBHOOK_IP_LIMIT = 60;
const WEBHOOK_IP_WINDOW_MS = 60_000;

function deliveryIdFromBody(rawBody: string): string {
  return createHash("sha256").update(rawBody, "utf8").digest("hex");
}

async function verifyPayPalWebhook(
  rawBody: string,
  headers: Headers,
): Promise<boolean> {
  const webhookId = getPayPalWebhookId();
  if (!webhookId) {
    return process.env.NODE_ENV !== "production";
  }

  const transmissionId = headers.get("paypal-transmission-id");
  const transmissionTime = headers.get("paypal-transmission-time");
  const certUrl = headers.get("paypal-cert-url");
  const authAlgo = headers.get("paypal-auth-algo");
  const transmissionSig = headers.get("paypal-transmission-sig");

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return false;
  }

  const token = await getPayPalAccessToken();
  const base =
    process.env.PAYPAL_MODE === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

  const res = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
  });

  if (!res.ok) return false;
  const data = (await res.json()) as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}

/**
 * PayPal Webhooks → URL: https://zentro.run/api/webhooks/paypal
 * Env: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_WEBHOOK_ID, SUPABASE_SERVICE_ROLE_KEY
 */
export async function POST(request: Request) {
  if (!isPayPalConfigured()) {
    return Response.json({ error: "PayPal not configured" }, { status: 501 });
  }

  const ip = clientIpFromRequest(request);
  const ipRl = await takeToken(`paypal_webhook:${ip}`, WEBHOOK_IP_LIMIT, WEBHOOK_IP_WINDOW_MS);
  if (!ipRl.ok) {
    return Response.json(
      { error: "Too_many_requests", retry_after: ipRl.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(ipRl.retryAfterSec) } },
    );
  }

  const rawBody = await request.text();
  const verified = await verifyPayPalWebhook(rawBody, request.headers);
  if (!verified) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    event_type?: string;
    resource?: Record<string, unknown>;
  };
  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = payload.event_type?.trim() || "unknown";
  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    return Response.json({ error: "Database admin not configured" }, { status: 503 });
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
    const resource = payload.resource ?? {};

    if (
      eventName === "BILLING.SUBSCRIPTION.ACTIVATED" ||
      eventName === "BILLING.SUBSCRIPTION.UPDATED" ||
      eventName === "BILLING.SUBSCRIPTION.RE-ACTIVATED"
    ) {
      const sync = await syncPayPalSubscription(supabase, {
        id: String(resource.id ?? ""),
        status: String(resource.status ?? "active"),
        custom_id: String(resource.custom_id ?? ""),
        plan_id: String(resource.plan_id ?? ""),
        billing_info: resource.billing_info as {
          next_billing_time?: string;
        },
      });
      if (!sync.ok) {
        await releaseWebhookDelivery(supabase, deliveryId);
        return Response.json({ error: sync.reason }, { status: 500 });
      }
    }

    if (eventName === "CHECKOUT.ORDER.APPROVED") {
      const orderId = String(resource.id ?? "");
      const customId = String(
        (resource.purchase_units as { custom_id?: string }[] | undefined)?.[0]
          ?.custom_id ?? "",
      );
      if (orderId && customId) {
        const capture = (await capturePayPalOrder(orderId)) as {
          purchase_units?: {
            payments?: {
              captures?: { id: string; amount?: { value: string; currency_code?: string } }[];
            };
          }[];
        };
        const cap = capture.purchase_units?.[0]?.payments?.captures?.[0];
        if (cap?.amount?.value) {
          const amountCents = Math.round(parseFloat(cap.amount.value) * 100);
          const sync = await recordTopUpCapture(supabase, {
            userId: customId,
            amountCents,
            orderId,
            captureId: cap.id,
            currency: cap.amount.currency_code,
          });
          if (!sync.ok) {
            await releaseWebhookDelivery(supabase, deliveryId);
            return Response.json({ error: sync.reason }, { status: 500 });
          }
          await appendAuditEvent({
            event_type: "billing.top_up",
            user_id: customId,
            details: { order_id: orderId, amount_cents: amountCents },
          });
        }
      }
    }

    if (eventName === "BILLING.SUBSCRIPTION.CANCELLED") {
      const subId = String(resource.id ?? "");
      const userId = String(resource.custom_id ?? "");
      if (subId) {
        await supabase
          .from("subscriptions")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("paypal_subscription_id", subId);
        if (userId) {
          await appendAuditEvent({
            event_type: "billing.subscription_cancelled",
            user_id: userId,
            details: { paypal_subscription_id: subId },
          });
        }
      }
    }

    return Response.json({ received: true, event: eventName });
  } catch (e) {
    await releaseWebhookDelivery(supabase, deliveryId);
    const message = e instanceof Error ? e.message : "Webhook handler error";
    return Response.json({ error: message }, { status: 500 });
  }
}
