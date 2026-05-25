import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buildComplianceProgramDashboard } from "@/lib/compliance/program-dashboard";
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

  const dashboard = await buildComplianceProgramDashboard(user.id, {
    orgId: orgContext.orgId,
    periodDays: Number.isFinite(periodDays) ? periodDays : 30,
    auditorReadOnly: isAuditorWorkspaceRole(orgContext.role),
    supabase,
  });

  if (!dashboard) {
    return NextResponse.json(
      { error: "Could not build dashboard." },
      { status: 500, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  return NextResponse.json({ dashboard }, { status: 200, headers: OPERATIONAL_RESPONSE_HEADERS });
}
