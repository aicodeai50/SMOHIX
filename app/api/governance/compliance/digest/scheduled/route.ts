import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import { runComplianceDigestForOrg } from "@/lib/compliance/compliance-digest";
import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function siteOrigin(req: NextRequest): string {
  const env = process.env.ZENTRO_SITE_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "https://zentro.run";
}

/** Cron entrypoint: POST with `Authorization: Bearer <ZENTRO_DIGEST_CRON_SECRET>`. Body: `{ orgId, periodDays? }` */
export async function POST(req: NextRequest) {
  const secret = process.env.ZENTRO_DIGEST_CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "Cron not configured." },
      { status: 503, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  if (!hasSupabaseAuth()) {
    return NextResponse.json(
      { error: "Not configured." },
      { status: 503, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  let orgId = "";
  let periodDays = 30;
  try {
    const body = (await req.json()) as { orgId?: string; periodDays?: number };
    orgId = String(body.orgId ?? "").trim();
    if (body.periodDays !== undefined) {
      const parsed = Number.parseInt(String(body.periodDays), 10);
      if (Number.isFinite(parsed) && parsed > 0 && parsed <= 365) {
        periodDays = parsed;
      }
    }
  } catch {
    return NextResponse.json(
      { error: "invalid_json" },
      { status: 400, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  if (!orgId) {
    return NextResponse.json(
      { error: "orgId required." },
      { status: 400, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const admin = createServiceSupabaseClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Service role unavailable." },
      { status: 503, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const { data: owner } = await admin
    .from("organization_members")
    .select("user_id")
    .eq("org_id", orgId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();

  const actorId = (owner?.user_id as string | null) ?? null;
  if (!actorId) {
    return NextResponse.json(
      { error: "No org owner found." },
      { status: 404, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const result = await runComplianceDigestForOrg(actorId, orgId, {
    periodDays,
    siteOrigin: siteOrigin(req),
    supabase: admin,
    scheduled: true,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason },
      { status: 400, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  await appendAuditEvent({
    event_type: "governance.compliance_digest_delivered",
    user_id: actorId,
    org_id: orgId,
    details: {
      delivery_id: result.delivery.id,
      scheduled: true,
      webhook_delivered: result.webhookDelivered,
      overall_readiness_percent: result.digest.summary.overallReadinessPercent,
    },
  });

  return NextResponse.json(
    {
      delivery: result.delivery,
      webhookDelivered: result.webhookDelivered,
    },
    { status: 201, headers: OPERATIONAL_RESPONSE_HEADERS },
  );
}
