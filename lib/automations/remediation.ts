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
