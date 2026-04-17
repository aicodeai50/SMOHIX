import { verifyLemonSqueezySignature } from "@/lib/lemonsqueezy-verify";

export const runtime = "nodejs";

/**
 * Lemon Squeezy → Settings → Webhooks → URL:
 * `https://shynvo.app/api/webhooks/lemonsqueezy`
 *
 * Set `LEMONSQUEEZY_WEBHOOK_SIGNING_SECRET` to the signing secret from the webhook.
 * Handle `subscription_created`, `order_created`, etc. in your DB / auth layer next.
 */
export async function POST(request: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SIGNING_SECRET?.trim();
  if (!secret) {
    return Response.json(
      { error: "Webhook signing secret not configured" },
      { status: 501 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");
  if (!verifyLemonSqueezySignature(rawBody, signature, secret)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: { meta?: { event_name?: string } };
  try {
    payload = JSON.parse(rawBody) as { meta?: { event_name?: string } };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.meta?.event_name ?? "unknown";
  // TODO: persist license/subscription, provision tenant, send email, etc.
  if (process.env.NODE_ENV === "development") {
    console.info("[lemonsqueezy webhook]", event);
  }

  return Response.json({ received: true, event });
}
