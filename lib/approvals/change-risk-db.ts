import type { SupabaseClient } from "@supabase/supabase-js";

import type { ChangeRiskAssessment } from "@/lib/approvals/change-risk";

export type ChangeRiskScoreRow = {
  id: string;
  playbookId: string;
  incidentId: string | null;
  executionId: string | null;
  riskScore: number;
  riskTier: "low" | "medium" | "high" | "critical";
  factors: string[];
  blocked: boolean;
  blockedReason: string | null;
  createdAt: string;
};

export async function insertChangeRiskScore(
  supabase: SupabaseClient,
  input: {
    userId: string;
    playbookId: string;
    incidentId?: string | null;
    executionId?: string | null;
    assessment: ChangeRiskAssessment;
    blocked: boolean;
    blockedReason?: string | null;
  },
): Promise<void> {
  await supabase.from("change_risk_scores").insert({
    user_id: input.userId,
    playbook_id: input.playbookId,
    incident_id: input.incidentId ?? null,
    execution_id: input.executionId ?? null,
    risk_score: input.assessment.score,
    risk_tier: input.assessment.tier,
    factors_json: input.assessment.factors,
    blocked: input.blocked,
    blocked_reason: input.blockedReason ?? null,
  });
}

export async function listRecentChangeRiskScoresForUser(
  supabase: SupabaseClient,
  userId: string,
  limit = 30,
): Promise<ChangeRiskScoreRow[]> {
  const { data, error } = await supabase
    .from("change_risk_scores")
    .select(
      "id, playbook_id, incident_id, execution_id, risk_score, risk_tier, factors_json, blocked, blocked_reason, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];

  return data.map((row) => ({
    id: String(row.id),
    playbookId: String(row.playbook_id),
    incidentId: row.incident_id ? String(row.incident_id) : null,
    executionId: row.execution_id ? String(row.execution_id) : null,
    riskScore: Number(row.risk_score ?? 0),
    riskTier: String(row.risk_tier ?? "low") as ChangeRiskScoreRow["riskTier"],
    factors: Array.isArray(row.factors_json) ? (row.factors_json as string[]) : [],
    blocked: Boolean(row.blocked),
    blockedReason: row.blocked_reason ? String(row.blocked_reason) : null,
    createdAt: String(row.created_at),
  }));
}
