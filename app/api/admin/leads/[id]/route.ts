import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { listLeadActivity } from "@/lib/revops/activity";
import { getLeadById, updateLeadWithActivity } from "@/lib/revops/leads";
import {
  parseLeadPriority,
  parseLeadStatus,
} from "@/lib/revops/types";
import { requirePlatformAdmin } from "@/lib/platform/admin";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: auth.status });
  }

  const { id } = await context.params;
  const lead = await getLeadById(id);
  if (!lead) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const activity = await listLeadActivity(id);

  return NextResponse.json({
    lead: mapLead(lead),
    activity: activity.map((a) => ({
      id: a.id,
      createdAt: a.created_at,
      actorEmail: a.actor_email,
      eventType: a.event_type,
      summary: a.summary,
      metadata: a.metadata,
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
  const status = raw.status ? parseLeadStatus(String(raw.status)) : undefined;
  if (raw.status && !status) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }
  const priority = raw.priority ? parseLeadPriority(String(raw.priority)) : undefined;
  if (raw.priority && !priority) {
    return NextResponse.json({ error: "invalid_priority" }, { status: 400 });
  }

  const ok = await updateLeadWithActivity(
    id,
    {
      status: status ?? undefined,
      notes: raw.notes !== undefined ? (raw.notes ? String(raw.notes) : null) : undefined,
      assignedTo:
        raw.assignedTo !== undefined
          ? raw.assignedTo
            ? String(raw.assignedTo)
            : null
          : undefined,
      nextAction:
        raw.nextAction !== undefined
          ? raw.nextAction
            ? String(raw.nextAction)
            : null
          : undefined,
      followUpDate:
        raw.followUpDate !== undefined
          ? raw.followUpDate
            ? String(raw.followUpDate)
            : null
          : undefined,
      priority: priority ?? undefined,
      sourceLabel:
        raw.sourceLabel !== undefined
          ? raw.sourceLabel
            ? String(raw.sourceLabel)
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

  if (raw.contactAttempted === true) {
    const { recordLeadActivity } = await import("@/lib/revops/activity");
    await recordLeadActivity({
      leadId: id,
      actorEmail: auth.email,
      eventType: "contact_attempted",
      summary: "Contact attempt recorded",
    });
  }

  if (!ok) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

function mapLead(r: Awaited<ReturnType<typeof getLeadById>>) {
  if (!r) return null;
  return {
    id: r.id,
    referenceId: r.public_reference,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    name: r.name,
    email: r.email,
    company: r.company,
    country: r.country,
    inquiryType: r.inquiry_type,
    problemSummary: r.problem_summary,
    budgetRange: r.budget_range,
    timeline: r.timeline,
    productContext: r.product_context,
    pilotCategory: r.pilot_category,
    status: r.status,
    assignedTo: r.assigned_to,
    notes: r.notes,
    nextAction: r.next_action,
    followUpDate: r.follow_up_date,
    priority: r.priority,
    sourceLabel: r.source_label,
    sourcePath: r.source_path,
    discoveryCallDate: r.discovery_call_date,
    pilotKickoffDate: r.pilot_kickoff_date,
    reviewMeetingDate: r.review_meeting_date,
    pilotProjectId: r.pilot_project_id,
    metadata: r.metadata,
  };
}
