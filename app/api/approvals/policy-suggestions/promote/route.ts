import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import { updatePolicySuggestionStatus } from "@/lib/approvals/policy-suggestions";
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
  let reviewerNotes = "";
  try {
    const b = (await req.json()) as {
      suggestionId?: string;
      playbookId?: string;
      confidence?: number;
      reviewerNotes?: string;
    };
    suggestionId = String(b.suggestionId ?? "").trim();
    playbookId = String(b.playbookId ?? "").trim();
    confidence = Number(b.confidence ?? 0);
    reviewerNotes = String(b.reviewerNotes ?? "").trim();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!suggestionId || !playbookId) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const updated = await updatePolicySuggestionStatus(supabase, {
    userId: user.id,
    suggestionKey: suggestionId,
    playbookId,
    status: "reviewed",
    reviewerNotes,
    promoted: true,
  });
  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
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
