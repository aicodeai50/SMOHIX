import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import { getOrgContextForUser } from "@/lib/org/context";
import { canCreateApprovalRequest } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const PROVIDERS = new Set([
  "slack",
  "pagerduty",
  "jira",
  "servicenow",
  "github",
  "datadog",
  "prometheus",
]);

export async function GET() {
  if (!hasSupabaseAuth()) {
    return NextResponse.json({ connections: [], mode: "session" });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId) {
    return NextResponse.json({ connections: [], mode: "personal" });
  }

  const { data, error } = await supabase
    .from("integration_connections")
    .select("id, provider, status, display_name, last_checked_at, created_at, updated_at")
    .eq("org_id", orgContext.orgId)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "list_failed", message: error.message }, { status: 400 });
  }

  return NextResponse.json({ connections: data ?? [], mode: "org" });
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
  if (!orgContext.orgId || !orgContext.role || !canCreateApprovalRequest(orgContext.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let provider = "";
  let displayName = "";
  let status = "planned";
  try {
    const body = (await req.json()) as {
      provider?: unknown;
      displayName?: unknown;
      status?: unknown;
    };
    provider = typeof body.provider === "string" ? body.provider.trim().toLowerCase() : "";
    displayName = typeof body.displayName === "string" ? body.displayName.trim().slice(0, 120) : "";
    status = typeof body.status === "string" ? body.status.trim().toLowerCase() : "planned";
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!PROVIDERS.has(provider) || !displayName) {
    return NextResponse.json({ error: "invalid_connection" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("integration_connections")
    .insert({
      org_id: orgContext.orgId,
      provider,
      display_name: displayName,
      status: status === "configured" ? "configured" : "planned",
      created_by: user.id,
    })
    .select("id, provider, status, display_name, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "create_failed", message: error?.message ?? "insert failed" },
      { status: 400 },
    );
  }

  await appendAuditEvent({
    event_type: "integration.connection_created",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: { connection_id: data.id, provider },
  });

  return NextResponse.json(data);
}
