import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { recordPilotActivity } from "@/lib/revops/activity";
import { getLeadById } from "@/lib/revops/leads";
import { getPilotById } from "@/lib/revops/pilots";
import { generatePilotProposal } from "@/lib/revops/proposal";
import { requirePlatformAdmin } from "@/lib/platform/admin";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: auth.status });
  }

  const { id } = await context.params;
  const pilot = await getPilotById(id);
  if (!pilot) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const lead = pilot.lead_id ? await getLeadById(pilot.lead_id) : null;
  const doc = generatePilotProposal(pilot, lead);

  const format = req.nextUrl.searchParams.get("format") ?? "json";

  await recordPilotActivity({
    pilotId: id,
    actorEmail: auth.email,
    eventType: "proposal_generated",
    summary: "Proposal draft generated",
  });

  if (format === "html") {
    return new NextResponse(doc.html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  if (format === "markdown") {
    return new NextResponse(doc.markdown, {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }

  return NextResponse.json({
    title: doc.title,
    markdown: doc.markdown,
    html: doc.html,
  });
}
