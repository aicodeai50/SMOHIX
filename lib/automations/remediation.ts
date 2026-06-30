import type { SupabaseClient } from "@supabase/supabase-js";

import {
  evaluateAcceptedPolicyEnforcement,
  parseApprovalNoteSignals,
  SLO_BURN_POLICY_BLOCKED_REASON,
} from "@/lib/approvals/policy";
import { listAcceptedPolicyGuardrailsForPlaybook } from "@/lib/approvals/policy-suggestions";
import { buildDecisionBrief } from "@/lib/decision-intelligence";
import { getLatestBurnStateForService } from "@/lib/services/slo";
import { getRobotBackendUrl } from "@/lib/backend-urls";

export type GuardedRemediationResult = {
  ok: boolean;
  blockedReason: string | null;
  runId: string | null;
  checks: {
    dryRunFresh: boolean;
    changeWindow: boolean;
    blastRadiusAllowed: boolean;
  };
};

type RobotExecutionReceipt = {
  ok: boolean;
  steps?: { label?: string; status?: string; output?: unknown }[];
  receipt?: Record<string, unknown>;
};

export type RemediationRunRow = {
  id: string;
  playbookId: string;
  triggerSource: "incident" | "automation" | "manual";
  dryRunOk: boolean;
  executionOk: boolean;
  executionMode: "simulated" | "connector";
  blockedReason: string | null;
  createdAt: string;
  checks: {
    dryRunFresh: boolean;
    changeWindow: boolean;
    blastRadiusAllowed: boolean;
  };
};

export async function runGuardedRemediation(input: {
  supabase: SupabaseClient;
  userId: string;
  playbookId: string;
  approvalNote: string;
  rollbackPlan: string;
  incidentId?: string | null;
  triggerSource: "incident" | "automation" | "manual";
  orgId?: string | null;
}): Promise<GuardedRemediationResult> {
  const recentDryRun = await input.supabase
    .from("automation_dry_runs")
    .select("ok, created_at")
    .eq("user_id", input.userId)
    .eq("playbook_id", input.playbookId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const hasFreshDryRun = Boolean(
    recentDryRun.data?.ok &&
      Date.now() - new Date(String(recentDryRun.data.created_at ?? 0)).valueOf() <= 2 * 60 * 60 * 1000,
  );

  const decisionBrief = buildDecisionBrief({
    actionLabel: input.playbookId,
    policyHint: input.approvalNote,
    rollbackPlan: input.rollbackPlan,
  });
  const accepted = await listAcceptedPolicyGuardrailsForPlaybook(
    input.supabase,
    input.userId,
    input.playbookId,
  );
  const enforcement = evaluateAcceptedPolicyEnforcement({
    approvalNote: input.approvalNote,
    decisionBlastRadius: decisionBrief.blastRadius,
    hasFreshDryRun,
    enforced: accepted
      ? {
          requireDryRunFresh: accepted.requireDryRunFresh,
          requireChangeWindow: accepted.requireChangeWindow,
          maxBlastRadius: accepted.maxBlastRadius,
        }
      : null,
  });

  let blockedReason = enforcement.blockedReason;
  if (!blockedReason && input.incidentId) {
    const incidentRes = await input.supabase
      .from("incidents")
      .select("service_id")
      .eq("id", input.incidentId)
      .eq("user_id", input.userId)
      .maybeSingle();
    const serviceId = incidentRes.data?.service_id ? String(incidentRes.data.service_id) : null;
    if (serviceId) {
      const burnState = await getLatestBurnStateForService(
        input.supabase,
        input.userId,
        serviceId,
        input.orgId,
      );
      const signals = parseApprovalNoteSignals(input.approvalNote);
      const hasSenior = signals.hasSeniorAcknowledgement;
      const hasWindow = signals.hasChangeWindow;
      if (burnState === "critical" && (!hasSenior || !hasWindow)) {
        blockedReason = SLO_BURN_POLICY_BLOCKED_REASON;
      }
    }
  }
  let executionMode: "simulated" | "connector" = "simulated";
  const robotBase = getRobotBackendUrl();
  if (robotBase) {
    executionMode = "connector";
    try {
      const health = await fetch(`${robotBase}/health`, {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
        headers: { accept: "application/json, text/plain, */*" },
      });
      if (!health.ok && !blockedReason) {
        blockedReason = `Execution blocked: remediation connector health check failed (${health.status}).`;
      }
    } catch {
      if (!blockedReason) {
        blockedReason = "Execution blocked: remediation connector is unreachable.";
      }
    }
  }

  let executionReceipt: Record<string, unknown> = {
    mode: executionMode,
    connector_configured: Boolean(robotBase),
  };
  let robotSteps: NonNullable<RobotExecutionReceipt["steps"]> = [
    { label: "Validate dry-run freshness", status: hasFreshDryRun ? "succeeded" : "failed" },
    { label: "Evaluate policy guardrails", status: blockedReason ? "failed" : "succeeded" },
  ];

  if (!blockedReason && robotBase) {
    try {
      const res = await fetch(`${robotBase}/v1/remediate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          playbook_id: input.playbookId,
          incident_id: input.incidentId ?? null,
          rollback_plan: input.rollbackPlan,
          approval_note: input.approvalNote,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(60_000),
      });
      const json = (await res.json().catch(() => null)) as RobotExecutionReceipt | null;
      if (!res.ok || json?.ok === false) {
        blockedReason = `Execution blocked: remediation connector returned ${res.status}.`;
      } else if (json) {
        executionReceipt = json.receipt ?? { mode: executionMode, connector_status: res.status };
        if (Array.isArray(json.steps) && json.steps.length > 0) {
          robotSteps = json.steps;
        }
      }
    } catch {
      blockedReason = "Execution blocked: remediation connector execution failed.";
    }
  }

  const finalExecuteOk = !blockedReason;
  const insertRes = await input.supabase
    .from("remediation_runs")
    .insert({
      user_id: input.userId,
      org_id: input.orgId ?? null,
      incident_id: input.incidentId ?? null,
      playbook_id: input.playbookId,
      trigger_source: input.triggerSource,
      dry_run_ok: hasFreshDryRun,
      approval_note: input.approvalNote.slice(0, 300),
      rollback_plan: input.rollbackPlan.slice(0, 500),
      execution_ok: finalExecuteOk,
      execution_mode: executionMode,
      blocked_reason: blockedReason,
      guardrail_checks_json: enforcement.checks,
      execution_receipt_json: executionReceipt,
    })
    .select("id")
    .single();

  const runId = insertRes.data?.id ? String(insertRes.data.id) : null;
  if (runId) {
    await input.supabase.from("remediation_run_steps").insert(
      robotSteps.map((step, idx) => ({
        remediation_run_id: runId,
        step_order: idx + 1,
        label: String(step.label ?? `Step ${idx + 1}`).slice(0, 200),
        status: ["planned", "running", "succeeded", "failed", "skipped"].includes(
          String(step.status),
        )
          ? String(step.status)
          : finalExecuteOk
            ? "succeeded"
            : "failed",
        output_json:
          step.output && typeof step.output === "object"
            ? (step.output as Record<string, unknown>)
            : {},
      })),
    );
  }

  return {
    ok: finalExecuteOk,
    blockedReason,
    runId,
    checks: enforcement.checks,
  };
}

export async function listRemediationRunsForIncident(
  supabase: SupabaseClient,
  userId: string,
  incidentId: string,
  limit = 10,
): Promise<RemediationRunRow[]> {
  const { data, error } = await supabase
    .from("remediation_runs")
    .select(
      "id, playbook_id, trigger_source, dry_run_ok, execution_ok, execution_mode, blocked_reason, created_at, guardrail_checks_json",
    )
    .eq("user_id", userId)
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];

  return data.map((row) => {
    const checksRaw =
      (row.guardrail_checks_json as {
        dryRunFresh?: boolean;
        changeWindow?: boolean;
        blastRadiusAllowed?: boolean;
      } | null) ?? null;
    return {
      id: String(row.id),
      playbookId: String(row.playbook_id),
      triggerSource: String(row.trigger_source) as RemediationRunRow["triggerSource"],
      dryRunOk: Boolean(row.dry_run_ok),
      executionOk: Boolean(row.execution_ok),
      executionMode: String(row.execution_mode) as RemediationRunRow["executionMode"],
      blockedReason: row.blocked_reason ? String(row.blocked_reason) : null,
      createdAt: String(row.created_at),
      checks: {
        dryRunFresh: Boolean(checksRaw?.dryRunFresh),
        changeWindow: Boolean(checksRaw?.changeWindow),
        blastRadiusAllowed: Boolean(checksRaw?.blastRadiusAllowed),
      },
    };
  });
}
