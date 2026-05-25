import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  buildObligationStaffingActionTrackerPack,
  buildStaffingCompletionReportHtml,
  obligationStaffingActionTrackerToCsv,
} from "@/lib/compliance/obligation-staffing-action-tracker";
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
  const horizonRaw = req.nextUrl.searchParams.get("horizonDays");
  const horizonDays = horizonRaw ? Number.parseInt(horizonRaw, 10) : 90;
  const format = req.nextUrl.searchParams.get("format")?.trim().toLowerCase() ?? "json";

  const pack = await buildObligationStaffingActionTrackerPack(user.id, {
    orgId: orgContext.orgId,
    horizonDays: Number.isFinite(horizonDays) ? horizonDays : 90,
    supabase,
  });

  if (!pack) {
    return NextResponse.json(
      { error: "Could not build staffing action tracker." },
      { status: 500, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  await appendAuditEvent({
    event_type: "governance.obligation_staffing_action_tracker_exported",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      format,
      open_count: pack.stats.open,
      proposed_count: pack.stats.proposed,
      peak_week_key: pack.peakWeekKey,
    },
  });

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  if (format === "csv") {
    return new NextResponse(obligationStaffingActionTrackerToCsv(pack), {
      status: 200,
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="staffing-actions-${stamp}.csv"`,
      },
    });
  }

  if (format === "html") {
    const orgName = orgContext.orgName ?? "Organization";
    const html = buildStaffingCompletionReportHtml(pack, orgName);
    return new NextResponse(html, {
      status: 200,
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="staffing-completion-${stamp}.html"`,
      },
    });
  }

  return NextResponse.json(pack, {
    status: 200,
    headers: OPERATIONAL_RESPONSE_HEADERS,
  });
}
