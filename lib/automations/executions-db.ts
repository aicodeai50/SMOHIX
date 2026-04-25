import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ActualOutcome,
  DecisionBrief,
  ExpectedOutcome,
  PolicySuggestion,
} from "@/lib/decision-intelligence";

export type ExecutionDbRow = {
  id: string;
  playbookId: string;
  ok: boolean;
  mode: "simulated" | "connector";
  rollbackPlan: string;
  approvalNote: string;
  incidentId: string | null;
  createdAt: string;
  decisionBrief: DecisionBrief | null;
  expectedOutcome: ExpectedOutcome | null;
  actualOutcome: ActualOutcome | null;
  decisionAccuracyScore: number | null;
  policySuggestions: PolicySuggestion[];
};

export async function insertAutomationExecution(
  supabase: SupabaseClient,
  input: {
    userId: string;
    playbookId: string;
    ok: boolean;
    mode: "simulated" | "connector";
    rollbackPlan: string;
    approvalNote: string;
    incidentId?: string | null;
    decisionBrief: DecisionBrief;
    expectedOutcome: ExpectedOutcome;
    actualOutcome: ActualOutcome;
    decisionAccuracyScore: number;
    policySuggestions: PolicySuggestion[];
  },
): Promise<{ ok: true; id: string; createdAt: string } | { ok: false; reason: string }> {
  const { data, error } = await supabase
    .from("automation_executions")
    .insert({
      user_id: input.userId,
      playbook_id: input.playbookId,
      ok: input.ok,
      mode: input.mode,
      rollback_plan: input.rollbackPlan,
      approval_note: input.approvalNote,
      incident_id: input.incidentId ?? null,
      decision_brief_json: input.decisionBrief,
      expected_outcome_json: input.expectedOutcome,
      actual_outcome_json: input.actualOutcome,
      decision_accuracy_score: input.decisionAccuracyScore,
      policy_suggestions_json: input.policySuggestions,
    })
    .select("id, created_at")
    .single();

  if (error || !data?.id) {
    return { ok: false, reason: error?.message ?? "Execution insert failed." };
  }
  return {
    ok: true,
    id: data.id as string,
    createdAt: String(data.created_at),
  };
}

export async function listAutomationExecutionsForUser(
  supabase: SupabaseClient,
  userId: string,
  limit = 20,
): Promise<ExecutionDbRow[]> {
  const { data, error } = await supabase
    .from("automation_executions")
    .select(
      "id, playbook_id, ok, mode, rollback_plan, approval_note, incident_id, created_at, decision_brief_json, expected_outcome_json, actual_outcome_json, decision_accuracy_score, policy_suggestions_json",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];

  return data.map((row) => ({
    id: String(row.id),
    playbookId: String(row.playbook_id),
    ok: Boolean(row.ok),
    mode: (String(row.mode) === "connector" ? "connector" : "simulated") as
      | "simulated"
      | "connector",
    rollbackPlan: String(row.rollback_plan ?? ""),
    approvalNote: String(row.approval_note ?? ""),
    incidentId: row.incident_id ? String(row.incident_id) : null,
    createdAt: String(row.created_at),
    decisionBrief: (row.decision_brief_json as DecisionBrief | null) ?? null,
    expectedOutcome: (row.expected_outcome_json as ExpectedOutcome | null) ?? null,
    actualOutcome: (row.actual_outcome_json as ActualOutcome | null) ?? null,
    decisionAccuracyScore:
      typeof row.decision_accuracy_score === "number"
        ? row.decision_accuracy_score
        : null,
    policySuggestions: Array.isArray(row.policy_suggestions_json)
      ? (row.policy_suggestions_json as PolicySuggestion[])
      : [],
  }));
}
