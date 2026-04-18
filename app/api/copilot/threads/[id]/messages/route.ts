import { NextResponse } from "next/server";

import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }
  if (!hasSupabaseAuth()) {
    return NextResponse.json({ messages: [] });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { data: thread, error: te } = await supabase
      .from("copilot_threads")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (te || !thread) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("copilot_messages")
      .select("role, content, created_at")
      .eq("thread_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "list_failed", message: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ messages: data ?? [] });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }
  if (!hasSupabaseAuth()) {
    return NextResponse.json({ error: "auth_not_configured" }, { status: 503 });
  }

  let userText = "";
  let assistantText = "";
  try {
    const b = (await req.json()) as { user?: string; assistant?: string };
    userText = typeof b.user === "string" ? b.user : "";
    assistantText = typeof b.assistant === "string" ? b.assistant : "";
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!userText.trim() || !assistantText.trim()) {
    return NextResponse.json({ error: "user_and_assistant_required" }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { data: thread, error: te } = await supabase
      .from("copilot_threads")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (te || !thread) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const { error: insErr } = await supabase.from("copilot_messages").insert([
      { thread_id: id, role: "user", content: userText.slice(0, 24_000) },
      { thread_id: id, role: "assistant", content: assistantText.slice(0, 24_000) },
    ]);

    if (insErr) {
      return NextResponse.json(
        { error: "insert_failed", message: insErr.message },
        { status: 400 },
      );
    }

    await supabase
      .from("copilot_threads")
      .update({ updated_at: now })
      .eq("id", id)
      .eq("user_id", user.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
