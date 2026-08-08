import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buildIcsFile, defaultEventDurationMs } from "@/lib/revops/calendar";
import { getPilotById } from "@/lib/revops/pilots";
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

  const eventType = req.nextUrl.searchParams.get("event") ?? "kickoff";
  const events: Parameters<typeof buildIcsFile>[0] = [];

  const addEvent = (dateStr: string | null, suffix: string, title: string) => {
    if (!dateStr) return;
    const start = new Date(dateStr);
    if (Number.isNaN(start.getTime())) return;
    events.push({
      uid: `${pilot.public_reference}-${suffix}@smohix.run`,
      title,
      description: `Pilot ${pilot.public_reference} — ${pilot.organization}`,
      start,
      end: new Date(start.getTime() + defaultEventDurationMs),
    });
  };

  if (eventType === "discovery" || eventType === "all") {
    addEvent(pilot.discovery_call_date, "discovery", `Discovery call — ${pilot.organization}`);
  }
  if (eventType === "kickoff" || eventType === "all") {
    addEvent(
      pilot.pilot_kickoff_date ?? pilot.start_date,
      "kickoff",
      `Pilot kickoff — ${pilot.organization}`,
    );
  }
  if (eventType === "review" || eventType === "all") {
    addEvent(
      pilot.review_meeting_date ?? pilot.target_review_date,
      "review",
      `Pilot review — ${pilot.organization}`,
    );
  }

  if (events.length === 0) {
    return NextResponse.json({ error: "no_dates_configured" }, { status: 400 });
  }

  const ics = buildIcsFile(events);
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${pilot.public_reference}-${eventType}.ics"`,
    },
  });
}
