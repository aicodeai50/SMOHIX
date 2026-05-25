import type { SupabaseClient } from "@supabase/supabase-js";

import { listAcceptedPolicyGuardrailsByPlaybook } from "@/lib/approvals/policy-suggestions";
import { listAuditEventTypesForCompliance } from "@/lib/audit/data";
import { COMPLIANCE_CONTROLS } from "@/lib/compliance/catalog";
import { complianceControlsForAuditEvent } from "@/lib/compliance/map-audit";
import {
  complianceControlsForAcceptedPolicy,
} from "@/lib/compliance/map-policy";
import type { ComplianceCoverageRow, ComplianceSummary } from "@/lib/compliance/types";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const DEFAULT_WINDOW_DAYS = 30;

function sinceIsoFromDays(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function getComplianceCoverageSummary(
  userId: string,
  opts?: {
    sinceIso?: string;
    untilIso?: string;
    orgId?: string | null;
    supabase?: SupabaseClient;
  },
): Promise<ComplianceSummary> {
  const sinceIso = opts?.sinceIso ?? sinceIsoFromDays(DEFAULT_WINDOW_DAYS);
  const auditCounts = new Map<string, number>();
  const policyCounts = new Map<string, number>();
  let auditEventsScanned = 0;
  let acceptedPolicyCount = 0;

  if (hasSupabaseAuth() && userId) {
    const supabase = opts?.supabase ?? (await createServerSupabaseClient());
    const auditRows = await listAuditEventTypesForCompliance(userId, {
      sinceIso,
      untilIso: opts?.untilIso,
      orgId: opts?.orgId,
      supabase,
    });

    for (const row of auditRows) {
      auditEventsScanned += 1;
      for (const ref of complianceControlsForAuditEvent(String(row.event_type))) {
        auditCounts.set(ref.id, (auditCounts.get(ref.id) ?? 0) + 1);
      }
    }

    const accepted = await listAcceptedPolicyGuardrailsByPlaybook(supabase, userId);
    acceptedPolicyCount = Object.keys(accepted).length;
    for (const guardrails of Object.values(accepted)) {
      for (const ref of complianceControlsForAcceptedPolicy(guardrails)) {
        policyCounts.set(ref.id, (policyCounts.get(ref.id) ?? 0) + 1);
      }
    }
  }

  const rows: ComplianceCoverageRow[] = COMPLIANCE_CONTROLS.map((control) => {
    const auditEvidenceCount = auditCounts.get(control.id) ?? 0;
    const policyEvidenceCount = policyCounts.get(control.id) ?? 0;
    let status: ComplianceCoverageRow["status"] = "none";
    if (auditEvidenceCount > 0 && policyEvidenceCount > 0) status = "covered";
    else if (auditEvidenceCount > 0 || policyEvidenceCount > 0) status = "partial";
    return { control, auditEvidenceCount, policyEvidenceCount, status };
  });

  const covered = rows.filter((r) => r.status === "covered" || r.status === "partial").length;
  const coveragePercent =
    rows.length > 0 ? Math.round((covered / rows.length) * 1000) / 10 : 0;

  return {
    sinceIso,
    auditEventsScanned,
    acceptedPolicyCount,
    coveragePercent,
    rows,
  };
}
