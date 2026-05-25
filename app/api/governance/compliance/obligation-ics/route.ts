import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import { buildComplianceObligationIcs } from "@/lib/compliance/compliance-obligation-ics";
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
  const horizonDays = horizonRaw ? Number.parseInt(horizonRaw, 10) : 365;

  const pack = await buildComplianceObligationIcs(user.id, {
    orgId: orgContext.orgId,
    horizonDays: Number.isFinite(horizonDays) ? horizonDays : 365,
    supabase,
  });

  if (!pack) {
    return NextResponse.json(
      { error: "Could not build obligation ICS." },
      { status: 500, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  await appendAuditEvent({
    event_type: "governance.compliance_obligation_ics_exported",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      horizon_days: pack.horizonDays,
      event_count: pack.eventCount,
    },
  });

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  return new NextResponse(pack.ics, {
    status: 200,
    headers: {
      ...OPERATIONAL_RESPONSE_HEADERS,
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="zentro-grc-obligations-${stamp}.ics"`,
    },
  });
}
