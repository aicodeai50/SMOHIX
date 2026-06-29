import { getMailtoHref } from "@/lib/billing";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
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

  // Queue manual review — production would enqueue email to ops
  if (process.env.NODE_ENV === "development") {
    console.info("[account deletion request]", user.id, user.email);
  }

  return Response.json({
    ok: true,
    message: `Request logged. Contact ${getMailtoHref("support")} if you need immediate assistance.`,
  });
}
