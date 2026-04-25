import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!hasSupabaseAuth()) {
    return NextResponse.json(
      {
        ok: true,
        mode: "session",
        message: "Suggestion marked as promoted in session mode.",
      },
      { status: 200 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let suggestionId = "";
  let playbookId = "";
  let confidence = 0;
  try {
    const b = (await req.json()) as {
      suggestionId?: string;
      playbookId?: string;
      confidence?: number;
    };
    suggestionId = String(b.suggestionId ?? "").trim();
    playbookId = String(b.playbookId ?? "").trim();
    confidence = Number(b.confidence ?? 0);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!suggestionId || !playbookId) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  await appendAuditEvent({
    event_type: "policy.suggestion_promoted",
    user_id: user.id,
    details: {
      suggestion_id: suggestionId,
      playbook_id: playbookId,
      confidence_score: confidence,
    },
  });

  return NextResponse.json({
    ok: true,
    promoted: true,
  });
}
