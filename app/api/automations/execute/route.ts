import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { insertAutomationDryRun } from "@/lib/automations/dry-runs-db";
import { recordExecution } from "@/lib/automations/executions-dev";
import { getPlaybookById } from "@/lib/automations/playbooks";
import { listDryRuns } from "@/lib/automations/runs-dev";
import { evaluateApprovalPolicy } from "@/lib/approvals/policy";
import { appendAuditEvent } from "@/lib/audit/append";
import { billingPlanFromSummary, getSubscriptionSummary } from "@/lib/billing/plan";
import {
  buildActualOutcome,
  buildDecisionBrief,
  buildExpectedOutcome,
  decisionAccuracyScore,
  suggestPolicyPromotions,
} from "@/lib/decision-intelligence";
import { sendSlackNotificationWithAudit } from "@/lib/integrations/slack";
import { getSiteUrl } from "@/lib/site";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

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
  if (ctx instanceof NextResponse) return ctx;

  if (ctx.mode === "auth") {
    const supabase = await createServerSupabaseClient();
    const { summary, error: subscriptionError } = await getSubscriptionSummary(supabase, ctx.userId);
    if (!subscriptionError && billingPlanFromSummary(summary) === "free") {
      return NextResponse.json(
        {
          error: "subscription_required",
          message: "Execution requires an active subscription.",
          billing: "/settings/billing?upgrade=automations",
        },
        { status: 403 },
      );
    }
  }

  let playbookId = "";
  let rollbackPlan = "";
  let approvalNote = "";
  let incidentId: string | null = null;
  try {
    const b = (await req.json()) as {
      playbookId?: string;
      rollbackPlan?: string;
      approvalNote?: string;
      incidentId?: string;
    };
    playbookId = String(b.playbookId ?? "").trim();
    rollbackPlan = String(b.rollbackPlan ?? "").trim();
    approvalNote = String(b.approvalNote ?? "").trim();
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

  if (!playbookId) return NextResponse.json({ error: "playbookId_required" }, { status: 400 });
  if (!rollbackPlan) {
    return NextResponse.json(
      { error: "rollback_plan_required", message: "Execution requires a rollback plan." },
      { status: 400 },
    );
  }

  const playbook = getPlaybookById(playbookId);
  if (!playbook) return NextResponse.json({ error: "unknown_playbook" }, { status: 404 });

  const policy = evaluateApprovalPolicy(playbook.name, approvalNote);
  if (policy.blockedReason) {
    return NextResponse.json(
      { error: "approval_policy_blocked", message: policy.blockedReason },
      { status: 400 },
    );
  }

  const recent =
    ctx.mode === "auth"
      ? await (async () => {
          const supabase = await createServerSupabaseClient();
          const { data } = await supabase
            .from("automation_dry_runs")
            .select("id, playbook_id, ok, detail, created_at")
            .eq("user_id", ctx.userId)
            .eq("playbook_id", playbookId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (!data) return null;
          return {
            id: data.id as string,
            playbookId: data.playbook_id as string,
            ok: Boolean(data.ok),
            detail: String(data.detail ?? ""),
            at: data.created_at as string,
          };
        })()
      : listDryRuns(ctx.tenantKey).find((r) => r.playbookId === playbookId) ?? null;
  if (!recent || !recent.ok) {
    return NextResponse.json(
      {
        error: "dry_run_required",
        message: "Run a successful dry-run before execution.",
      },
      { status: 400 },
    );
  }

  const runAgeMs = Date.now() - new Date(recent.at).valueOf();
  if (runAgeMs > 2 * 60 * 60 * 1000) {
    return NextResponse.json(
      {
        error: "dry_run_stale",
        message: "Latest dry-run is stale (>2h). Re-run dry-run before execution.",
      },
      { status: 400 },
    );
  }

  const robotBase = normalizeBase(process.env.SHYNVO_ROBOT_API_URL);
  const mode: "simulated" | "connector" = robotBase ? "connector" : "simulated";
  const ok = true;
  const decisionBrief = buildDecisionBrief({
    actionLabel: playbook.name,
    policyHint: approvalNote,
    rollbackPlan,
  });
  const expectedOutcome = buildExpectedOutcome({
    playbookId,
    decisionBrief,
  });
  const actualOutcome = buildActualOutcome({
    ok,
    mode,
    expected: expectedOutcome,
  });
  const accuracyScore = decisionAccuracyScore({
    expected: expectedOutcome,
    actual: actualOutcome,
  });
  const policySuggestions = suggestPolicyPromotions({
    playbookId,
    decisionBrief,
    accuracyScore,
  });

  const receipt = recordExecution(ctx.tenantKey, {
    playbookId,
    ok,
    mode,
    rollbackPlan: rollbackPlan.slice(0, 500),
    approvalNote: approvalNote.slice(0, 300),
    decisionBrief,
    expectedOutcome,
    actualOutcome,
    decisionAccuracyScore: accuracyScore,
    policySuggestions,
    ...(incidentId ? { incidentId } : {}),
  });

  if (ctx.mode === "auth") {
    // Also persist a dry-run row as execution receipt proxy until dedicated execution table ships.
    const supabase = await createServerSupabaseClient();
    await insertAutomationDryRun(supabase, ctx.userId, {
      playbookId,
      ok: true,
      detail: `EXECUTED (${mode}) with rollback: ${rollbackPlan.slice(0, 240)}`,
      incidentId,
    });
    await appendAuditEvent({
      event_type: "automation.executed",
      user_id: ctx.userId,
      details: {
        playbook_id: playbookId,
        mode,
        rollback_plan: rollbackPlan.slice(0, 240),
        approval_note: approvalNote.slice(0, 200),
        execution_receipt_id: receipt.id,
        decision_brief: decisionBrief,
        expected_outcome: expectedOutcome,
        actual_outcome: actualOutcome,
        decision_accuracy_score: accuracyScore,
        policy_suggestions: policySuggestions,
        ...(incidentId ? { incident_id: incidentId } : {}),
      },
    });
    const siteUrl = getSiteUrl();
    const incidentUrl = incidentId ? `${siteUrl}/incidents/${incidentId}` : null;
    const automationsUrl = `${siteUrl}/automations`;
    void sendSlackNotificationWithAudit({
      userId: ctx.userId,
      title: "Automation executed",
      body: "A guarded automation execution was recorded in Shynvo.",
      details: [
        `playbook_id: ${playbookId}`,
        `mode: ${mode}`,
        `receipt_id: ${receipt.id}`,
        `open: ${incidentUrl ?? automationsUrl}`,
        ...(incidentId ? [`incident_id: ${incidentId}`] : []),
      ],
      kind: "execution_receipt",
      auditDetails: {
        playbook_id: playbookId,
        mode,
        execution_receipt_id: receipt.id,
        ...(incidentId ? { incident_id: incidentId } : {}),
        decision_accuracy_score: accuracyScore,
      },
    });
    revalidatePath("/automations");
    revalidatePath("/overview");
    revalidatePath("/approvals");
    if (incidentId) revalidatePath(`/incidents/${incidentId}`);
  }

  return NextResponse.json({
    ok: true,
    id: receipt.id,
    at: receipt.at,
    playbookId,
    mode,
    detail: "Execution recorded with approval note and rollback plan.",
    decisionBrief,
    expectedOutcome,
    actualOutcome,
    decisionAccuracyScore: accuracyScore,
    policySuggestions,
  });
}
