import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import { getIncidentForUser } from "@/lib/incidents/data";
import { createIncidentRcaRun } from "@/lib/incidents/rca";
import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  if (!hasSupabaseAuth()) {
    return NextResponse.json(
      { error: "Not configured." },
      { status: 503, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const { id } = await ctx.params;
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

  const resolved = await getIncidentForUser(user.id, id, null);
  if (!resolved || resolved.source !== "database") {
    return NextResponse.json(
      { error: "Not found." },
      { status: 404, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const run = await createIncidentRcaRun({
    supabase,
    userId: user.id,
    incident: resolved.row,
  });
  if (!run) {
    return NextResponse.json(
      { error: "Could not generate RCA." },
      { status: 500, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  await appendAuditEvent({
    user_id: user.id,
    event_type: "incident.rca_generated",
    details: {
      incident_id: id,
      confidence_score: run.confidenceScore,
      evidence_count: run.evidenceRefs.length,
      rca_run_id: run.id,
    },
  });

  return NextResponse.json(
    { run },
    {
      status: 200,
      headers: OPERATIONAL_RESPONSE_HEADERS,
    },
  );
}
