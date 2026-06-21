import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import { getOrgContextForUser } from "@/lib/org/context";
import { canCreateApprovalRequest } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  if (!hasSupabaseAuth()) {
    return NextResponse.json({ policies: [] });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const orgContext = await getOrgContextForUser(user.id);
  let query = supabase
    .from("automation_policy_versions")
    .select("id, playbook_id, version, status, policy_json, created_at, activated_at")
    .order("created_at", { ascending: false })
    .limit(100);

  query = orgContext.orgId ? query.or(`user_id.eq.${user.id},org_id.eq.${orgContext.orgId}`) : query.eq("user_id", user.id);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "list_failed", message: error.message }, { status: 400 });
  }

  return NextResponse.json({ policies: data ?? [] });
}

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

  const orgContext = await getOrgContextForUser(user.id);
  if (orgContext.role && !canCreateApprovalRequest(orgContext.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { playbookId?: unknown; policy?: unknown; status?: unknown };
  try {
    body = (await req.json()) as { playbookId?: unknown; policy?: unknown; status?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const playbookId = typeof body.playbookId === "string" ? body.playbookId.trim().slice(0, 160) : "";
  if (!playbookId || !body.policy || typeof body.policy !== "object") {
    return NextResponse.json({ error: "invalid_policy" }, { status: 400 });
  }

  const latest = await supabase
    .from("automation_policy_versions")
    .select("version")
    .eq("playbook_id", playbookId)
    .eq("user_id", user.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const version = Number(latest.data?.version ?? 0) + 1;
  const status = body.status === "active" ? "active" : "draft";

  const { data, error } = await supabase
    .from("automation_policy_versions")
    .insert({
      org_id: orgContext.orgId,
      user_id: user.id,
      playbook_id: playbookId,
      version,
      status,
      policy_json: body.policy,
      activated_at: status === "active" ? new Date().toISOString() : null,
    })
    .select("id, playbook_id, version, status")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "create_failed", message: error?.message ?? "insert failed" },
      { status: 400 },
    );
  }

  await appendAuditEvent({
    event_type: "automation.policy_version_created",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: { policy_id: data.id, playbook_id: playbookId, version, status },
  });

  return NextResponse.json(data);
}
