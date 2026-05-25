import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import { runComplianceDigestForOrg } from "@/lib/compliance/compliance-digest";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function siteOrigin(req: NextRequest): string {
  const env = process.env.ZENTRO_SITE_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "https://zentro.run";
}

/** Manual digest run for org admins. POST body optional: `{ periodDays?: number }` */
export async function POST(req: NextRequest) {
  if (!hasSupabaseAuth()) {
    return NextResponse.json(
      { error: "Not configured." },
      { status: 503, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    return NextResponse.json(
      { error: "Forbidden." },
      { status: 403, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  let periodDays = 30;
  try {
    const body = (await req.json().catch(() => ({}))) as { periodDays?: number };
    if (body.periodDays !== undefined) {
      const parsed = Number.parseInt(String(body.periodDays), 10);
      if (Number.isFinite(parsed) && parsed > 0 && parsed <= 365) {
        periodDays = parsed;
      }
    }
  } catch {
    /* empty body ok */
  }

  const result = await runComplianceDigestForOrg(user.id, orgContext.orgId, {
    periodDays,
    siteOrigin: siteOrigin(req),
    supabase,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason },
      { status: 400, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  await appendAuditEvent({
    event_type: "governance.compliance_digest_delivered",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      delivery_id: result.delivery.id,
      webhook_delivered: result.webhookDelivered,
      overall_readiness_percent: result.digest.summary.overallReadinessPercent,
      overdue_attestations: result.digest.summary.overdueAttestations,
    },
  });

  return NextResponse.json(
    {
      delivery: result.delivery,
      webhookDelivered: result.webhookDelivered,
      digest: result.digest,
    },
    { status: 201, headers: OPERATIONAL_RESPONSE_HEADERS },
  );
}
