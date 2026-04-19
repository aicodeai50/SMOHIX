import { NextResponse } from "next/server";

import { getIncidentForUser } from "@/lib/incidents/data";
import { incidentDetailToMarkdown } from "@/lib/incidents/export-markdown";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  if (!hasSupabaseAuth()) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const { id } = await ctx.params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const resolved = await getIncidentForUser(user.id, id, null);
  if (!resolved || resolved.source !== "database") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const md = incidentDetailToMarkdown(resolved.row);
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "incident";

  return new NextResponse(md, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="incident-${safe}.md"`,
      "Cache-Control": "private, no-store",
    },
  });
}
