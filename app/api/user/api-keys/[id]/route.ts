import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { devRevokeKey } from "@/lib/api-keys/dev-store";
import { appendAuditEvent } from "@/lib/audit/append";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!id || id.length > 80) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  if (!hasSupabaseAuth()) {
    const tid = req.cookies.get("shynvo_dev_tid")?.value;
    if (!tid) {
      return NextResponse.json(
        { error: "missing_dev_session", message: "Reload the page to pick up a browser session." },
        { status: 400 },
      );
    }
    const ok = devRevokeKey(tid, id);
    if (!ok) {
      return NextResponse.json({ error: "not_found_or_already_revoked" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, id, mode: "session" as const });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const revoked_at = new Date().toISOString();
  const { data, error } = await supabase
    .from("api_keys")
    .update({ revoked_at })
    .eq("id", id)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "revoke_failed", message: error.message },
      { status: 400 },
    );
  }
  if (!data) {
    return NextResponse.json({ error: "not_found_or_already_revoked" }, { status: 404 });
  }

  await appendAuditEvent({
    event_type: "api_key.revoked",
    user_id: user.id,
    details: { key_id: id },
  });

  return NextResponse.json({ ok: true, id: data.id, mode: "supabase" as const });
}
