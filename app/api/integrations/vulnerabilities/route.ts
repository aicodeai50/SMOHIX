import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  ingestVulnerabilityFinding,
  resolveAlertIngestUserId,
} from "@/lib/vulnerabilities/ingest";
import { verifyAlertWebhookSignature } from "@/lib/integrations/alert-webhook-verify";
import { clientIpFromRequest, takeToken } from "@/lib/rate-limit/memory";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = clientIpFromRequest(req);
  const rl = await takeToken(`vuln-ingest:${ip}`, 120, 60_000);
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
  const signingSecret = (process.env.SMOHIX_ALERT_WEBHOOK_SIGNING_SECRET ?? process.env.ZENTRO_ALERT_WEBHOOK_SIGNING_SECRET)?.trim();
  if (signingSecret) {
    const signatureHeader = req.headers.get("x-zentro-signature");
    const timestampHeader = req.headers.get("x-zentro-signature-timestamp");
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
            "Invalid webhook signature. Expected X-Zentro-Signature HMAC-SHA256.",
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

  const sourceHint =
    req.headers.get("x-zentro-vuln-source") ??
    req.headers.get("x-zentro-alert-source") ??
    req.headers.get("user-agent");

  const penTestEngagementId = req.headers.get("x-zentro-pen-test-engagement")?.trim() || null;

  const result = await ingestVulnerabilityFinding(
    resolved.userId,
    resolved.tokenId,
    body,
    sourceHint,
    { penTestEngagementId },
  );

  if (!result.ok) {
    return NextResponse.json({ error: "ingest_failed", message: result.message }, { status: result.status });
  }

  return NextResponse.json(
    {
      finding_id: result.findingId,
      incident_id: result.incidentId,
      duplicate: result.duplicate,
      opened_incident: result.openedIncident,
      pen_test_engagement_id: result.penTestEngagementId,
      pen_test_rolled_up: result.penTestRolledUp,
    },
    { status: result.duplicate ? 200 : 201 },
  );
}
