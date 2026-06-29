import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  if (!hasSupabaseAuth()) {
    return Response.json({ error: "Not configured" }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, boolean>;
  try {
    body = (await request.json()) as Record<string, boolean>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      notification_preferences: body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

export async function GET() {
  if (!hasSupabaseAuth()) {
    return Response.json({});
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("profiles")
    .select("notification_preferences")
    .eq("id", user.id)
    .maybeSingle();

  return Response.json((data?.notification_preferences as Record<string, boolean>) ?? {});
}
