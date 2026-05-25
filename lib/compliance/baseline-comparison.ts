import type { SupabaseClient } from "@supabase/supabase-js";

import { COMPLIANCE_CONTROLS } from "@/lib/compliance/catalog";
import {
  buildControlMonitoringForFramework,
  buildContinuousAssessmentReport,
  type ContinuousAssessmentReport,
  type ControlTrend,
} from "@/lib/compliance/continuous-assessment";
import type { ComplianceFramework, ComplianceSummary } from "@/lib/compliance/types";
import { escapeCsvField } from "@/lib/audit/csv-escape";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const BASELINE_COMPARISON_VERSION = "zentro-baseline-comparison/1";

/** All catalog frameworks included in the multi-framework baseline comparison. */
export const BASELINE_COMPARISON_FRAMEWORKS: ComplianceFramework[] = [
  "soc2",
  "iso27001",
  "pcidss",
  "hipaa",
  "nist_csf",
  "cis_v8",
  "cmmc_l2",
  "gdpr_art32",
];

const FRAMEWORK_LABELS: Record<ComplianceFramework, string> = {
  soc2: "SOC 2 Type II",
  iso27001: "ISO 27001",
  pcidss: "PCI DSS",
  hipaa: "HIPAA",
  nist_csf: "NIST CSF 2.0",
  cis_v8: "CIS Controls v8",
  cmmc_l2: "CMMC Level 2",
  gdpr_art32: "GDPR Art. 32",
};

export const FRAMEWORK_CONSOLE_PATHS: Record<ComplianceFramework, string> = {
  soc2: "/governance/compliance/type-ii",
  iso27001: "/governance/compliance/iso-assessment",
  pcidss: "/governance/compliance/pci-dss",
  hipaa: "/governance/compliance/hipaa",
  nist_csf: "/governance/compliance/nist-csf",
  cis_v8: "/governance/compliance/cis-v8",
  cmmc_l2: "/governance/compliance/cmmc-l2",
  gdpr_art32: "/governance/compliance/gdpr-art32",
};

export type FrameworkBaselineRow = {
  framework: ComplianceFramework;
  label: string;
  consolePath: string;
  controlCount: number;
  readinessPercent: number;
  priorReadinessPercent: number;
  readinessDelta: number;
  covered: number;
  partial: number;
  none: number;
  improved: number;
  unchanged: number;
  regressed: number;
  exceptionCount: number;
  weakestDomain: string | null;
  auditEventsScanned: number;
  acceptedPolicyCount: number;
};

export type BaselineComparisonPack = {
  version: typeof BASELINE_COMPARISON_VERSION;
  generatedAt: string;
  periodDays: number;
  sinceIso: string;
  orgId: string | null;
  frameworkCount: number;
  lowestReadinessFramework: ComplianceFramework | null;
  largestRegressionFramework: ComplianceFramework | null;
  rows: FrameworkBaselineRow[];
};

export function readinessPercentFromMonitoring(
  monitoring: ReturnType<typeof buildControlMonitoringForFramework>,
): number {
  if (monitoring.length === 0) return 0;
  const withEvidence = monitoring.filter((r) => r.currentStatus !== "none").length;
  return Math.round((withEvidence / monitoring.length) * 1000) / 10;
}

export function priorReadinessPercentFromMonitoring(
  monitoring: ReturnType<typeof buildControlMonitoringForFramework>,
): number {
  if (monitoring.length === 0) return 0;
  const withEvidence = monitoring.filter((r) => r.priorStatus !== "none").length;
  return Math.round((withEvidence / monitoring.length) * 1000) / 10;
}

export function buildFrameworkBaselineRow(
  report: ContinuousAssessmentReport,
): FrameworkBaselineRow {
  const monitoring = report.controlMonitoring;
  const readinessPercent = report.readinessPercent;
  const priorReadinessPercent = priorReadinessPercentFromMonitoring(monitoring);
  const readinessDelta = Math.round((readinessPercent - priorReadinessPercent) * 10) / 10;

  const trends = { improved: 0, unchanged: 0, regressed: 0 };
  for (const row of monitoring) {
    trends[row.trend] += 1;
  }

  const weakest = [...report.domainSummary].sort(
    (a, b) => a.readinessPercent - b.readinessPercent,
  )[0];

  const controlCount = COMPLIANCE_CONTROLS.filter((c) => c.framework === report.framework).length;

  return {
    framework: report.framework,
    label: FRAMEWORK_LABELS[report.framework],
    consolePath: FRAMEWORK_CONSOLE_PATHS[report.framework],
    controlCount,
    readinessPercent,
    priorReadinessPercent,
    readinessDelta,
    covered: monitoring.filter((r) => r.currentStatus === "covered").length,
    partial: monitoring.filter((r) => r.currentStatus === "partial").length,
    none: monitoring.filter((r) => r.currentStatus === "none").length,
    improved: trends.improved,
    unchanged: trends.unchanged,
    regressed: trends.regressed,
    exceptionCount: report.exceptions.length,
    weakestDomain: weakest?.domain ?? null,
    auditEventsScanned: report.currentPeriod.auditEventsScanned,
    acceptedPolicyCount: report.currentPeriod.acceptedPolicyCount,
  };
}

export function buildBaselineComparisonFromReports(
  reports: ContinuousAssessmentReport[],
  opts: { orgId: string | null; periodDays: number },
): BaselineComparisonPack {
  const rows = reports
    .map(buildFrameworkBaselineRow)
    .sort((a, b) => a.readinessPercent - b.readinessPercent);

  const lowest = rows[0] ?? null;
  const mostRegressed = [...rows].sort((a, b) => b.regressed - a.regressed)[0];
  const largestRegression =
    mostRegressed && mostRegressed.regressed > 0 ? mostRegressed.framework : null;

  return {
    version: BASELINE_COMPARISON_VERSION,
    generatedAt: new Date().toISOString(),
    periodDays: opts.periodDays,
    sinceIso: reports[0]?.currentPeriod.sinceIso ?? new Date().toISOString(),
    orgId: opts.orgId,
    frameworkCount: rows.length,
    lowestReadinessFramework: lowest?.framework ?? null,
    largestRegressionFramework: largestRegression,
    rows,
  };
}

export async function buildBaselineComparisonPack(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    auditorReadOnly?: boolean;
    supabase?: SupabaseClient;
  },
): Promise<BaselineComparisonPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const periodDays = opts.periodDays ?? 30;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const reports = await Promise.all(
    BASELINE_COMPARISON_FRAMEWORKS.map((framework) =>
      buildContinuousAssessmentReport(userId, {
        framework,
        orgId: opts.orgId,
        periodDays,
        auditorReadOnly: opts.auditorReadOnly,
        supabase,
      }),
    ),
  );

  if (reports.some((r) => !r)) return null;

  return buildBaselineComparisonFromReports(
    reports.filter((r): r is ContinuousAssessmentReport => r !== null),
    { orgId: opts.orgId, periodDays },
  );
}

export function baselineComparisonToCsv(pack: BaselineComparisonPack): string {
  const headers = [
    "framework",
    "label",
    "control_count",
    "readiness_percent",
    "prior_readiness_percent",
    "readiness_delta",
    "covered",
    "partial",
    "none",
    "improved",
    "unchanged",
    "regressed",
    "exception_count",
    "weakest_domain",
    "audit_events_scanned",
    "accepted_policy_count",
  ];
  const lines = [headers.join(",")];
  for (const row of pack.rows) {
    lines.push(
      [
        row.framework,
        row.label,
        row.controlCount,
        row.readinessPercent,
        row.priorReadinessPercent,
        row.readinessDelta,
        row.covered,
        row.partial,
        row.none,
        row.improved,
        row.unchanged,
        row.regressed,
        row.exceptionCount,
        row.weakestDomain ?? "",
        row.auditEventsScanned,
        row.acceptedPolicyCount,
      ]
        .map((v) => escapeCsvField(String(v)))
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

/** Build a synthetic report shape from summaries for unit tests (real catalog controls, zeroed audit). */
export function buildSyntheticContinuousReportForTest(
  framework: ComplianceFramework,
  current: ComplianceSummary,
  prior: ComplianceSummary,
): ContinuousAssessmentReport {
  const controlMonitoring = buildControlMonitoringForFramework(framework, current, prior);
  const exceptions = controlMonitoring
    .filter((r) => r.currentStatus === "none" || r.trend === "regressed")
    .map((r) => ({
      controlRef: r.ref,
      title: r.title,
      domain: r.domain,
      reason:
        r.trend === "regressed"
          ? "Control posture regressed versus the prior monitoring window."
          : "No audit or policy evidence in the current monitoring window.",
    }));
  return {
    generatedAt: new Date().toISOString(),
    framework,
    periodDays: 30,
    auditorReadOnly: false,
    currentPeriod: current,
    priorPeriod: prior,
    controlMonitoring,
    exceptions,
    domainSummary: [],
    evidenceBundleCount: 0,
    legalHoldIncidentCount: 0,
    readinessPercent: readinessPercentFromMonitoring(controlMonitoring),
    monitoringNote: "",
  };
}

export function summarizeTrendCounts(
  monitoring: { trend: ControlTrend }[],
): { improved: number; unchanged: number; regressed: number } {
  const out = { improved: 0, unchanged: 0, regressed: 0 };
  for (const row of monitoring) {
    out[row.trend] += 1;
  }
  return out;
}
