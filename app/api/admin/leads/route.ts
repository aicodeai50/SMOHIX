import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { listExtendedLeads, updateLeadWithActivity } from "@/lib/revops/leads";
import { parseLeadPriority, parseLeadStatus } from "@/lib/revops/types";
import { requirePlatformAdmin } from "@/lib/platform/admin";

export const runtime = "nodejs";

function mapLead(r: Awaited<ReturnType<typeof listExtendedLeads>>["rows"][number]) {
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

export async function GET(req: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: auth.status });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const inquiryType = searchParams.get("inquiry_type");
  const status = parseLeadStatus(searchParams.get("status"));
  const priority = parseLeadPriority(searchParams.get("priority"));
  const search = searchParams.get("q");
  const overdue = searchParams.get("overdue") === "1";

  const { rows, total } = await listExtendedLeads({
    page,
    limit,
    inquiryType,
    status,
    search,
    priority,
    overdueFollowUp: overdue,
  });

  return NextResponse.json({
    leads: rows.map(mapLead),
    page,
    limit,
    total,
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { id, status, notes, assignedTo, nextAction, followUpDate, priority } = body as {
    id?: string;
    status?: string;
    notes?: string | null;
    assignedTo?: string | null;
    nextAction?: string | null;
    followUpDate?: string | null;
    priority?: string;
  };

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id_required" }, { status: 400 });
  }

  const parsedStatus = status ? parseLeadStatus(status) : undefined;
  if (status && !parsedStatus) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }
  const parsedPriority = priority ? parseLeadPriority(priority) : undefined;
  if (priority && !parsedPriority) {
    return NextResponse.json({ error: "invalid_priority" }, { status: 400 });
  }

  const ok = await updateLeadWithActivity(
    id,
    {
      status: parsedStatus ?? undefined,
      notes: notes !== undefined ? (notes ? String(notes) : null) : undefined,
      assignedTo:
        assignedTo !== undefined ? (assignedTo ? String(assignedTo) : null) : undefined,
      nextAction: nextAction !== undefined ? (nextAction ? String(nextAction) : null) : undefined,
      followUpDate:
        followUpDate !== undefined ? (followUpDate ? String(followUpDate) : null) : undefined,
      priority: parsedPriority ?? undefined,
    },
    auth.email,
  );

  if (!ok) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
