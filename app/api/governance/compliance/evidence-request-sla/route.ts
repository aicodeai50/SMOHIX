import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  buildEvidenceRequestSlaDashboardPack,
  deliverEvidenceRequestSlaDigest,
  evidenceRequestSlaDashboardToCsv,
  getEvidenceRequestSlaOrgSettings,
} from "@/lib/compliance/evidence-request-sla-dashboard";
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

export async function GET(req: NextRequest) {
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
  const format = req.nextUrl.searchParams.get("format")?.trim().toLowerCase() ?? "json";

  const settings = orgContext.orgId
    ? await getEvidenceRequestSlaOrgSettings(orgContext.orgId, supabase)
    : null;

  const pack = await buildEvidenceRequestSlaDashboardPack(user.id, {
    orgId: orgContext.orgId,
    supabase,
  });

  if (!pack) {
    return NextResponse.json(
      { error: "Could not build evidence request SLA dashboard." },
      { status: 500, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  await appendAuditEvent({
    event_type: "governance.evidence_request_sla_dashboard_exported",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      format,
      overdue: pack.overdueCount,
      at_risk: pack.atRiskCount,
      fulfillment_rate: pack.fulfillmentRatePercent,
    },
  });

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  if (format === "csv") {
    return new NextResponse(evidenceRequestSlaDashboardToCsv(pack), {
      status: 200,
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="evidence-request-sla-${stamp}.csv"`,
      },
    });
  }

  return NextResponse.json(
    { settings, pack },
    {
      status: 200,
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Disposition": `attachment; filename="evidence-request-sla-${stamp}.json"`,
      },
    },
  );
}

/** Deliver auditor SLA digest (org admins and auditors). */
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
  const role = orgContext.role;
  const allowed =
    role &&
    (canManageMembers(role) || role === "auditor");
  if (!orgContext.orgId || !allowed) {
    return NextResponse.json(
      { error: "Forbidden." },
      { status: 403, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const result = await deliverEvidenceRequestSlaDigest(user.id, orgContext.orgId, {
    siteOrigin: siteOrigin(req),
    orgName: orgContext.orgName ?? undefined,
    supabase,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason },
      { status: 400, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  return NextResponse.json(result, { status: 201, headers: OPERATIONAL_RESPONSE_HEADERS });
}
