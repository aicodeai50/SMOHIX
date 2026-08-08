import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildCompliancePostureScorePack,
  clampScore,
  gradeLabel,
  scoreToGrade,
  type CompliancePostureScorePack,
  type PostureGrade,
} from "@/lib/compliance/compliance-posture-score";
import {
  buildInheritedControlCoverageGapPackFromVendors,
  type InheritedControlCoverageGapPack,
} from "@/lib/compliance/inherited-control-coverage-gaps";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listThirdPartyVendors } from "@/lib/third-party-risk/data";

export const COMPLIANCE_CONTROL_HEALTH_SCORECARD_VERSION =
  "smohix-compliance-control-health-scorecard/1";

export const HEALTH_SCORE_WEIGHTS = {
  posture: 0.45,
  vendors: 0.3,
  gapClosure: 0.25,
} as const;

export type HealthStatus = "healthy" | "watch" | "critical";

export type HealthMetricId =
  | "posture"
  | "readiness"
  | "vendors"
  | "gap_closure"
  | "attestations";

export type HealthMetricRow = {
  id: HealthMetricId;
  label: string;
  score: number;
  status: HealthStatus;
  weight: number | null;
  detail: string;
  href: string;
};

export type ComplianceControlHealthScorecardPack = {
  version: typeof COMPLIANCE_CONTROL_HEALTH_SCORECARD_VERSION;
  generatedAt: string;
  periodDays: number;
  orgId: string | null;
  healthScore: number;
  grade: PostureGrade;
  gradeLabel: string;
  postureScore: number;
  vendorHealthScore: number;
  gapClosurePercent: number;
  programReadinessPercent: number;
  attestationClosurePercent: number;
  vendorCount: number;
  vendorsWithGaps: number;
  totalInheritedGaps: number;
  openGapRemediations: number;
  leadershipSummary: string;
  metrics: HealthMetricRow[];
  leadershipActions: string[];
};

export function scoreToHealthStatus(score: number): HealthStatus {
  if (score >= 75) return "healthy";
  if (score >= 50) return "watch";
  return "critical";
}

export function computeVendorHealthScore(input: {
  vendorReadinessPercent: number;
  vendorCount: number;
  vendorsWithGaps: number;
  criticalVendorGapCount: number;
}): number {
  if (input.vendorCount <= 0) {
    return 100;
  }
  const gapShare = input.vendorsWithGaps / input.vendorCount;
  const criticalShare = input.criticalVendorGapCount / input.vendorCount;
  const gapPenalty = clampScore(gapShare * 45 + criticalShare * 30);
  return clampScore(input.vendorReadinessPercent * 0.6 + (100 - gapPenalty) * 0.4);
}

export function computeCompositeHealthScore(input: {
  postureScore: number;
  vendorHealthScore: number;
  gapClosurePercent: number;
}): number {
  const w = HEALTH_SCORE_WEIGHTS;
  return clampScore(
    input.postureScore * w.posture +
      input.vendorHealthScore * w.vendors +
      input.gapClosurePercent * w.gapClosure,
  );
}

export function buildHealthMetricRows(input: {
  postureScore: number;
  programReadinessPercent: number;
  vendorHealthScore: number;
  gapClosurePercent: number;
  attestationClosurePercent: number;
  vendorCount: number;
  vendorsWithGaps: number;
  totalInheritedGaps: number;
  openGapRemediations: number;
  attestationOverdue: number;
}): HealthMetricRow[] {
  const rows: Omit<HealthMetricRow, "status">[] = [
    {
      id: "posture",
      label: "Unified posture",
      score: input.postureScore,
      weight: HEALTH_SCORE_WEIGHTS.posture,
      detail: "Weighted GRC posture across readiness, attestations, vendors, gaps, and risk",
      href: "/governance/compliance/posture-score",
    },
    {
      id: "readiness",
      label: "Program readiness",
      score: input.programReadinessPercent,
      weight: null,
      detail: "Continuous assessment readiness across eight framework packs",
      href: "/governance/compliance/program",
    },
    {
      id: "vendors",
      label: "Vendor control health",
      score: input.vendorHealthScore,
      weight: HEALTH_SCORE_WEIGHTS.vendors,
      detail:
        input.vendorCount > 0
          ? `${input.vendorsWithGaps} vendor(s) with inherited control gaps (${input.totalInheritedGaps} total)`
          : "No vendors in register — vendor dimension neutral",
      href: "/governance/compliance/inherited-control-gaps",
    },
    {
      id: "gap_closure",
      label: "Gap remediation closure",
      score: input.gapClosurePercent,
      weight: HEALTH_SCORE_WEIGHTS.gapClosure,
      detail:
        input.openGapRemediations > 0
          ? `${input.openGapRemediations} open or in-progress gap remediation(s)`
          : "Assessment gaps tracked to resolution or dismissal",
      href: "/governance/compliance/runbooks",
    },
    {
      id: "attestations",
      label: "Attestation closure",
      score: input.attestationClosurePercent,
      weight: null,
      detail:
        input.attestationOverdue > 0
          ? `${input.attestationOverdue} overdue attestation(s) on control sign-off`
          : "Control attestations signed vs total assigned",
      href: "/governance/compliance/attestations",
    },
  ];

  return rows.map((r) => ({
    ...r,
    status: scoreToHealthStatus(r.score),
  }));
}

export function buildLeadershipSummary(healthScore: number, grade: PostureGrade): string {
  const label = gradeLabel(grade);
  return `Org control health ${healthScore}/100 (${grade}) — ${label} for leadership review.`;
}

export function buildScorecardLeadershipActions(input: {
  metrics: HealthMetricRow[];
  postureScore: number;
  vendorsWithGaps: number;
  criticalVendorGapCount: number;
  openGapRemediations: number;
  attestationOverdue: number;
}): string[] {
  const actions: string[] = [];

  const criticalMetrics = input.metrics.filter((m) => m.status === "critical");
  for (const m of criticalMetrics.slice(0, 2)) {
    actions.push(`Elevate ${m.label.toLowerCase()} (currently ${m.score}%) — see linked console view.`);
  }

  if (input.attestationOverdue > 0) {
    actions.push(
      `Close ${input.attestationOverdue} overdue control attestation(s) before the next board cycle.`,
    );
  }

  if (input.openGapRemediations > 0) {
    actions.push(
      `Advance ${input.openGapRemediations} open gap remediation(s) via compliance runbooks.`,
    );
  }

  if (input.criticalVendorGapCount > 0) {
    actions.push(
      `Remediate inherited control evidence on ${input.criticalVendorGapCount} critical-tier vendor(s).`,
    );
  } else if (input.vendorsWithGaps > 0) {
    actions.push(
      `Resolve inherited control coverage on ${input.vendorsWithGaps} vendor(s) in the gap report.`,
    );
  }

  if (input.postureScore < 60) {
    actions.push(
      `Raise unified posture above 60 (currently ${input.postureScore}) with targeted evidence and attestation work.`,
    );
  }

  if (actions.length === 0) {
    actions.push(
      "Maintain quarterly leadership review cadence; control health metrics are within target bands.",
    );
  }

  return actions.slice(0, 6);
}

export function buildComplianceControlHealthScorecardFromParts(input: {
  orgId: string | null;
  periodDays: number;
  posture: CompliancePostureScorePack;
  vendorGaps: InheritedControlCoverageGapPack;
  generatedAt?: string;
}): ComplianceControlHealthScorecardPack {
  const { posture, vendorGaps } = input;

  const vendorHealthScore = computeVendorHealthScore({
    vendorReadinessPercent: posture.vendorReadinessPercent,
    vendorCount: vendorGaps.vendorCount,
    vendorsWithGaps: vendorGaps.vendorsWithGaps,
    criticalVendorGapCount: vendorGaps.criticalVendorGapCount,
  });

  const healthScore = computeCompositeHealthScore({
    postureScore: posture.postureScore,
    vendorHealthScore,
    gapClosurePercent: posture.gapClosurePercent,
  });

  const grade = scoreToGrade(healthScore);
  const metrics = buildHealthMetricRows({
    postureScore: posture.postureScore,
    programReadinessPercent: posture.programReadinessPercent,
    vendorHealthScore,
    gapClosurePercent: posture.gapClosurePercent,
    attestationClosurePercent: posture.attestationClosurePercent,
    vendorCount: vendorGaps.vendorCount,
    vendorsWithGaps: vendorGaps.vendorsWithGaps,
    totalInheritedGaps: vendorGaps.totalGapCount,
    openGapRemediations: posture.openGapRemediations,
    attestationOverdue: posture.attestationOverdue,
  });

  return {
    version: COMPLIANCE_CONTROL_HEALTH_SCORECARD_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    periodDays: input.periodDays,
    orgId: input.orgId,
    healthScore,
    grade,
    gradeLabel: gradeLabel(grade),
    postureScore: posture.postureScore,
    vendorHealthScore,
    gapClosurePercent: posture.gapClosurePercent,
    programReadinessPercent: posture.programReadinessPercent,
    attestationClosurePercent: posture.attestationClosurePercent,
    vendorCount: vendorGaps.vendorCount,
    vendorsWithGaps: vendorGaps.vendorsWithGaps,
    totalInheritedGaps: vendorGaps.totalGapCount,
    openGapRemediations: posture.openGapRemediations,
    leadershipSummary: buildLeadershipSummary(healthScore, grade),
    metrics,
    leadershipActions: buildScorecardLeadershipActions({
      metrics,
      postureScore: posture.postureScore,
      vendorsWithGaps: vendorGaps.vendorsWithGaps,
      criticalVendorGapCount: vendorGaps.criticalVendorGapCount,
      openGapRemediations: posture.openGapRemediations,
      attestationOverdue: posture.attestationOverdue,
    }),
  };
}

export async function buildComplianceControlHealthScorecardPack(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<ComplianceControlHealthScorecardPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const periodDays = opts.periodDays ?? 30;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const [posture, vendors] = await Promise.all([
    buildCompliancePostureScorePack(userId, { ...opts, periodDays, supabase }),
    listThirdPartyVendors(userId, opts.orgId, supabase),
  ]);

  if (!posture) return null;

  const vendorGaps = buildInheritedControlCoverageGapPackFromVendors({
    orgId: opts.orgId,
    periodDays,
    vendors,
  });

  return buildComplianceControlHealthScorecardFromParts({
    orgId: opts.orgId,
    periodDays,
    posture,
    vendorGaps,
  });
}

export function complianceControlHealthScorecardToCsv(
  pack: ComplianceControlHealthScorecardPack,
): string {
  const lines = [
    "section,key,value,detail",
    `summary,health_score,${pack.healthScore},grade=${pack.grade}`,
    `summary,posture_score,${pack.postureScore},`,
    `summary,vendor_health,${pack.vendorHealthScore},`,
    `summary,gap_closure,${pack.gapClosurePercent},`,
    `summary,readiness,${pack.programReadinessPercent},`,
    `summary,attestation_closure,${pack.attestationClosurePercent},`,
    `summary,vendors_with_gaps,${pack.vendorsWithGaps},total_gaps=${pack.totalInheritedGaps}`,
  ];
  for (const m of pack.metrics) {
    lines.push(`metric,${m.id},${m.score},status=${m.status};${JSON.stringify(m.label)}`);
  }
  for (const a of pack.leadershipActions) {
    lines.push(`action,,,${JSON.stringify(a)}`);
  }
  return `${lines.join("\n")}\n`;
}
