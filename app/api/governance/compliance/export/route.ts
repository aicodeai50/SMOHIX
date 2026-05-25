import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import { auditSinceIsoFromWindow, auditWindowToSinceIso } from "@/lib/audit/export-window";
import {
  buildComplianceEvidencePack,
  complianceEvidencePackToCsv,
} from "@/lib/compliance/export";
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

  const windowNorm = auditWindowToSinceIso(req.nextUrl.searchParams.get("window"));
  const sinceIso = auditSinceIsoFromWindow(windowNorm);
  const format = req.nextUrl.searchParams.get("format")?.trim().toLowerCase() ?? "csv";

  const orgContext = await getOrgContextForUser(user.id);

  const pack = await buildComplianceEvidencePack(user.id, {
    sinceIso,
    windowLabel: windowNorm,
    orgId: orgContext.orgId,
    supabase,
  });
  if (!pack) {
    return NextResponse.json(
      { error: "Could not build export." },
      { status: 500, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  await appendAuditEvent({
    event_type: "governance.compliance_exported",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      window: windowNorm,
      format,
      audit_events: pack.auditEvents.length,
      coverage_percent: pack.summary.coveragePercent,
    },
  });

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  if (format === "json") {
    return NextResponse.json(pack, {
      status: 200,
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Disposition": `attachment; filename="compliance-evidence-${windowNorm}-${stamp}.json"`,
      },
    });
  }

  const csv = complianceEvidencePackToCsv(pack);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      ...OPERATIONAL_RESPONSE_HEADERS,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="compliance-evidence-${windowNorm}-${stamp}.csv"`,
    },
  });
}
