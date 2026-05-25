import { NextResponse } from "next/server";

import { getOrgContextForUser } from "@/lib/org/context";
import { getErrorBudgetOverviewSummary } from "@/lib/services/slo";
import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
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
  const summary = await getErrorBudgetOverviewSummary(supabase, user.id, orgContext.orgId);
  return NextResponse.json({ summary }, { status: 200, headers: OPERATIONAL_RESPONSE_HEADERS });
}
