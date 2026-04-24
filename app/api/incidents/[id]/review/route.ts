import { NextResponse } from "next/server";

import { listAuditEntriesForUser } from "@/lib/audit/data";
import { getLatestAuditWhisperForIncident } from "@/lib/audit/whispers";
import { getLatestDryRunForIncident } from "@/lib/automations/dry-runs-db";
import { getIncidentForUser } from "@/lib/incidents/data";
import { incidentReviewToMarkdown } from "@/lib/incidents/review-markdown";
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

  const markdown = incidentReviewToMarkdown({
    incident: resolved.row,
    timeline,
    latestDryRun,
    latestWhisper,
    auditRows: incidentAuditRows,
  });
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "incident";

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="incident-${safe}-review.md"`,
      "Cache-Control": "private, no-store",
    },
  });
}
