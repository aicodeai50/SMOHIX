import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  ingestAlertCreateIncident,
  resolveAlertIngestUserId,
  type AlertIngestPayload,
} from "@/lib/integrations/alert-ingest";
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json", message: "Body must be JSON." }, { status: 400 });
  }

  const result = await ingestAlertCreateIncident(
    resolved.userId,
    resolved.tokenId,
    body as AlertIngestPayload,
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
