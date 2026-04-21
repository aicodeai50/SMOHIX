import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  ingestAlertCreateIncident,
  normalizeAlertIngestPayload,
  resolveAlertIngestUserId,
  type AlertIngestPayload,
} from "@/lib/integrations/alert-ingest";
import { verifyAlertWebhookSignature } from "@/lib/integrations/alert-webhook-verify";
import { clientIpFromRequest, takeToken } from "@/lib/rate-limit/memory";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = clientIpFromRequest(req);
  const rl = takeToken(`alert-ingest:${ip}`, 120, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", retry_after_sec: rl.retryAfterSec },
      { status: 429 },
    );
  }

  const auth = req.headers.get("authorization");
  const m = auth?.match(/^Bearer\s+(\S+)/i);
  const token = m?.[1]?.trim();
  if (!token) {
    return NextResponse.json(
      { error: "unauthorized", message: "Send Authorization: Bearer <ingest_token>." },
      { status: 401 },
    );
  }

  const resolved = await resolveAlertIngestUserId(token);
  if (!resolved.ok) {
    return NextResponse.json(
      { error: "unauthorized", message: resolved.message },
      { status: resolved.status },
    );
  }

  const rawBody = await req.text();
  const signingSecret = process.env.SHYNVO_ALERT_WEBHOOK_SIGNING_SECRET?.trim();
  if (signingSecret) {
    const signatureHeader = req.headers.get("x-shynvo-signature");
    const timestampHeader = req.headers.get("x-shynvo-signature-timestamp");
    const ok = verifyAlertWebhookSignature({
      rawBody,
      signatureHeader,
      timestampHeader,
      signingSecret,
    });
    if (!ok) {
      return NextResponse.json(
        {
          error: "unauthorized",
          message:
            "Invalid alert webhook signature. Expected X-Shynvo-Signature HMAC-SHA256.",
        },
        { status: 401 },
      );
    }
  }

  let body: unknown;
  try {
    body = rawBody ? (JSON.parse(rawBody) as unknown) : {};
  } catch {
    return NextResponse.json({ error: "invalid_json", message: "Body must be JSON." }, { status: 400 });
  }

  const result = await ingestAlertCreateIncident(
    resolved.userId,
    resolved.tokenId,
    normalizeAlertIngestPayload(
      body as AlertIngestPayload,
      req.headers.get("x-shynvo-alert-source") ?? req.headers.get("user-agent"),
    ),
  );

  if (!result.ok) {
    return NextResponse.json({ error: "ingest_failed", message: result.message }, { status: result.status });
  }

  return NextResponse.json(
    {
      incident_id: result.id,
      duplicate: result.duplicate,
    },
    { status: result.duplicate ? 200 : 201 },
  );
}
