import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import { getOrgContextForUser } from "@/lib/org/context";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!hasSupabaseAuth()) {
    return NextResponse.json({ error: "auth_not_configured" }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const orgContext = await getOrgContextForUser(user.id);
  const summary = typeof body.summary === "string" ? body.summary.trim().slice(0, 500) : "";
  if (!summary) {
    return NextResponse.json({ error: "summary_required" }, { status: 400 });
  }

  const statusRaw = typeof body.status === "string" ? body.status.trim() : "succeeded";
  const status = ["started", "succeeded", "failed", "rolled_back"].includes(statusRaw)
    ? statusRaw
    : "succeeded";

  const { data, error } = await supabase
    .from("change_deploy_events")
    .insert({
      org_id: orgContext.orgId,
      user_id: user.id,
      incident_id: typeof body.incidentId === "string" ? body.incidentId : null,
      service_id: typeof body.serviceId === "string" ? body.serviceId : null,
      provider: typeof body.provider === "string" ? body.provider.slice(0, 80) : "manual",
      deployment_id: typeof body.deploymentId === "string" ? body.deploymentId.slice(0, 200) : null,
      commit_sha: typeof body.commitSha === "string" ? body.commitSha.slice(0, 80) : null,
      environment: typeof body.environment === "string" ? body.environment.slice(0, 120) : null,
      status,
      summary,
      occurred_at: typeof body.occurredAt === "string" ? body.occurredAt : new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "create_failed", message: error?.message ?? "insert failed" },
      { status: 400 },
    );
  }

  await appendAuditEvent({
    event_type: "change.deploy_event_ingested",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: { deploy_event_id: data.id, status },
  });

  return NextResponse.json({ ok: true, id: data.id });
}
