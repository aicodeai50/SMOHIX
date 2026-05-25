import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  assessorEvidenceRequestsToCsv,
  buildAssessorEvidenceRequestPack,
} from "@/lib/compliance/assessor-evidence-requests";
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
  const format = req.nextUrl.searchParams.get("format")?.trim().toLowerCase() ?? "json";

  const pack = await buildAssessorEvidenceRequestPack(user.id, {
    orgId: orgContext.orgId,
    supabase,
  });

  if (!pack) {
    return NextResponse.json(
      { error: "Could not build assessor evidence request pack." },
      { status: 500, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  await appendAuditEvent({
    event_type: "governance.assessor_evidence_requests_exported",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      format,
      total: pack.totalCount,
      open: pack.openCount,
      overdue: pack.overdueCount,
      fulfilled: pack.fulfilledCount,
    },
  });

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  if (format === "csv") {
    return new NextResponse(assessorEvidenceRequestsToCsv(pack), {
      status: 200,
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="evidence-requests-${stamp}.csv"`,
      },
    });
  }

  return NextResponse.json(pack, {
    status: 200,
    headers: {
      ...OPERATIONAL_RESPONSE_HEADERS,
      "Content-Disposition": `attachment; filename="evidence-requests-${stamp}.json"`,
    },
  });
}
