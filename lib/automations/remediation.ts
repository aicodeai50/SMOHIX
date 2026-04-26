import type { SupabaseClient } from "@supabase/supabase-js";

import { evaluateAcceptedPolicyEnforcement } from "@/lib/approvals/policy";
import { listAcceptedPolicyGuardrailsForPlaybook } from "@/lib/approvals/policy-suggestions";
import { buildDecisionBrief } from "@/lib/decision-intelligence";

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

  const executeOk = !enforcement.blockedReason;
  const insertRes = await input.supabase
    .from("remediation_runs")
    .insert({
      user_id: input.userId,
      incident_id: input.incidentId ?? null,
      playbook_id: input.playbookId,
      trigger_source: input.triggerSource,
      dry_run_ok: hasFreshDryRun,
      approval_note: input.approvalNote.slice(0, 300),
      rollback_plan: input.rollbackPlan.slice(0, 500),
      execution_ok: executeOk,
      execution_mode: "simulated",
      blocked_reason: enforcement.blockedReason,
      guardrail_checks_json: enforcement.checks,
    })
    .select("id")
    .single();

  return {
    ok: executeOk,
    blockedReason: enforcement.blockedReason,
    runId: insertRes.data?.id ? String(insertRes.data.id) : null,
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
