import type { SupabaseClient } from "@supabase/supabase-js";

import {
  policyBlockReasonCodeFromMessage,
  policyBlockReasonLabel,
  type PolicyBlockReasonCode,
} from "@/lib/approvals/policy-block-reasons";

export type PolicyBlockWindow = "7d" | "30d";

export type PolicyBlockSummary = {
  window: PolicyBlockWindow;
  count: number;
  priorCount: number;
  delta: number;
  topReasonCode: PolicyBlockReasonCode | null;
  topReasonLabel: string | null;
  distribution: { code: PolicyBlockReasonCode; label: string; count: number }[];
};

function windowMs(window: PolicyBlockWindow): number {
  return window === "30d" ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
}

export async function getPolicyBlockSummaryForUser(
  supabase: SupabaseClient,
  userId: string,
  window: PolicyBlockWindow = "7d",
): Promise<PolicyBlockSummary> {
  const nowMs = new Date().valueOf();
  const currentStartMs = nowMs - windowMs(window);
  const priorStartMs = currentStartMs - windowMs(window);
  const priorStartIso = new Date(priorStartMs).toISOString();

  const { data } = await supabase
    .from("audit_log")
    .select("created_at, details")
    .eq("user_id", userId)
    .eq("event_type", "automation.execution_blocked_policy")
    .gte("created_at", priorStartIso)
    .limit(400);

  let count = 0;
  let priorCount = 0;
  const distributionCounts: Partial<Record<PolicyBlockReasonCode, number>> = {};

  for (const row of data ?? []) {
    const createdAtMs = new Date(String(row.created_at ?? "")).valueOf();
    if (!Number.isFinite(createdAtMs)) continue;
    if (createdAtMs < priorStartMs) continue;
    if (createdAtMs < currentStartMs) {
      priorCount += 1;
      continue;
    }
    count += 1;
    const details = (row.details as { blocked_reason_code?: string; blocked_reason?: string } | null) ?? null;
    const code = details?.blocked_reason_code
      ? (String(details.blocked_reason_code) as PolicyBlockReasonCode)
      : policyBlockReasonCodeFromMessage(String(details?.blocked_reason ?? ""));
    distributionCounts[code] = (distributionCounts[code] ?? 0) + 1;
  }

  const distribution = (Object.entries(distributionCounts) as [PolicyBlockReasonCode, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([code, c]) => ({ code, label: policyBlockReasonLabel(code), count: c }));

  const topReasonCode = distribution[0]?.code ?? null;

  return {
    window,
    count,
    priorCount,
    delta: count - priorCount,
    topReasonCode,
    topReasonLabel: topReasonCode ? policyBlockReasonLabel(topReasonCode) : null,
    distribution,
  };
}
