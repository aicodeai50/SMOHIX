import type { SupabaseClient } from "@supabase/supabase-js";

import {
  BASELINE_COMPARISON_FRAMEWORKS,
  buildBaselineComparisonPack,
  FRAMEWORK_CONSOLE_PATHS,
  type FrameworkBaselineRow,
} from "@/lib/compliance/baseline-comparison";
import { buildComplianceProgramDashboard } from "@/lib/compliance/program-dashboard";
import type { ComplianceFramework } from "@/lib/compliance/types";
import { escapeCsvField } from "@/lib/audit/csv-escape";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listThirdPartyVendors } from "@/lib/third-party-risk/data";
import type { ThirdPartyVendorRow, VendorCategory, VendorRiskTier } from "@/lib/third-party-risk/types";

export const COMPLIANCE_RISK_HEATMAP_VERSION = "zentro-compliance-risk-heatmap/1";

export type RiskHeatLevel = "low" | "moderate" | "elevated" | "critical";

const FRAMEWORK_LABELS: Record<ComplianceFramework, string> = {
  soc2: "SOC 2",
  iso27001: "ISO 27001",
  pcidss: "PCI DSS",
  hipaa: "HIPAA",
  nist_csf: "NIST CSF",
  cis_v8: "CIS v8",
  cmmc_l2: "CMMC L2",
  gdpr_art32: "GDPR Art. 32",
};

const VENDOR_TIER_WEIGHT: Record<VendorRiskTier, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string> = {
  saas: "SaaS",
  cloud: "Cloud",
  security: "Security",
  data_processor: "Data processor",
  consulting: "Consulting",
  healthcare_baa: "Healthcare BAA",
  other: "Other",
};

export function riskScoreToLevel(score: number): RiskHeatLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "elevated";
  if (score >= 25) return "moderate";
  return "low";
}

export function heatLevelBgClass(level: RiskHeatLevel): string {
  switch (level) {
    case "critical":
      return "bg-danger/35 border-danger/50";
    case "elevated":
      return "bg-warning/25 border-warning/40";
    case "moderate":
      return "bg-amber-400/15 border-amber-400/30";
    default:
      return "bg-emerald-400/10 border-emerald-400/25";
  }
}

export function frameworkRiskScore(row: FrameworkBaselineRow): number {
  const gapPenalty = Math.max(0, -row.readinessDelta) * 2;
  return Math.min(
    100,
    Math.round(
      (100 - row.readinessPercent) * 0.55 +
        row.exceptionCount * 4 +
        row.regressed * 6 +
        gapPenalty,
    ),
  );
}

export function vendorRiskScore(vendor: Pick<ThirdPartyVendorRow, "readinessPercent" | "riskTier">): number {
  const tierBoost = VENDOR_TIER_WEIGHT[vendor.riskTier] * 8;
  return Math.min(100, Math.round((100 - vendor.readinessPercent) * 0.7 + tierBoost));
}

export type FrameworkRiskCell = {
  framework: ComplianceFramework;
  label: string;
  consolePath: string;
  readinessPercent: number;
  readinessDelta: number;
  exceptionCount: number;
  regressed: number;
  riskScore: number;
  level: RiskHeatLevel;
};

export type VendorTierRollup = {
  tier: VendorRiskTier;
  vendorCount: number;
  avgReadinessPercent: number;
  riskScore: number;
  level: RiskHeatLevel;
};

export type VendorCategoryTierCell = {
  category: VendorCategory;
  categoryLabel: string;
  tier: VendorRiskTier;
  vendorCount: number;
  avgReadinessPercent: number;
  riskScore: number;
  level: RiskHeatLevel;
};

export type RiskHotspot = {
  kind: "framework" | "vendor";
  ref: string;
  label: string;
  riskScore: number;
  level: RiskHeatLevel;
  detail: string;
  href: string;
};

export type ComplianceRiskHeatmapPack = {
  version: typeof COMPLIANCE_RISK_HEATMAP_VERSION;
  generatedAt: string;
  periodDays: number;
  orgId: string | null;
  programReadinessPercent: number;
  attestationOverdue: number;
  openGapRemediations: number;
  overallRiskScore: number;
  overallLevel: RiskHeatLevel;
  frameworkCells: FrameworkRiskCell[];
  vendorTierRollup: VendorTierRollup[];
  vendorMatrix: VendorCategoryTierCell[];
  hotspots: RiskHotspot[];
  criticalVendorCount: number;
  highTierVendorCount: number;
};

export function buildFrameworkRiskCells(rows: FrameworkBaselineRow[]): FrameworkRiskCell[] {
  return rows.map((row) => {
    const riskScore = frameworkRiskScore(row);
    return {
      framework: row.framework,
      label: FRAMEWORK_LABELS[row.framework] ?? row.label,
      consolePath: FRAMEWORK_CONSOLE_PATHS[row.framework],
      readinessPercent: row.readinessPercent,
      readinessDelta: row.readinessDelta,
      exceptionCount: row.exceptionCount,
      regressed: row.regressed,
      riskScore,
      level: riskScoreToLevel(riskScore),
    };
  });
}

export function buildVendorTierRollup(vendors: ThirdPartyVendorRow[]): VendorTierRollup[] {
  const tiers: VendorRiskTier[] = ["critical", "high", "medium", "low"];
  return tiers.map((tier) => {
    const subset = vendors.filter((v) => v.riskTier === tier);
    const avgReadinessPercent =
      subset.length > 0
        ? Math.round(
            (subset.reduce((s, v) => s + v.readinessPercent, 0) / subset.length) * 10,
          ) / 10
        : 0;
    const riskScore =
      subset.length > 0
        ? Math.round(
            subset.reduce((s, v) => s + vendorRiskScore(v), 0) / subset.length,
          )
        : 0;
    return {
      tier,
      vendorCount: subset.length,
      avgReadinessPercent,
      riskScore,
      level: riskScoreToLevel(riskScore),
    };
  });
}

export function buildVendorCategoryTierMatrix(vendors: ThirdPartyVendorRow[]): VendorCategoryTierCell[] {
  const categories = Object.keys(VENDOR_CATEGORY_LABELS) as VendorCategory[];
  const tiers: VendorRiskTier[] = ["critical", "high", "medium", "low"];
  const cells: VendorCategoryTierCell[] = [];

  for (const tier of tiers) {
    for (const category of categories) {
      const subset = vendors.filter((v) => v.riskTier === tier && v.category === category);
      const avgReadinessPercent =
        subset.length > 0
          ? Math.round(
              (subset.reduce((s, v) => s + v.readinessPercent, 0) / subset.length) * 10,
            ) / 10
          : 0;
      const riskScore =
        subset.length > 0
          ? Math.round(
              subset.reduce((s, v) => s + vendorRiskScore(v), 0) / subset.length,
            )
          : 0;
      cells.push({
        category,
        categoryLabel: VENDOR_CATEGORY_LABELS[category],
        tier,
        vendorCount: subset.length,
        avgReadinessPercent,
        riskScore,
        level: riskScoreToLevel(riskScore),
      });
    }
  }

  return cells;
}

export function buildRiskHotspots(
  frameworkCells: FrameworkRiskCell[],
  vendors: ThirdPartyVendorRow[],
): RiskHotspot[] {
  const frameworkHotspots: RiskHotspot[] = frameworkCells.map((c) => ({
    kind: "framework" as const,
    ref: c.framework,
    label: c.label,
    riskScore: c.riskScore,
    level: c.level,
    detail: `${c.readinessPercent}% readiness · ${c.exceptionCount} gaps · ${c.regressed} regressed`,
    href: c.consolePath,
  }));

  const vendorHotspots: RiskHotspot[] = vendors.map((v) => {
    const score = vendorRiskScore(v);
    return {
      kind: "vendor" as const,
      ref: v.id,
      label: v.name,
      riskScore: score,
      level: riskScoreToLevel(score),
      detail: `${v.riskTier} tier · ${v.readinessPercent}% control readiness · ${v.category}`,
      href: "/governance/third-party-risk",
    };
  });

  return [...frameworkHotspots, ...vendorHotspots]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 12);
}

export function computeOverallRiskScore(
  frameworkCells: FrameworkRiskCell[],
  vendors: ThirdPartyVendorRow[],
): number {
  const fwAvg =
    frameworkCells.length > 0
      ? frameworkCells.reduce((s, c) => s + c.riskScore, 0) / frameworkCells.length
      : 0;
  const vendorScores = vendors.map((v) => vendorRiskScore(v));
  const vendorAvg =
    vendorScores.length > 0
      ? vendorScores.reduce((s, n) => s + n, 0) / vendorScores.length
      : 0;
  const vendorWeight = vendors.length > 0 ? 0.35 : 0;
  const frameworkWeight = 1 - vendorWeight;
  return Math.round(fwAvg * frameworkWeight + vendorAvg * vendorWeight);
}

export function buildComplianceRiskHeatmapFromInputs(input: {
  orgId: string | null;
  periodDays: number;
  programReadinessPercent: number;
  attestationOverdue: number;
  openGapRemediations: number;
  frameworkRows: FrameworkBaselineRow[];
  vendors: ThirdPartyVendorRow[];
  generatedAt?: string;
}): ComplianceRiskHeatmapPack {
  const frameworkCells = buildFrameworkRiskCells(input.frameworkRows);
  const vendorTierRollup = buildVendorTierRollup(input.vendors);
  const vendorMatrix = buildVendorCategoryTierMatrix(input.vendors);
  const hotspots = buildRiskHotspots(frameworkCells, input.vendors);
  const overallRiskScore = computeOverallRiskScore(frameworkCells, input.vendors);

  return {
    version: COMPLIANCE_RISK_HEATMAP_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    periodDays: input.periodDays,
    orgId: input.orgId,
    programReadinessPercent: input.programReadinessPercent,
    attestationOverdue: input.attestationOverdue,
    openGapRemediations: input.openGapRemediations,
    overallRiskScore,
    overallLevel: riskScoreToLevel(overallRiskScore),
    frameworkCells,
    vendorTierRollup,
    vendorMatrix,
    hotspots,
    criticalVendorCount: input.vendors.filter((v) => v.riskTier === "critical").length,
    highTierVendorCount: input.vendors.filter((v) => v.riskTier === "high").length,
  };
}

export async function buildComplianceRiskHeatmap(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    auditorReadOnly?: boolean;
    supabase?: SupabaseClient;
  },
): Promise<ComplianceRiskHeatmapPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const periodDays = opts.periodDays ?? 30;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const [baseline, program, vendors] = await Promise.all([
    buildBaselineComparisonPack(userId, { ...opts, periodDays, supabase }),
    buildComplianceProgramDashboard(userId, { ...opts, periodDays, supabase }),
    listThirdPartyVendors(userId, opts.orgId, supabase),
  ]);

  if (!baseline || !program) return null;

  return buildComplianceRiskHeatmapFromInputs({
    orgId: opts.orgId,
    periodDays,
    programReadinessPercent: program.overallReadinessPercent,
    attestationOverdue: program.attestations.overdue,
    openGapRemediations: program.gapRemediations.open + program.gapRemediations.inProgress,
    frameworkRows: baseline.rows,
    vendors,
  });
}

export function riskHeatmapToCsv(pack: ComplianceRiskHeatmapPack): string {
  const lines: string[] = [
    "section,ref,label,risk_score,level,readiness_percent,detail",
    `summary,overall,Program rollup,${pack.overallRiskScore},${pack.overallLevel},${pack.programReadinessPercent},attestations_overdue=${pack.attestationOverdue};gap_remediations_open=${pack.openGapRemediations}`,
  ];

  for (const c of pack.frameworkCells) {
    lines.push(
      [
        "framework",
        c.framework,
        escapeCsvField(c.label),
        c.riskScore,
        c.level,
        c.readinessPercent,
        escapeCsvField(
          `delta=${c.readinessDelta};exceptions=${c.exceptionCount};regressed=${c.regressed}`,
        ),
      ].join(","),
    );
  }

  for (const t of pack.vendorTierRollup) {
    lines.push(
      [
        "vendor_tier",
        t.tier,
        escapeCsvField(t.tier),
        t.riskScore,
        t.level,
        t.avgReadinessPercent,
        escapeCsvField(`vendor_count=${t.vendorCount}`),
      ].join(","),
    );
  }

  for (const h of pack.hotspots) {
    lines.push(
      [
        "hotspot",
        escapeCsvField(h.ref),
        escapeCsvField(h.label),
        h.riskScore,
        h.level,
        "",
        escapeCsvField(h.detail),
      ].join(","),
    );
  }

  return `${lines.join("\n")}\n`;
}

export const RISK_HEATMAP_FRAMEWORK_ORDER = BASELINE_COMPARISON_FRAMEWORKS;
