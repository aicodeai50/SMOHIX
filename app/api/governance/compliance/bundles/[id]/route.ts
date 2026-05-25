import { NextResponse } from "next/server";

import { getEvidenceBundleForOrg } from "@/lib/compliance/evidence-bundle";
import { verifyEvidenceBundleManifest } from "@/lib/compliance/manifest";
import { getOrgContextForUser } from "@/lib/org/context";
import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  if (!hasSupabaseAuth()) {
    return NextResponse.json(
      { error: "Not configured." },
      { status: 503, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const { id } = await params;
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

  const resolved = await getEvidenceBundleForOrg(id, orgContext.orgId, { supabase });
  if (!resolved) {
    return NextResponse.json(
      { error: "Bundle not found or manifest invalid." },
      { status: 404, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  return NextResponse.json(
    {
      bundle: resolved.row,
      manifestValid: verifyEvidenceBundleManifest(resolved.row.manifest),
    },
    { status: 200, headers: OPERATIONAL_RESPONSE_HEADERS },
  );
}
