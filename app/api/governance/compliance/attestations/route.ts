import { NextResponse } from "next/server";

import { listControlAttestationBoard } from "@/lib/compliance/attestation/data";
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
      { attestations: [] },
      { status: 200, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const attestations = await listControlAttestationBoard(user.id, orgContext.orgId, supabase);

  return NextResponse.json(
    { attestations },
    { status: 200, headers: OPERATIONAL_RESPONSE_HEADERS },
  );
}
