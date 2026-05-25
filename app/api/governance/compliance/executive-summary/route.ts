import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  buildGrcExecutiveSummary,
  grcExecutiveSummaryToCsv,
  grcExecutiveSummaryToHtml,
  grcExecutiveSummaryToMarkdown,
} from "@/lib/compliance/grc-executive-summary";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
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

  const pack = await buildGrcExecutiveSummary(user.id, {
    orgId: orgContext.orgId,
    orgName: orgContext.orgName,
    periodDays: Number.isFinite(periodDays) ? periodDays : 30,
    auditorReadOnly: isAuditorWorkspaceRole(orgContext.role),
    supabase,
  });

  if (!pack) {
    return NextResponse.json(
      { error: "Could not build executive summary." },
      { status: 500, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  await appendAuditEvent({
    event_type: "governance.grc_executive_summary_exported",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      format,
      period_days: pack.periodDays,
      program_readiness: pack.programReadinessPercent,
      overall_risk_score: pack.overallRiskScore,
    },
  });

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const baseName = `grc-executive-summary-${stamp}`;

  if (format === "markdown" || format === "md") {
    return new NextResponse(grcExecutiveSummaryToMarkdown(pack), {
      status: 200,
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${baseName}.md"`,
      },
    });
  }

  if (format === "html") {
    return new NextResponse(grcExecutiveSummaryToHtml(pack), {
      status: 200,
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${baseName}.html"`,
      },
    });
  }

  if (format === "csv") {
    return new NextResponse(grcExecutiveSummaryToCsv(pack), {
      status: 200,
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${baseName}.csv"`,
      },
    });
  }

  return NextResponse.json(pack, {
    status: 200,
    headers: {
      ...OPERATIONAL_RESPONSE_HEADERS,
      "Content-Disposition": `attachment; filename="${baseName}.json"`,
    },
  });
}
