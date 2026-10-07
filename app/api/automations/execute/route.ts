import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { applyUserOrOrgScope } from "@/lib/org/apply-scope-query";
import { revalidatePath } from "next/cache";

import {
  insertAutomationExecution,
} from "@/lib/automations/executions-db";
import { recordExecution } from "@/lib/automations/executions-dev";
import { getPlaybookById } from "@/lib/automations/playbooks";
import { listDryRuns } from "@/lib/automations/runs-dev";
import {
  evaluateAcceptedPolicyEnforcement,
  evaluateApprovalPolicy,
  parseApprovalNoteSignals,
  SLO_BURN_POLICY_BLOCKED_REASON,
} from "@/lib/approvals/policy";
import { appendAuditEvent, claimExecutionAudit } from "@/lib/audit/append";
import { billingPlanFromSummary, getSubscriptionSummary } from "@/lib/billing/plan";
import {
  buildActualOutcome,
  buildDecisionBrief,
  buildExpectedOutcome,
  decisionAccuracyScore,
  suggestPolicyPromotions,
} from "@/lib/decision-intelligence";
import { sendSlackNotificationWithAudit } from "@/lib/integrations/slack";
import {
  listAcceptedPolicyGuardrailsForPlaybook,
  upsertPolicySuggestion,
} from "@/lib/approvals/policy-suggestions";
import { policyBlockReasonCodeFromMessage } from "@/lib/approvals/policy-block-reasons";
import {
  assessChangeRisk,
  evaluateChangeRiskApprovalTightening,
} from "@/lib/approvals/change-risk";
import { insertChangeRiskScore } from "@/lib/approvals/change-risk-db";
import { getRobotBackendUrl } from "@/lib/backend-urls";
import { getOrgContextForUser } from "@/lib/org/context";
import { getSiteUrl } from "@/lib/site";
import { getLatestBurnStateForService } from "@/lib/services/slo";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { executeRobotAction } from "@/lib/automations/connector-execution";
import { randomUUID } from "node:crypto";
import { canCreateApprovalRequest } from "@/lib/org/roles";
import { verifyExecutionApproval } from "@/lib/automations/execution-approval";

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
  if (ctx instanceof NextResponse) return ctx;

  if (ctx.mode === "auth") {
    const supabase = await createServerSupabaseClient();
    const { summary, error: subscriptionError } = await getSubscriptionSummary(supabase, ctx.userId);
    if (subscriptionError) return NextResponse.json({ error: "billing_unavailable", message: "Subscription access could not be verified. Try again later." }, { status: 503 });
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
  let approvalId: string | null = null;
  try {
    const b = (await req.json()) as {
      playbookId?: string;
      rollbackPlan?: string;
      approvalNote?: string;
      incidentId?: string;
      approvalId?: string;
    };
    playbookId = String(b.playbookId ?? "").trim();
    rollbackPlan = String(b.rollbackPlan ?? "").trim();
    approvalNote = String(b.approvalNote ?? "").trim();
    approvalId = typeof b.approvalId === "string" ? b.approvalId.trim() : null;
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
  if (!Number.isFinite(runAgeMs) || runAgeMs < 0 || runAgeMs > 2 * 60 * 60 * 1000) {
    return NextResponse.json(
      {
        error: "dry_run_stale",
        message: "Latest dry-run is stale (>2h). Re-run dry-run before execution.",
      },
      { status: 400 },
    );
  }

  const preDecisionBrief = buildDecisionBrief({
    actionLabel: playbook.name,
    policyHint: approvalNote,
    rollbackPlan,
  });
  const changeRisk = assessChangeRisk({
    playbook,
    decisionBrief: preDecisionBrief,
    approvalNote,
    hasIncidentLinked: Boolean(incidentId),
  });
  const riskApprovalBlock = evaluateChangeRiskApprovalTightening({
    assessment: changeRisk,
    approvalNote,
  });

  if (ctx.mode === "auth") {
    const supabase = await createServerSupabaseClient();
    const orgContext = await getOrgContextForUser(ctx.userId);
    if (orgContext.role && !canCreateApprovalRequest(orgContext.role)) {
      return NextResponse.json({ error: "execution_forbidden", message: "Your workspace role cannot execute automations." }, { status: 403 });
    }
    if (playbook.risk === "high" && !await verifyExecutionApproval(supabase, ctx.userId, orgContext.orgId, approvalId, playbook)) {
      return NextResponse.json({ error: "verified_approval_required", message: "High-risk execution needs a recent approved request for this exact playbook, decided by a different person. An approval note alone is insufficient." }, { status: 403 });
    }
    if (incidentId) {
      const incidentQuery = supabase
        .from("incidents")
        .select("service_id")
        .eq("id", incidentId);
      const { data: incidentRow, error: incidentError } = await applyUserOrOrgScope(incidentQuery, ctx.userId, orgContext.orgId).maybeSingle();
      if (incidentError || !incidentRow) return NextResponse.json({ error: "incident_unavailable", message: "The linked incident could not be verified." }, { status: incidentError ? 503 : 404 });
      const serviceId = incidentRow?.service_id ? String(incidentRow.service_id) : null;
      if (serviceId) {
        const burnState = await getLatestBurnStateForService(
          supabase,
          ctx.userId,
          serviceId,
          orgContext.orgId,
        );
        const signals = parseApprovalNoteSignals(approvalNote);
        const hasSenior = signals.hasSeniorAcknowledgement;
        const hasWindow = signals.hasChangeWindow;
        if (burnState === "critical" && (!hasSenior || !hasWindow)) {
          const blockedReason = SLO_BURN_POLICY_BLOCKED_REASON;
          await appendAuditEvent({
            event_type: "automation.execution_blocked_slo",
            user_id: ctx.userId,
            org_id: orgContext.orgId,
            details: {
              playbook_id: playbookId,
              incident_id: incidentId,
              service_id: serviceId,
              burn_state: burnState,
              blocked_reason: blockedReason,
            },
          });
          return NextResponse.json(
            {
              error: "execution_blocked_by_slo",
              message: blockedReason,
              sloPolicy: { burnState, requiresSeniorAcknowledgement: true, requiresChangeWindow: true },
            },
            { status: 403 },
          );
        }
      }
    }
    if (riskApprovalBlock) {
      await insertChangeRiskScore(supabase, {
        userId: ctx.userId,
        playbookId,
        incidentId,
        assessment: changeRisk,
        blocked: true,
        blockedReason: riskApprovalBlock,
      });
      await appendAuditEvent({
        event_type: "automation.execution_blocked_risk",
        user_id: ctx.userId,
        org_id: orgContext.orgId,
        details: {
          playbook_id: playbookId,
          risk_score: changeRisk.score,
          risk_tier: changeRisk.tier,
          risk_factors: changeRisk.factors,
          blocked_reason: riskApprovalBlock,
        },
      });
      return NextResponse.json(
        {
          error: "execution_blocked_by_change_risk",
          message: riskApprovalBlock,
          changeRisk,
        },
        { status: 403 },
      );
    }
    const accepted = await listAcceptedPolicyGuardrailsForPlaybook(supabase, ctx.userId, playbookId);
    const enforcement = evaluateAcceptedPolicyEnforcement({
      approvalNote,
      decisionBlastRadius: preDecisionBrief.blastRadius,
      hasFreshDryRun: Boolean(recent && recent.ok && runAgeMs <= 2 * 60 * 60 * 1000),
      enforced: accepted
        ? {
            requireDryRunFresh: accepted.requireDryRunFresh,
            requireChangeWindow: accepted.requireChangeWindow,
            maxBlastRadius: accepted.maxBlastRadius,
          }
        : null,
    });
    if (enforcement.blockedReason) {
      const blockedReasonCode = policyBlockReasonCodeFromMessage(enforcement.blockedReason);
      await appendAuditEvent({
        event_type: "automation.execution_blocked_policy",
        user_id: ctx.userId,
        org_id: orgContext.orgId,
        details: {
          playbook_id: playbookId,
          blocked_reason_code: blockedReasonCode,
          blocked_reason: enforcement.blockedReason,
          accepted_policy_suggestion_ids: accepted?.suggestionIds ?? [],
          enforcement_checks: enforcement.checks,
        },
      });
      return NextResponse.json(
        {
          error: "execution_blocked_by_accepted_policy",
          message: enforcement.blockedReason,
          enforcement: {
            reasonCode: blockedReasonCode,
            checks: enforcement.checks,
            acceptedPolicySuggestionIds: accepted?.suggestionIds ?? [],
          },
        },
        { status: 403 },
      );
    }
  }

  const robotBase = getRobotBackendUrl();
  const mode: "simulated" | "connector" = ctx.mode === "auth" && robotBase ? "connector" : "simulated";
  if (ctx.mode === "auth" && !robotBase) return NextResponse.json({ error: "execution_not_configured", message: "The automation execution service is not connected. No action was performed." }, { status: 503 });
  if (ctx.mode === "auth" && robotBase) {
    const requestId = playbook.risk === "high" && approvalId ? approvalId : randomUUID();
    const orgContext = await getOrgContextForUser(ctx.userId);
    const intent = await claimExecutionAudit({ event_type: "automation.execution_requested", user_id: ctx.userId,
      org_id: orgContext.orgId, details: { request_id: requestId, playbook_id: playbookId, incident_id: incidentId } }, requestId);
    if (!intent.ok) return NextResponse.json({ error: intent.duplicate ? "approval_already_dispatched" : "audit_unavailable",
      message: intent.duplicate ? "This approval has already been used. Check the previous execution before requesting a new approval."
        : "Execution was blocked because its audit record could not be saved." }, { status: intent.duplicate ? 409 : 503 });
    const result = await executeRobotAction(robotBase, { playbookId, incidentId, rollbackPlan, approvalNote }, requestId);
    if (!result.ok) {
      await appendAuditEvent({ event_type: "automation.execution_unconfirmed", user_id: ctx.userId,
        details: { request_id: requestId, playbook_id: playbookId, uncertain: result.uncertain } });
      return NextResponse.json({ error: "execution_unconfirmed", message: result.message, requestId }, { status: 502 });
    }
  }
  const ok = true;
  const decisionBrief = preDecisionBrief;
  const expectedOutcome = buildExpectedOutcome({
    playbookId,
    decisionBrief,
  });
  const actualOutcome = mode === "simulated" ? buildActualOutcome({
    ok,
    mode,
    expected: expectedOutcome,
  }) : undefined;
  const accuracyScore = actualOutcome ? decisionAccuracyScore({
    expected: expectedOutcome,
    actual: actualOutcome,
  }) : undefined;
  const policySuggestions = mode === "simulated" && accuracyScore !== undefined ? suggestPolicyPromotions({
    playbookId,
    decisionBrief,
    accuracyScore,
  }) : [];

  const fallbackReceipt = recordExecution(ctx.tenantKey, {
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
    changeRisk,
    ...(incidentId ? { incidentId } : {}),
  });

  let executionId = fallbackReceipt.id;
  let executionAt = fallbackReceipt.at;
  let persisted = false;
  let auditRecorded = false;

  if (ctx.mode === "auth") {
    const supabase = await createServerSupabaseClient();
    const orgContext = await getOrgContextForUser(ctx.userId);
    const execInsert = await insertAutomationExecution(supabase, {
      userId: ctx.userId,
      playbookId,
      ok: true,
      mode,
      rollbackPlan: rollbackPlan.slice(0, 500),
      approvalNote: approvalNote.slice(0, 300),
      incidentId,
      decisionBrief,
      expectedOutcome,
      actualOutcome: actualOutcome ?? null,
      decisionAccuracyScore: accuracyScore ?? null,
      policySuggestions,
      orgId: orgContext.orgId,
    });
    if (execInsert.ok) {
      persisted = true;
      executionId = execInsert.id;
      executionAt = execInsert.createdAt;
    }
    await insertChangeRiskScore(supabase, {
      userId: ctx.userId,
      playbookId,
      incidentId,
      executionId: execInsert.ok ? execInsert.id : null,
      assessment: changeRisk,
      blocked: false,
    });
    for (const s of policySuggestions) {
      await upsertPolicySuggestion(supabase, {
        userId: ctx.userId,
        playbookId,
        suggestionKey: s.id,
        label: s.label,
        reason: s.reason,
        confidenceScore: s.confidenceScore,
        guardrails: s.guardrails,
      });
    }
    const auditResult = await appendAuditEvent({
      event_type: "automation.executed",
      user_id: ctx.userId,
      org_id: orgContext.orgId,
      details: {
        playbook_id: playbookId,
        mode,
        rollback_plan: rollbackPlan.slice(0, 240),
        approval_note: approvalNote.slice(0, 200),
        execution_receipt_id: executionId,
        decision_brief: decisionBrief,
        expected_outcome: expectedOutcome,
        actual_outcome: actualOutcome,
        decision_accuracy_score: accuracyScore,
        policy_suggestions: policySuggestions,
        change_risk: changeRisk,
        ...(incidentId ? { incident_id: incidentId } : {}),
      },
    });
    auditRecorded = auditResult.ok;
    const siteUrl = getSiteUrl();
    const incidentUrl = incidentId ? `${siteUrl}/incidents/${incidentId}` : null;
    const automationsUrl = `${siteUrl}/automations`;
    void sendSlackNotificationWithAudit({
      userId: ctx.userId,
      title: "Automation executed",
      body: "A guarded automation execution was recorded in Smohix.",
      details: [
        `playbook_id: ${playbookId}`,
        `mode: ${mode}`,
        `receipt_id: ${executionId}`,
        `open: ${incidentUrl ?? automationsUrl}`,
        ...(incidentId ? [`incident_id: ${incidentId}`] : []),
      ],
      kind: "execution_receipt",
      auditDetails: {
        playbook_id: playbookId,
        mode,
        execution_receipt_id: executionId,
        ...(incidentId ? { incident_id: incidentId } : {}),
        decision_accuracy_score: accuracyScore,
        change_risk_score: changeRisk.score,
        change_risk_tier: changeRisk.tier,
      },
    });
    revalidatePath("/automations");
    revalidatePath("/overview");
    revalidatePath("/approvals");
    if (incidentId) revalidatePath(`/incidents/${incidentId}`);
  }

  return NextResponse.json({
    ok: true,
    id: executionId,
    at: executionAt,
    playbookId,
    mode,
    persisted,
    auditRecorded,
    detail: mode === "simulated" ? "Simulation recorded. No infrastructure action was performed."
      : persisted && auditRecorded ? "Execution confirmed and saved with audit evidence."
      : "Execution was confirmed, but some records could not be saved. Check service activity before running it again.",
    decisionBrief,
    expectedOutcome,
    actualOutcome,
    decisionAccuracyScore: accuracyScore,
    policySuggestions,
    changeRisk,
  });
}
