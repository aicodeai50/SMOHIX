import { NextResponse } from "next/server";

import { listAuditEntriesForUser } from "@/lib/audit/data";
import { getLatestAuditWhisperForIncident } from "@/lib/audit/whispers";
import { getLatestDryRunForIncident } from "@/lib/automations/dry-runs-db";
import { getIncidentForUser } from "@/lib/incidents/data";
import { getIncidentTimeline } from "@/lib/incidents/timeline";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  if (!hasSupabaseAuth()) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const { id } = await ctx.params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const resolved = await getIncidentForUser(user.id, id, null);
  if (!resolved || resolved.source !== "database") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const [timeline, latestDryRun, latestWhisper, audit] = await Promise.all([
    getIncidentTimeline({
      source: "database",
      userId: user.id,
      incidentId: id,
      devTenantKey: null,
    }),
    getLatestDryRunForIncident(supabase, user.id, id),
    getLatestAuditWhisperForIncident(user.id, id),
    listAuditEntriesForUser(user.id),
  ]);
  const incidentAuditRows = audit.rows.filter((row) => row.incidentId === id);

  const payload = {
    generated_at: new Date().toISOString(),
    incident: resolved.row,
    timeline,
    latest_dry_run: latestDryRun,
    latest_audit_whisper: latestWhisper,
    audit_rows: incidentAuditRows,
    summary: {
      timeline_events: timeline.length,
      audit_events: incidentAuditRows.length,
      has_dry_run: Boolean(latestDryRun),
      has_whisper: Boolean(latestWhisper),
    },
  };

  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "incident";
  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "Content-Disposition": `attachment; filename="incident-${safe}-evidence.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
