import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { recordDryRun } from "@/lib/automations/runs-dev";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function normalizeBase(url: string | undefined): string | null {
  const t = url?.trim();
  if (!t) return null;
  return t.replace(/\/+$/, "");
}

async function runKeyFromRequest(req: NextRequest): Promise<string | NextResponse> {
  if (hasSupabaseAuth()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return `u:${user.id}`;
  }
  const tid = req.cookies.get("shynvo_dev_tid")?.value;
  if (!tid) {
    return NextResponse.json(
      { error: "missing_dev_session", message: "Reload once to obtain a demo session cookie." },
      { status: 400 },
    );
  }
  return tid;
}

export async function POST(req: NextRequest) {
  const keyRes = await runKeyFromRequest(req);
  if (keyRes instanceof NextResponse) {
    return keyRes;
  }
  const tenantKey = keyRes;

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

  recordDryRun(tenantKey, { playbookId, ok, detail });

  return NextResponse.json({
    ok,
    playbookId,
    detail,
    at: new Date().toISOString(),
  });
}
