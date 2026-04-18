import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  displayKeyPrefix,
  generateApiKeyPlaintext,
  hashApiKeyPlaintext,
} from "@/lib/api-keys/token";
import { devCreateKey, devListKeys } from "@/lib/api-keys/dev-store";
import { appendAuditEvent } from "@/lib/audit/append";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function devTenantOr400(req: NextRequest) {
  const tid = req.cookies.get("shynvo_dev_tid")?.value;
  if (!tid) {
    return null;
  }
  return tid;
}

export async function GET(req: NextRequest) {
  if (!hasSupabaseAuth()) {
    const tid = devTenantOr400(req);
    if (!tid) {
      return NextResponse.json(
        { error: "missing_dev_session", message: "Reload the page to pick up a demo session." },
        { status: 400 },
      );
    }
    return NextResponse.json({ keys: devListKeys(tid), mode: "demo" as const });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, created_at, last_used_at, revoked_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "list_failed", message: error.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ keys: data ?? [], mode: "supabase" as const });
}

export async function POST(req: NextRequest) {
  let name = "API key";
  try {
    const body = (await req.json()) as { name?: unknown };
    if (typeof body?.name === "string" && body.name.trim()) {
      name = body.name.trim().slice(0, 80);
    }
  } catch {
    /* optional body */
  }

  if (!hasSupabaseAuth()) {
    const tid = devTenantOr400(req);
    if (!tid) {
      return NextResponse.json(
        { error: "missing_dev_session", message: "Reload the page to pick up a demo session." },
        { status: 400 },
      );
    }
    const { row, plain } = devCreateKey(tid, name);
    return NextResponse.json({
      ...row,
      key: plain,
      mode: "demo" as const,
    });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const plain = generateApiKeyPlaintext();
  const key_prefix = displayKeyPrefix(plain);
  const secret_hash = hashApiKeyPlaintext(plain);

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      user_id: user.id,
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
    event_type: "api_key.created",
    user_id: user.id,
    details: { key_id: data.id, name: data.name },
  });

  return NextResponse.json({
    ...data,
    key: plain,
    mode: "supabase" as const,
  });
}
