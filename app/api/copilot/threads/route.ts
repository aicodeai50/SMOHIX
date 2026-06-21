import { NextResponse } from "next/server";

import { getOrgContextForUser } from "@/lib/org/context";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  if (!hasSupabaseAuth()) {
    return NextResponse.json({ threads: [] });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const orgContext = await getOrgContextForUser(user.id);
    let query = supabase
      .from("copilot_threads")
      .select("id, title, updated_at, incident_id")
      .order("updated_at", { ascending: false })
      .limit(40);

    query = orgContext.orgId ? query.or(`user_id.eq.${user.id},org_id.eq.${orgContext.orgId}`) : query.eq("user_id", user.id);

    const { data, error } = await query;

    if (error) {
      const missingTable =
        error.code === "42P01" ||
        /does not exist|copilot_threads/i.test(error.message ?? "");
      return NextResponse.json(
        {
          error: missingTable ? "persistence_unavailable" : "threads_load_failed",
          message: missingTable
            ? "Conversation history is not available yet — apply the copilot_threads migration in Supabase."
            : error.message,
          threads: [],
        },
        { status: missingTable ? 503 : 500 },
      );
    }

    return NextResponse.json({ threads: data ?? [] });
  } catch {
    return NextResponse.json({ threads: [] });
  }
}

export async function POST(req: Request) {
  if (!hasSupabaseAuth()) {
    return NextResponse.json({ error: "auth_not_configured" }, { status: 503 });
  }

  let title = "Conversation";
  let incidentId: string | null = null;
  try {
    const b = (await req.json()) as { title?: string; incidentId?: string | null };
    if (typeof b?.title === "string" && b.title.trim()) {
      title = b.title.trim().slice(0, 120);
    }
    incidentId = typeof b?.incidentId === "string" && b.incidentId.trim() ? b.incidentId.trim() : null;
  } catch {
    /* default title */
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const orgContext = await getOrgContextForUser(user.id);
    const { data, error } = await supabase
      .from("copilot_threads")
      .insert({ user_id: user.id, org_id: orgContext.orgId, incident_id: incidentId, title })
      .select("id, title, updated_at, incident_id")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "create_failed", message: error?.message ?? "insert failed" },
        { status: 400 },
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
