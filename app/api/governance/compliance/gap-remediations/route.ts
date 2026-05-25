import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buildComplianceGapRunbookQueue } from "@/lib/compliance/gap-remediation";
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
  if (!orgContext.orgId) {
    return NextResponse.json(
      { error: "No organization." },
      { status: 400, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const periodRaw = req.nextUrl.searchParams.get("periodDays");
  const periodDays = periodRaw ? Number.parseInt(periodRaw, 10) : 30;

  const queue = await buildComplianceGapRunbookQueue(user.id, orgContext.orgId, {
    periodDays: Number.isFinite(periodDays) ? periodDays : 30,
    supabase,
  });

  if (!queue) {
    return NextResponse.json(
      { error: "Could not build queue." },
      { status: 500, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  return NextResponse.json(queue, { status: 200, headers: OPERATIONAL_RESPONSE_HEADERS });
}
