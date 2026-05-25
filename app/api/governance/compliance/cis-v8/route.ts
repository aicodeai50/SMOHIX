import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buildCisV8AssessmentReport } from "@/lib/compliance/cis-v8-assessment";
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

  const report = await buildCisV8AssessmentReport(user.id, {
    orgId: orgContext.orgId,
    periodDays: Number.isFinite(periodDays) ? periodDays : 30,
    auditorReadOnly: isAuditorWorkspaceRole(orgContext.role),
    supabase,
  });

  if (!report) {
    return NextResponse.json(
      { error: "Could not build report." },
      { status: 500, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  return NextResponse.json({ report }, { status: 200, headers: OPERATIONAL_RESPONSE_HEADERS });
}
