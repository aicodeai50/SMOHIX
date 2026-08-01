import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getLeadById } from "@/lib/revops/leads";
import { createPilotFromLead } from "@/lib/revops/pilots";
import { requirePlatformAdmin } from "@/lib/platform/admin";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: auth.status });
  }

  const { id } = await context.params;
  const lead = await getLeadById(id);
  if (!lead) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (lead.pilot_project_id) {
    return NextResponse.json({ error: "pilot_already_linked" }, { status: 409 });
  }

  let body: Record<string, unknown> = {};
  try {
    const parsed = await req.json();
    if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown>;
  } catch {
    /* optional body */
  }

  const pilot = await createPilotFromLead(lead, auth.email, {
    name: body.name ? String(body.name) : undefined,
    objective: body.objective ? String(body.objective) : undefined,
    scope: body.scope ? String(body.scope) : undefined,
    owner: body.owner ? String(body.owner) : undefined,
  });

  if (!pilot) {
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      pilot: {
        id: pilot.id,
        referenceId: pilot.public_reference,
        status: pilot.status,
      },
    },
    { status: 201 },
  );
}
