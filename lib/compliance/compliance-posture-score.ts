import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildBaselineComparisonPack,
  type FrameworkBaselineRow,
} from "@/lib/compliance/baseline-comparison";
import {
  buildFrameworkRiskCells,
  computeOverallRiskScore,
  riskScoreToLevel,
  type RiskHeatLevel,
} from "@/lib/compliance/compliance-risk-heatmap";
import { buildComplianceProgramDashboard } from "@/lib/compliance/program-dashboard";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listThirdPartyVendors } from "@/lib/third-party-risk/data";

export const COMPLIANCE_POSTURE_SCORE_VERSION = "smohix-compliance-posture-score/1";

export const POSTURE_PILLAR_WEIGHTS = {
  readiness: 0.4,
  attestations: 0.2,
  vendors: 0.15,
  gapClosure: 0.1,
  riskMitigation: 0.15,
} as const;

export type PostureGrade = "A" | "B" | "C" | "D" | "F";

export type PosturePillarId = keyof typeof POSTURE_PILLAR_WEIGHTS;

export type PosturePillar = {
  id: PosturePillarId;
  label: string;
  score: number;
  weight: number;
  contribution: number;
  detail: string;
  href: string;
};

export type PostureDriver = {
  label: string;
  impactPoints: number;
  href: string;
};

export type CompliancePostureScorePack = {
  version: typeof COMPLIANCE_POSTURE_SCORE_VERSION;
  generatedAt: string;
  periodDays: number;
  orgId: string | null;
  postureScore: number;
  grade: PostureGrade;
  gradeLabel: string;
  riskLevel: RiskHeatLevel;
  overallRiskScore: number;
  readinessTrendDelta: number;
  pillars: PosturePillar[];
  drivers: PostureDriver[];
  programReadinessPercent: number;
  attestationClosurePercent: number;
  vendorReadinessPercent: number;
  gapClosurePercent: number;
  openGapRemediations: number;
  attestationOverdue: number;
};

export function scoreToGrade(score: number): PostureGrade {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function gradeLabel(grade: PostureGrade): string {
  switch (grade) {
    case "A":
      return "Strong posture";
    case "B":
      return "Maturing posture";
    case "C":
      return "Developing posture";
    case "D":
      return "At risk";
    default:
      return "Critical attention";
  }
}

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

export function computeAttestationClosurePercent(input: {
  total: number;
  attested: number;
}): number {
  if (input.total <= 0) return 0;
  return clampScore((input.attested / input.total) * 100);
}

export function computeGapClosurePercent(input: {
  open: number;
  inProgress: number;
  resolved: number;
  dismissed: number;
}): number {
  const tracked = input.open + input.inProgress + input.resolved + input.dismissed;
  if (tracked <= 0) return 100;
  return clampScore(((input.resolved + input.dismissed) / tracked) * 100);
}

export function computeVendorReadinessPercent(
  vendors: { readinessPercent: number }[],
): number {
  if (vendors.length === 0) return 0;
  const avg = vendors.reduce((s, v) => s + v.readinessPercent, 0) / vendors.length;
  return clampScore(avg);
}

export function averageReadinessDelta(rows: FrameworkBaselineRow[]): number {
  if (rows.length === 0) return 0;
  const sum = rows.reduce((s, r) => s + r.readinessDelta, 0);
  return Math.round((sum / rows.length) * 10) / 10;
}

export function buildPosturePillars(input: {
  readiness: number;
  attestationClosure: number;
  vendorReadiness: number;
  gapClosure: number;
  riskMitigation: number;
  attestationOverdue: number;
  openGaps: number;
  vendorCount: number;
}): PosturePillar[] {
  const weights = POSTURE_PILLAR_WEIGHTS;
  const pillars: Omit<PosturePillar, "contribution">[] = [
    {
      id: "readiness",
      label: "Framework readiness",
      score: input.readiness,
      weight: weights.readiness,
      detail: "Weighted continuous assessment across eight framework packs",
      href: "/governance/compliance/baseline-comparison",
    },
    {
      id: "attestations",
      label: "Attestation closure",
      score: input.attestationClosure,
      weight: weights.attestations,
      detail:
        input.attestationOverdue > 0
          ? `${input.attestationOverdue} overdue attestation(s) reduce closure score`
          : "Control attestations signed vs total assigned",
      href: "/governance/compliance/attestations",
    },
    {
      id: "vendors",
      label: "Vendor readiness",
      score: input.vendorReadiness,
      weight: weights.vendors,
      detail:
        input.vendorCount > 0
          ? `Average readiness across ${input.vendorCount} third-party vendors`
          : "No vendors in register — neutral vendor pillar",
      href: "/governance/third-party-risk",
    },
    {
      id: "gapClosure",
      label: "Gap remediation",
      score: input.gapClosure,
      weight: weights.gapClosure,
      detail:
        input.openGaps > 0
          ? `${input.openGaps} open or in-progress gap remediations`
          : "Assessment gaps tracked to resolution",
      href: "/governance/compliance/runbooks",
    },
    {
      id: "riskMitigation",
      label: "Risk mitigation",
      score: input.riskMitigation,
      weight: weights.riskMitigation,
      detail: "Inverse of composite framework and vendor risk concentration",
      href: "/governance/compliance/risk-heatmap",
    },
  ];

  return pillars.map((p) => ({
    ...p,
    contribution: Math.round(p.score * p.weight * 10) / 10,
  }));
}

export function computeUnifiedPostureScore(pillars: PosturePillar[]): number {
  const total = pillars.reduce((s, p) => s + p.score * p.weight, 0);
  return clampScore(total);
}

export function buildPostureDrivers(input: {
  pillars: PosturePillar[];
  frameworkRows: FrameworkBaselineRow[];
  attestationOverdue: number;
  openGapRemediations: number;
  criticalVendorCount: number;
}): PostureDriver[] {
  const drivers: PostureDriver[] = [];

  for (const pillar of input.pillars) {
    if (pillar.score >= 60) continue;
    drivers.push({
      label: `${pillar.label} at ${pillar.score}%`,
      impactPoints: Math.round((60 - pillar.score) * pillar.weight),
      href: pillar.href,
    });
  }

  const weakest = [...input.frameworkRows].sort((a, b) => a.readinessPercent - b.readinessPercent)[0];
  if (weakest && weakest.readinessPercent < 60) {
    drivers.push({
      label: `Low ${weakest.label} readiness (${weakest.readinessPercent}%)`,
      impactPoints: 8,
      href: "/governance/compliance/baseline-comparison",
    });
  }

  if (input.attestationOverdue > 0) {
    drivers.push({
      label: `${input.attestationOverdue} overdue attestation(s)`,
      impactPoints: 6,
      href: "/governance/compliance/attestations",
    });
  }

  if (input.openGapRemediations > 0) {
    drivers.push({
      label: `${input.openGapRemediations} open gap remediation(s)`,
      impactPoints: 5,
      href: "/governance/compliance/runbooks",
    });
  }

  if (input.criticalVendorCount > 0) {
    drivers.push({
      label: `${input.criticalVendorCount} critical-tier vendor(s)`,
      impactPoints: 5,
      href: "/governance/third-party-risk",
    });
  }

  return drivers.sort((a, b) => b.impactPoints - a.impactPoints).slice(0, 8);
}

export function buildCompliancePostureScorePackFromParts(input: {
  orgId: string | null;
  periodDays: number;
  programReadinessPercent: number;
  attestationClosurePercent: number;
  vendorReadinessPercent: number;
  gapClosurePercent: number;
  overallRiskScore: number;
  readinessTrendDelta: number;
  attestationOverdue: number;
  openGapRemediations: number;
  frameworkRows: FrameworkBaselineRow[];
  criticalVendorCount: number;
  vendorCount: number;
  generatedAt?: string;
}): CompliancePostureScorePack {
  const riskMitigation = clampScore(100 - input.overallRiskScore);
  const pillars = buildPosturePillars({
    readiness: input.programReadinessPercent,
    attestationClosure: input.attestationClosurePercent,
    vendorReadiness: input.vendorReadinessPercent,
    gapClosure: input.gapClosurePercent,
    riskMitigation,
    attestationOverdue: input.attestationOverdue,
    openGaps: input.openGapRemediations,
    vendorCount: input.vendorCount,
  });

  const postureScore = computeUnifiedPostureScore(pillars);
  const grade = scoreToGrade(postureScore);

  return {
    version: COMPLIANCE_POSTURE_SCORE_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    periodDays: input.periodDays,
    orgId: input.orgId,
    postureScore,
    grade,
    gradeLabel: gradeLabel(grade),
    riskLevel: riskScoreToLevel(input.overallRiskScore),
    overallRiskScore: input.overallRiskScore,
    readinessTrendDelta: input.readinessTrendDelta,
    pillars,
    drivers: buildPostureDrivers({
      pillars,
      frameworkRows: input.frameworkRows,
      attestationOverdue: input.attestationOverdue,
      openGapRemediations: input.openGapRemediations,
      criticalVendorCount: input.criticalVendorCount,
    }),
    programReadinessPercent: input.programReadinessPercent,
    attestationClosurePercent: input.attestationClosurePercent,
    vendorReadinessPercent: input.vendorReadinessPercent,
    gapClosurePercent: input.gapClosurePercent,
    openGapRemediations: input.openGapRemediations,
    attestationOverdue: input.attestationOverdue,
  };
}

export async function buildCompliancePostureScorePack(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    auditorReadOnly?: boolean;
    supabase?: SupabaseClient;
  },
): Promise<CompliancePostureScorePack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const periodDays = opts.periodDays ?? 30;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const [program, baseline, vendors] = await Promise.all([
    buildComplianceProgramDashboard(userId, { ...opts, periodDays, supabase }),
    buildBaselineComparisonPack(userId, { ...opts, periodDays, supabase }),
    listThirdPartyVendors(userId, opts.orgId, supabase),
  ]);

  if (!program || !baseline) return null;

  const attestationClosure = computeAttestationClosurePercent({
    total: program.attestations.total,
    attested: program.attestations.attested,
  });

  const gapClosure = computeGapClosurePercent(program.gapRemediations);
  const vendorReadiness = computeVendorReadinessPercent(vendors);

  const frameworkCells = buildFrameworkRiskCells(baseline.rows);
  const overallRiskScore = computeOverallRiskScore(frameworkCells, vendors);

  return buildCompliancePostureScorePackFromParts({
    orgId: opts.orgId,
    periodDays,
    programReadinessPercent: program.overallReadinessPercent,
    attestationClosurePercent: attestationClosure,
    vendorReadinessPercent: vendorReadiness,
    gapClosurePercent: gapClosure,
    overallRiskScore,
    readinessTrendDelta: averageReadinessDelta(baseline.rows),
    attestationOverdue: program.attestations.overdue,
    openGapRemediations: program.gapRemediations.open + program.gapRemediations.inProgress,
    frameworkRows: baseline.rows,
    criticalVendorCount: vendors.filter((v) => v.riskTier === "critical").length,
    vendorCount: vendors.length,
  });
}

export function compliancePostureScoreToCsv(pack: CompliancePostureScorePack): string {
  const lines = [
    "section,key,value,detail",
    `summary,posture_score,${pack.postureScore},grade=${pack.grade}`,
    `summary,risk_score,${pack.overallRiskScore},level=${pack.riskLevel}`,
    `summary,readiness,${pack.programReadinessPercent},`,
    `summary,attestation_closure,${pack.attestationClosurePercent},`,
    `summary,vendor_readiness,${pack.vendorReadinessPercent},`,
    `summary,gap_closure,${pack.gapClosurePercent},`,
  ];
  for (const p of pack.pillars) {
    lines.push(`pillar,${p.id},${p.score},weight=${p.weight};contribution=${p.contribution}`);
  }
  for (const d of pack.drivers) {
    lines.push(`driver,impact,${d.impactPoints},${JSON.stringify(d.label)}`);
  }
  return `${lines.join("\n")}\n`;
}
