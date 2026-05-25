import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  buildEvidenceFreshnessDashboard,
  evidenceFreshnessToCsv,
} from "@/lib/compliance/evidence-freshness";
import { getOrgContextForUser } from "@/lib/org/context";
import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const periodRaw = req.nextUrl.searchParams.get("periodDays");
  const periodDays = periodRaw ? Number.parseInt(periodRaw, 10) : 30;
  const format = req.nextUrl.searchParams.get("format")?.trim().toLowerCase() ?? "json";

  const dashboard = await buildEvidenceFreshnessDashboard(user.id, {
    orgId: orgContext.orgId,
    periodDays: Number.isFinite(periodDays) ? periodDays : 30,
    supabase,
  });

  if (!dashboard) {
    return NextResponse.json(
      { error: "Could not build evidence freshness dashboard." },
      { status: 500, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  await appendAuditEvent({
    event_type: "governance.evidence_freshness_exported",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      format,
      period_days: dashboard.periodDays,
      stale_count: dashboard.summary.stale,
      none_count: dashboard.summary.none,
    },
  });

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  if (format === "csv") {
    const csv = evidenceFreshnessToCsv(dashboard);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="evidence-freshness-${stamp}.csv"`,
      },
    });
  }

  return NextResponse.json(dashboard, {
    status: 200,
    headers: {
      ...OPERATIONAL_RESPONSE_HEADERS,
      "Content-Disposition": `attachment; filename="evidence-freshness-${stamp}.json"`,
    },
  });
}
