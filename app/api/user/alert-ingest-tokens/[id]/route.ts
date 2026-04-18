import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import { getBillingPlanForUser } from "@/lib/billing/plan";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
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

  const plan = await getBillingPlanForUser(supabase, user.id);
  if (plan === "free") {
    return NextResponse.json({ error: "subscription_required" }, { status: 403 });
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("alert_ingest_tokens")
    .update({ revoked_at: now })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "revoke_failed", message: error.message }, { status: 400 });
  }

  await appendAuditEvent({
    event_type: "alert_ingest_token.revoked",
    user_id: user.id,
    details: { token_id: id },
  });

  return NextResponse.json({ ok: true });
}
