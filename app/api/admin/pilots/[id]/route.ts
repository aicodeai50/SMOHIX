import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { listPilotActivity } from "@/lib/revops/activity";
import { getPilotById, updatePilotWithActivity } from "@/lib/revops/pilots";
import { parsePilotStatus } from "@/lib/revops/types";
import { requirePlatformAdmin } from "@/lib/platform/admin";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: auth.status });
  }

  const { id } = await context.params;
  const pilot = await getPilotById(id);
  if (!pilot) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const activity = await listPilotActivity(id);

  return NextResponse.json({
    pilot: {
      id: pilot.id,
      referenceId: pilot.public_reference,
      leadId: pilot.lead_id,
      createdAt: pilot.created_at,
      updatedAt: pilot.updated_at,
      name: pilot.name,
      organization: pilot.organization,
      contactName: pilot.contact_name,
      contactEmail: pilot.contact_email,
      category: pilot.category,
      relatedProduct: pilot.related_product,
      objective: pilot.objective,
      scope: pilot.scope,
      status: pilot.status,
      startDate: pilot.start_date,
      targetReviewDate: pilot.target_review_date,
      owner: pilot.owner,
      risks: pilot.risks,
      nextAction: pilot.next_action,
      notes: pilot.notes,
      discoveryCallDate: pilot.discovery_call_date,
      pilotKickoffDate: pilot.pilot_kickoff_date,
      reviewMeetingDate: pilot.review_meeting_date,
      metadata: pilot.metadata,
    },
    activity: activity.map((a) => ({
      id: a.id,
      createdAt: a.created_at,
      actorEmail: a.actor_email,
      eventType: a.event_type,
      summary: a.summary,
    })),
  });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: auth.status });
  }

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const status = raw.status ? parsePilotStatus(String(raw.status)) : undefined;
  if (raw.status && !status) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const ok = await updatePilotWithActivity(
    id,
    {
      name: raw.name ? String(raw.name) : undefined,
      objective: raw.objective !== undefined ? String(raw.objective) : undefined,
      scope: raw.scope !== undefined ? String(raw.scope) : undefined,
      status: status ?? undefined,
      owner: raw.owner !== undefined ? (raw.owner ? String(raw.owner) : null) : undefined,
      notes: raw.notes !== undefined ? (raw.notes ? String(raw.notes) : null) : undefined,
      nextAction:
        raw.nextAction !== undefined ? (raw.nextAction ? String(raw.nextAction) : null) : undefined,
      risks: raw.risks !== undefined ? (raw.risks ? String(raw.risks) : null) : undefined,
      startDate: raw.startDate !== undefined ? (raw.startDate ? String(raw.startDate) : null) : undefined,
      targetReviewDate:
        raw.targetReviewDate !== undefined
          ? raw.targetReviewDate
            ? String(raw.targetReviewDate)
            : null
          : undefined,
      discoveryCallDate:
        raw.discoveryCallDate !== undefined
          ? raw.discoveryCallDate
            ? String(raw.discoveryCallDate)
            : null
          : undefined,
      pilotKickoffDate:
        raw.pilotKickoffDate !== undefined
          ? raw.pilotKickoffDate
            ? String(raw.pilotKickoffDate)
            : null
          : undefined,
      reviewMeetingDate:
        raw.reviewMeetingDate !== undefined
          ? raw.reviewMeetingDate
            ? String(raw.reviewMeetingDate)
            : null
          : undefined,
    },
    auth.email,
  );

  if (!ok) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
