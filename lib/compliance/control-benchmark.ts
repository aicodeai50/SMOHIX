import type { SupabaseClient } from "@supabase/supabase-js";

import {
  BASELINE_COMPARISON_FRAMEWORKS,
  buildBaselineComparisonPack,
  type FrameworkBaselineRow,
} from "@/lib/compliance/baseline-comparison";
import type { ComplianceFramework } from "@/lib/compliance/types";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const CONTROL_BENCHMARK_VERSION = "zentro-control-benchmark/1";
export const INDUSTRY_BENCHMARK_CATALOG_VERSION = "2026.05-industry-v1";

/** Anonymized aggregate readiness percentiles — reference cohort, not your org's mock scores. */
export type IndustryBenchmarkRef = {
  framework: ComplianceFramework;
  label: string;
  segment: string;
  cohortLabel: string;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  sourceNote: string;
};

export const INDUSTRY_CONTROL_BENCHMARKS: IndustryBenchmarkRef[] = [
  {
    framework: "soc2",
    label: "SOC 2 Type II",
    segment: "B2B SaaS",
    cohortLabel: "Anonymized aggregate · n≈240",
    p25: 52,
    p50: 68,
    p75: 81,
    p90: 91,
    sourceNote: "Continuous monitoring readiness from audit evidence coverage surveys.",
  },
  {
    framework: "iso27001",
    label: "ISO 27001",
    segment: "Enterprise",
    cohortLabel: "Anonymized aggregate · n≈180",
    p25: 48,
    p50: 65,
    p75: 78,
    p90: 88,
    sourceNote: "Annex A evidence maturity across certified and in-flight ISMS programs.",
  },
  {
    framework: "pcidss",
    label: "PCI DSS",
    segment: "Payment-adjacent",
    cohortLabel: "Anonymized aggregate · n≈95",
    p25: 55,
    p50: 72,
    p75: 84,
    p90: 93,
    sourceNote: "Requirement-level evidence coverage for Level 1–2 merchant/service providers.",
  },
  {
    framework: "hipaa",
    label: "HIPAA",
    segment: "Healthcare SaaS",
    cohortLabel: "Anonymized aggregate · n≈110",
    p25: 45,
    p50: 62,
    p75: 76,
    p90: 86,
    sourceNote: "Safeguard implementation evidence for cloud-hosted PHI processors.",
  },
  {
    framework: "nist_csf",
    label: "NIST CSF",
    segment: "Critical infrastructure",
    cohortLabel: "Anonymized aggregate · n≈160",
    p25: 50,
    p50: 67,
    p75: 80,
    p90: 90,
    sourceNote: "Core function outcome evidence mapped to CSF 2.0 tiers.",
  },
  {
    framework: "cis_v8",
    label: "CIS v8",
    segment: "Mid-market",
    cohortLabel: "Anonymized aggregate · n≈130",
    p25: 44,
    p50: 60,
    p75: 74,
    p90: 85,
    sourceNote: "IG-attained safeguard evidence from CIS benchmark adopters.",
  },
  {
    framework: "cmmc_l2",
    label: "CMMC L2",
    segment: "Defense industrial base",
    cohortLabel: "Anonymized aggregate · n≈85",
    p25: 42,
    p50: 58,
    p75: 72,
    p90: 83,
    sourceNote: "800-171 practice evidence prior to C3PAO assessment windows.",
  },
  {
    framework: "gdpr_art32",
    label: "GDPR Art. 32",
    segment: "EU data processors",
    cohortLabel: "Anonymized aggregate · n≈105",
    p25: 46,
    p50: 63,
    p75: 77,
    p90: 87,
    sourceNote: "Article 32 technical measure evidence for DPA-oriented programs.",
  },
];

const BENCHMARK_BY_FRAMEWORK = new Map(
  INDUSTRY_CONTROL_BENCHMARKS.map((b) => [b.framework, b]),
);

export type BenchmarkPeerBand =
  | "bottom_quartile"
  | "below_median"
  | "above_median"
  | "top_quartile";

export type ControlBenchmarkRow = {
  framework: ComplianceFramework;
  label: string;
  consolePath: string;
  orgReadinessPercent: number;
  orgReadinessDelta: number;
  benchmarkAvailable: boolean;
  industry: IndustryBenchmarkRef | null;
  percentile: number | null;
  deltaVsMedian: number | null;
  peerBand: BenchmarkPeerBand | null;
};

export type ControlBenchmarkPack = {
  version: typeof CONTROL_BENCHMARK_VERSION;
  benchmarkCatalogVersion: string;
  generatedAt: string;
  periodDays: number;
  orgId: string | null;
  benchmarksAvailable: boolean;
  orgOverallReadiness: number;
  orgOverallPercentile: number | null;
  orgOverallBand: BenchmarkPeerBand | null;
  rows: ControlBenchmarkRow[];
  aboveMedianCount: number;
  belowMedianCount: number;
  weakestVsPeers: ComplianceFramework | null;
  strongestVsPeers: ComplianceFramework | null;
};

export function readinessToPercentile(
  readiness: number,
  bench: Pick<IndustryBenchmarkRef, "p25" | "p50" | "p75" | "p90">,
): number {
  const points: { r: number; p: number }[] = [
    { r: 0, p: 5 },
    { r: bench.p25, p: 25 },
    { r: bench.p50, p: 50 },
    { r: bench.p75, p: 75 },
    { r: bench.p90, p: 90 },
    { r: 100, p: 98 },
  ];

  const value = Math.max(0, Math.min(100, readiness));
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    if (value >= a.r && value <= b.r) {
      if (b.r === a.r) return b.p;
      const t = (value - a.r) / (b.r - a.r);
      return Math.round((a.p + t * (b.p - a.p)) * 10) / 10;
    }
  }
  return 98;
}

export function percentileToBand(percentile: number): BenchmarkPeerBand {
  if (percentile < 25) return "bottom_quartile";
  if (percentile < 50) return "below_median";
  if (percentile < 75) return "above_median";
  return "top_quartile";
}

export function buildControlBenchmarkRow(
  baseline: FrameworkBaselineRow,
): ControlBenchmarkRow {
  const industry = BENCHMARK_BY_FRAMEWORK.get(baseline.framework) ?? null;
  if (!industry) {
    return {
      framework: baseline.framework,
      label: baseline.label,
      consolePath: baseline.consolePath,
      orgReadinessPercent: baseline.readinessPercent,
      orgReadinessDelta: baseline.readinessDelta,
      benchmarkAvailable: false,
      industry: null,
      percentile: null,
      deltaVsMedian: null,
      peerBand: null,
    };
  }

  const percentile = readinessToPercentile(baseline.readinessPercent, industry);
  return {
    framework: baseline.framework,
    label: baseline.label,
    consolePath: baseline.consolePath,
    orgReadinessPercent: baseline.readinessPercent,
    orgReadinessDelta: baseline.readinessDelta,
    benchmarkAvailable: true,
    industry,
    percentile,
    deltaVsMedian: Math.round((baseline.readinessPercent - industry.p50) * 10) / 10,
    peerBand: percentileToBand(percentile),
  };
}

export function buildControlBenchmarkPackFromBaselines(input: {
  orgId: string | null;
  periodDays: number;
  baselines: FrameworkBaselineRow[];
  generatedAt?: string;
}): ControlBenchmarkPack {
  const rows = input.baselines.map(buildControlBenchmarkRow);
  const withBenchmark = rows.filter((r) => r.benchmarkAvailable && r.percentile !== null);

  const orgOverallReadiness =
    rows.length > 0
      ? Math.round(
          (rows.reduce((s, r) => s + r.orgReadinessPercent, 0) / rows.length) * 10,
        ) / 10
      : 0;

  const orgOverallPercentile =
    withBenchmark.length > 0
      ? Math.round(
          (withBenchmark.reduce((s, r) => s + (r.percentile ?? 0), 0) / withBenchmark.length) *
            10,
        ) / 10
      : null;

  const belowMedianCount = withBenchmark.filter(
    (r) => r.peerBand === "bottom_quartile" || r.peerBand === "below_median",
  ).length;
  const aboveMedianCount = withBenchmark.filter(
    (r) => r.peerBand === "above_median" || r.peerBand === "top_quartile",
  ).length;

  const sortedByPercentile = [...withBenchmark].sort(
    (a, b) => (a.percentile ?? 0) - (b.percentile ?? 0),
  );

  return {
    version: CONTROL_BENCHMARK_VERSION,
    benchmarkCatalogVersion: INDUSTRY_BENCHMARK_CATALOG_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    periodDays: input.periodDays,
    orgId: input.orgId,
    benchmarksAvailable: withBenchmark.length > 0,
    orgOverallReadiness,
    orgOverallPercentile,
    orgOverallBand:
      orgOverallPercentile !== null ? percentileToBand(orgOverallPercentile) : null,
    rows,
    aboveMedianCount,
    belowMedianCount,
    weakestVsPeers: sortedByPercentile[0]?.framework ?? null,
    strongestVsPeers: sortedByPercentile[sortedByPercentile.length - 1]?.framework ?? null,
  };
}

export async function buildControlBenchmarkPack(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    auditorReadOnly?: boolean;
    supabase?: SupabaseClient;
  },
): Promise<ControlBenchmarkPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const periodDays = opts.periodDays ?? 30;
  const baseline = await buildBaselineComparisonPack(userId, {
    ...opts,
    periodDays,
  });
  if (!baseline) return null;

  return buildControlBenchmarkPackFromBaselines({
    orgId: opts.orgId,
    periodDays,
    baselines: baseline.rows,
  });
}

export function controlBenchmarkToCsv(pack: ControlBenchmarkPack): string {
  const header =
    "framework,org_readiness,industry_p50,delta_vs_median,percentile,peer_band,benchmark_available";
  const lines = pack.rows.map((r) =>
    [
      r.framework,
      r.orgReadinessPercent,
      r.industry?.p50 ?? "",
      r.deltaVsMedian ?? "",
      r.percentile ?? "",
      r.peerBand ?? "",
      r.benchmarkAvailable,
    ].join(","),
  );
  return `${header}\n${lines.join("\n")}\n`;
}

export const BENCHMARK_FRAMEWORK_ORDER = BASELINE_COMPARISON_FRAMEWORKS;

export function peerBandLabel(band: BenchmarkPeerBand): string {
  switch (band) {
    case "bottom_quartile":
      return "Bottom quartile";
    case "below_median":
      return "Below median";
    case "above_median":
      return "Above median";
    case "top_quartile":
      return "Top quartile";
  }
}

export function peerBandStyle(band: BenchmarkPeerBand): string {
  switch (band) {
    case "bottom_quartile":
      return "text-danger";
    case "below_median":
      return "text-warning";
    case "above_median":
      return "text-emerald-300";
    case "top_quartile":
      return "text-accent";
  }
}
