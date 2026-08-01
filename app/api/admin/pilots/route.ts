import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getLeadById } from "@/lib/revops/leads";
import { getPilotById, listPilots, createPilotFromLead } from "@/lib/revops/pilots";
import { parsePilotStatus } from "@/lib/revops/types";
import { requirePlatformAdmin } from "@/lib/platform/admin";

export const runtime = "nodejs";

function mapPilot(p: NonNullable<Awaited<ReturnType<typeof getPilotById>>>) {
  return {
    id: p.id,
    referenceId: p.public_reference,
    leadId: p.lead_id,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    name: p.name,
    organization: p.organization,
    contactName: p.contact_name,
    contactEmail: p.contact_email,
    category: p.category,
    relatedProduct: p.related_product,
    objective: p.objective,
    scope: p.scope,
    status: p.status,
    startDate: p.start_date,
    targetReviewDate: p.target_review_date,
    owner: p.owner,
    risks: p.risks,
    nextAction: p.next_action,
    notes: p.notes,
    discoveryCallDate: p.discovery_call_date,
    pilotKickoffDate: p.pilot_kickoff_date,
    reviewMeetingDate: p.review_meeting_date,
    metadata: p.metadata,
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
  const status = parsePilotStatus(searchParams.get("status"));
  const search = searchParams.get("q");
  const owner = searchParams.get("owner");

  const { rows, total } = await listPilots({ page, limit, status, search, owner });

  return NextResponse.json({
    pilots: rows.map(mapPilot),
    page,
    limit,
    total,
  });
}

export async function POST(req: NextRequest) {
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

  const { leadId } = body as { leadId?: string };
  if (!leadId) {
    return NextResponse.json({ error: "lead_id_required" }, { status: 400 });
  }

  const lead = await getLeadById(leadId);
  if (!lead) {
    return NextResponse.json({ error: "lead_not_found" }, { status: 404 });
  }

  const pilot = await createPilotFromLead(lead, auth.email);
  if (!pilot) {
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }

  return NextResponse.json({ pilot: mapPilot(pilot) }, { status: 201 });
}
