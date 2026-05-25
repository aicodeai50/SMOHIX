import { NextResponse } from "next/server";

import { getDeploymentProfileForOrg } from "@/lib/deployment/profile";
import { getOrgContextForUser } from "@/lib/org/context";
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
  if (!orgContext.orgId) {
    return NextResponse.json(
      { error: "No active organization." },
      { status: 404, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const profile = await getDeploymentProfileForOrg(orgContext.orgId, orgContext.orgName ?? "Organization");
  if (!profile) {
    return NextResponse.json(
      { error: "Profile not found." },
      { status: 404, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  return NextResponse.json({ profile }, { status: 200, headers: OPERATIONAL_RESPONSE_HEADERS });
}
