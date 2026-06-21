import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  displayIngestPrefix,
  generateAlertIngestPlaintext,
  hashApiKeyPlaintext,
} from "@/lib/api-keys/token";
import { appendAuditEvent } from "@/lib/audit/append";
import { getBillingPlanForUser } from "@/lib/billing/plan";
import { getOrgContextForUser } from "@/lib/org/context";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export type AlertIngestTokenRow = {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export async function GET() {
  if (!hasSupabaseAuth()) {
    return NextResponse.json({ error: "not_configured" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const orgContext = await getOrgContextForUser(user.id);
  const plan = await getBillingPlanForUser(supabase, user.id, orgContext.orgId);
  if (plan === "free") {
    return NextResponse.json(
      { error: "subscription_required", message: "Alert ingest tokens require a paid plan." },
      { status: 403 },
    );
  }

  let query = supabase
    .from("alert_ingest_tokens")
    .select("id, name, key_prefix, created_at, last_used_at, revoked_at")
    .order("created_at", { ascending: false });

  query = orgContext.orgId ? query.or(`user_id.eq.${user.id},org_id.eq.${orgContext.orgId}`) : query.eq("user_id", user.id);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "list_failed", message: error.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ tokens: data ?? [] });
}

export async function POST(req: NextRequest) {
  let name = "Alert ingest";
  try {
    const body = (await req.json()) as { name?: unknown };
    if (typeof body?.name === "string" && body.name.trim()) {
      name = body.name.trim().slice(0, 80);
    }
  } catch {
    /* optional */
  }

  if (!hasSupabaseAuth()) {
    return NextResponse.json({ error: "not_configured" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const orgContext = await getOrgContextForUser(user.id);
  const plan = await getBillingPlanForUser(supabase, user.id, orgContext.orgId);
  if (plan === "free") {
    return NextResponse.json(
      { error: "subscription_required", message: "Alert ingest requires an active subscription." },
      { status: 403 },
    );
  }

  const plain = generateAlertIngestPlaintext();
  const key_prefix = displayIngestPrefix(plain);
  const secret_hash = hashApiKeyPlaintext(plain);

  const { data, error } = await supabase
    .from("alert_ingest_tokens")
    .insert({
      user_id: user.id,
      org_id: orgContext.orgId,
      name,
      key_prefix,
      secret_hash,
    })
    .select("id, name, key_prefix, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "create_failed", message: error?.message ?? "insert failed" },
      { status: 400 },
    );
  }

  await appendAuditEvent({
    event_type: "alert_ingest_token.created",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: { token_id: data.id, name: data.name },
  });

  return NextResponse.json({
    ...data,
    token: plain,
  });
}
