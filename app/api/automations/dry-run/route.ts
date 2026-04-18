import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { insertAutomationDryRun } from "@/lib/automations/dry-runs-db";
import { recordDryRun } from "@/lib/automations/runs-dev";
import { appendAuditEvent } from "@/lib/audit/append";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function normalizeBase(url: string | undefined): string | null {
  const t = url?.trim();
  if (!t) return null;
  return t.replace(/\/+$/, "");
}

type RunContext =
  | { mode: "auth"; userId: string; tenantKey: string }
  | { mode: "dev"; tenantKey: string };

async function runContextFromRequest(req: NextRequest): Promise<RunContext | NextResponse> {
  if (hasSupabaseAuth()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return { mode: "auth", userId: user.id, tenantKey: `u:${user.id}` };
  }
  const tid = req.cookies.get("shynvo_dev_tid")?.value;
  if (!tid) {
    return NextResponse.json(
      { error: "missing_dev_session", message: "Reload once to obtain a session cookie." },
      { status: 400 },
    );
  }
  return { mode: "dev", tenantKey: tid };
}

export async function POST(req: NextRequest) {
  const ctx = await runContextFromRequest(req);
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  const tenantKey = ctx.tenantKey;

  let playbookId = "";
  try {
    const b = (await req.json()) as { playbookId?: string };
    playbookId = String(b.playbookId ?? "").trim();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!playbookId) {
    return NextResponse.json({ error: "playbookId_required" }, { status: 400 });
  }

  const robotBase = normalizeBase(process.env.SHYNVO_ROBOT_API_URL);
  let ok = true;
  let detail = "Simulated dry-run (no robot URL configured).";

  if (robotBase) {
    try {
      const res = await fetch(`${robotBase}/health`, {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
        headers: { accept: "application/json, text/plain, */*" },
      });
      ok = res.ok;
      detail = ok
        ? `Robot health OK (${res.status})`
        : `Robot health HTTP ${res.status}`;
    } catch (e) {
      ok = false;
      detail = e instanceof Error ? e.message : "robot_unreachable";
    }
  }

  let id = `run-${Date.now()}`;
  let at = new Date().toISOString();
  let persisted = false;

  if (ctx.mode === "auth") {
    const supabase = await createServerSupabaseClient();
    const row = await insertAutomationDryRun(supabase, ctx.userId, {
      playbookId,
      ok,
      detail,
    });
    if (row) {
      id = row.id;
      at = row.at;
      persisted = true;
    } else {
      recordDryRun(tenantKey, { playbookId, ok, detail });
    }

    void appendAuditEvent({
      event_type: "automation.dry_run",
      user_id: ctx.userId,
      details: {
        playbook_id: playbookId,
        ok,
        detail: detail.slice(0, 500),
      },
    });
  } else {
    recordDryRun(tenantKey, { playbookId, ok, detail });
  }

  return NextResponse.json({
    ok,
    playbookId,
    detail,
    at,
    id,
    persisted,
  });
}
