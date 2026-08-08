import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getRobotBackendUrl } from "@/lib/backend-urls";
import { getOrgContextForUser } from "@/lib/org/context";
import { insertAutomationDryRun } from "@/lib/automations/dry-runs-db";
import { recordDryRun } from "@/lib/automations/runs-dev";
import { appendAuditEvent } from "@/lib/audit/append";
import { billingPlanFromSummary, getSubscriptionSummary } from "@/lib/billing/plan";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return UUID_RE.test(s);
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
  const tid = (req.cookies.get("smohix_dev_tid")?.value ?? req.cookies.get("zentro_dev_tid")?.value);
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

  if (ctx.mode === "auth") {
    const supabase = await createServerSupabaseClient();
    const { summary, error: subscriptionError } = await getSubscriptionSummary(
      supabase,
      ctx.userId,
    );
    if (!subscriptionError && billingPlanFromSummary(summary) === "free") {
      return NextResponse.json(
        {
          error: "subscription_required",
          message: "Automations require an active subscription.",
          billing: "/settings/billing?upgrade=automations",
        },
        { status: 403 },
      );
    }
  }

  let playbookId = "";
  let incidentId: string | null = null;
  try {
    const b = (await req.json()) as { playbookId?: string; incidentId?: string };
    playbookId = String(b.playbookId ?? "").trim();
    const rawInc = String(b.incidentId ?? "").trim();
    if (rawInc) {
      if (!isUuid(rawInc)) {
        return NextResponse.json({ error: "invalid_incident_id" }, { status: 400 });
      }
      incidentId = rawInc;
    }
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!playbookId) {
    return NextResponse.json({ error: "playbookId_required" }, { status: 400 });
  }

  if (incidentId && ctx.mode === "auth") {
    const supabase = await createServerSupabaseClient();
    const { data: inc, error: incErr } = await supabase
      .from("incidents")
      .select("id")
      .eq("id", incidentId)
      .eq("user_id", ctx.userId)
      .maybeSingle();
    if (incErr || !inc) {
      return NextResponse.json({ error: "incident_not_found" }, { status: 404 });
    }
  } else if (incidentId) {
    return NextResponse.json(
      { error: "incident_context_requires_auth" },
      { status: 400 },
    );
  }

  const robotBase = getRobotBackendUrl();
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
    const orgContext = await getOrgContextForUser(ctx.userId);
    const row = await insertAutomationDryRun(supabase, ctx.userId, {
      playbookId,
      ok,
      detail,
      incidentId,
      orgId: orgContext.orgId,
    });
    if (row) {
      id = row.id;
      at = row.at;
      persisted = true;
    } else {
      recordDryRun(tenantKey, {
        playbookId,
        ok,
        detail,
        ...(incidentId ? { incidentId } : {}),
      });
    }

    void appendAuditEvent({
      event_type: "automation.dry_run",
      user_id: ctx.userId,
      org_id: orgContext.orgId,
      details: {
        playbook_id: playbookId,
        ok,
        detail: detail.slice(0, 500),
        ...(incidentId ? { incident_id: incidentId } : {}),
      },
    });
    revalidatePath("/overview");
    if (incidentId) {
      revalidatePath(`/incidents/${incidentId}`);
    }
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
