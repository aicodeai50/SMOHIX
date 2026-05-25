import { NextResponse } from "next/server";

import { runAttackPathSimulationForUser } from "@/lib/attack-paths/data";
import { getOrgContextForUser } from "@/lib/org/context";
import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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

  const url = new URL(req.url);
  const targetServiceId = url.searchParams.get("targetServiceId") ?? undefined;
  const maxDepthRaw = url.searchParams.get("maxDepth");
  const maxDepth = maxDepthRaw ? Number(maxDepthRaw) : undefined;

  const orgContext = await getOrgContextForUser(user.id);
  const result = await runAttackPathSimulationForUser(supabase, user.id, orgContext.orgId, {
    targetServiceId,
    maxDepth: Number.isFinite(maxDepth) ? maxDepth : undefined,
  });

  return NextResponse.json(result, { status: 200, headers: OPERATIONAL_RESPONSE_HEADERS });
}
