import type { SupabaseClient } from "@supabase/supabase-js";

import { listAuditTimestampsForCompliance } from "@/lib/audit/data";
import { listControlAttestationBoard } from "@/lib/compliance/attestation/data";
import {
  BASELINE_COMPARISON_FRAMEWORKS,
  buildBaselineComparisonFromReports,
  buildFrameworkBaselineRow,
  FRAMEWORK_CONSOLE_PATHS,
} from "@/lib/compliance/baseline-comparison";
import { buildContinuousAssessmentReport } from "@/lib/compliance/continuous-assessment";
import { listComplianceGapRemediations } from "@/lib/compliance/gap-remediation";
import type { ComplianceFramework } from "@/lib/compliance/types";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const COMPLIANCE_KPI_TRENDS_VERSION = "smohix-compliance-kpi-trends/1";

export const DEFAULT_KPI_TREND_WEEKS = 12;

export type KpiWeeklyActivity = {
  weekKey: string;
  gapsStarted: number;
  gapsResolved: number;
  attestationsSigned: number;
  auditGovernanceEvents: number;
};

export type FrameworkReadinessTrend = {
  framework: ComplianceFramework;
  label: string;
  consolePath: string;
  currentReadiness: number;
  priorReadiness: number;
  readinessDelta: number;
  improved: number;
  regressed: number;
  points: { weekKey: string; readinessPercent: number; interpolated: boolean }[];
};

export type ComplianceKpiTrendsPack = {
  version: typeof COMPLIANCE_KPI_TRENDS_VERSION;
  generatedAt: string;
  periodDays: number;
  orgId: string | null;
  weekKeys: string[];
  overallReadinessPercent: number;
  overallReadinessDelta: number;
  attestationClosurePercent: number;
  attestationOverdue: number;
  gapVelocityPerWeek: number;
  gapsResolvedTotal: number;
  gapsStartedTotal: number;
  weeklyActivity: KpiWeeklyActivity[];
  frameworkTrends: FrameworkReadinessTrend[];
  strongestFramework: ComplianceFramework | null;
  weakestFramework: ComplianceFramework | null;
};

function startOfUtcWeek(iso: string): string {
  const d = new Date(iso);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function buildWeekKeys(periodDays: number, now = new Date()): string[] {
  const weekCount = Math.max(4, Math.min(DEFAULT_KPI_TREND_WEEKS, Math.ceil(periodDays / 7)));
  const keys: string[] = [];
  for (let i = weekCount - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 7 * 86_400_000);
    keys.push(startOfUtcWeek(d.toISOString()));
  }
  return keys;
}

export function bucketCountByWeek(
  events: { created_at: string }[],
  weekKeys: string[],
): Map<string, number> {
  const counts = new Map<string, number>(weekKeys.map((k) => [k, 0]));
  for (const e of events) {
    const key = startOfUtcWeek(e.created_at);
    if (!counts.has(key)) counts.set(key, 0);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function interpolateReadinessPoints(
  priorPercent: number,
  currentPercent: number,
  weekKeys: string[],
): { weekKey: string; readinessPercent: number; interpolated: boolean }[] {
  if (weekKeys.length === 0) return [];
  if (weekKeys.length === 1) {
    return [{ weekKey: weekKeys[0], readinessPercent: currentPercent, interpolated: false }];
  }
  const last = weekKeys.length - 1;
  return weekKeys.map((weekKey, idx) => {
    const t = idx / last;
    const value = Math.round((priorPercent + (currentPercent - priorPercent) * t) * 10) / 10;
    const interpolated = idx !== 0 && idx !== last;
    return {
      weekKey,
      readinessPercent: idx === 0 ? priorPercent : idx === last ? currentPercent : value,
      interpolated,
    };
  });
}

export function buildWeeklyActivityFromAudit(
  auditRows: { event_type: string; created_at: string }[],
  weekKeys: string[],
): KpiWeeklyActivity[] {
  const started = auditRows.filter((r) => r.event_type === "governance.compliance_gap_remediation_started");
  const resolved = auditRows.filter((r) => r.event_type === "governance.compliance_gap_remediation_resolved");
  const attested = auditRows.filter((r) => r.event_type === "governance.control_attestation_signed");
  const governance = auditRows.filter((r) => r.event_type.startsWith("governance."));

  const startedByWeek = bucketCountByWeek(started, weekKeys);
  const resolvedByWeek = bucketCountByWeek(resolved, weekKeys);
  const attestedByWeek = bucketCountByWeek(attested, weekKeys);
  const govByWeek = bucketCountByWeek(governance, weekKeys);

  return weekKeys.map((weekKey) => ({
    weekKey,
    gapsStarted: startedByWeek.get(weekKey) ?? 0,
    gapsResolved: resolvedByWeek.get(weekKey) ?? 0,
    attestationsSigned: attestedByWeek.get(weekKey) ?? 0,
    auditGovernanceEvents: govByWeek.get(weekKey) ?? 0,
  }));
}

export function mergeWeeklyActivityWithRemediations(
  weekly: KpiWeeklyActivity[],
  remediations: { createdAt: string; resolvedAt: string | null }[],
  attestationEvents: { event_type: string; created_at: string }[],
): KpiWeeklyActivity[] {
  const weekKeys = weekly.map((w) => w.weekKey);
  const createdBuckets = bucketCountByWeek(
    remediations.map((r) => ({ created_at: r.createdAt })),
    weekKeys,
  );
  const resolvedBuckets = bucketCountByWeek(
    remediations.filter((r) => r.resolvedAt).map((r) => ({ created_at: r.resolvedAt! })),
    weekKeys,
  );
  const attestationBuckets = bucketCountByWeek(
    attestationEvents.filter((e) => e.event_type === "attested"),
    weekKeys,
  );

  return weekly.map((row) => ({
    ...row,
    gapsStarted: Math.max(row.gapsStarted, createdBuckets.get(row.weekKey) ?? 0),
    gapsResolved: Math.max(row.gapsResolved, resolvedBuckets.get(row.weekKey) ?? 0),
    attestationsSigned: Math.max(row.attestationsSigned, attestationBuckets.get(row.weekKey) ?? 0),
  }));
}

export function buildFrameworkReadinessTrends(
  baselineRows: ReturnType<typeof buildFrameworkBaselineRow>[],
  weekKeys: string[],
): FrameworkReadinessTrend[] {
  return baselineRows.map((row) => ({
    framework: row.framework,
    label: row.label,
    consolePath: FRAMEWORK_CONSOLE_PATHS[row.framework],
    currentReadiness: row.readinessPercent,
    priorReadiness: row.priorReadinessPercent,
    readinessDelta: row.readinessDelta,
    improved: row.improved,
    regressed: row.regressed,
    points: interpolateReadinessPoints(row.priorReadinessPercent, row.readinessPercent, weekKeys),
  }));
}

export function computeGapVelocityPerWeek(weekly: KpiWeeklyActivity[]): number {
  const resolved = weekly.reduce((s, w) => s + w.gapsResolved, 0);
  const weeks = weekly.length || 1;
  return Math.round((resolved / weeks) * 10) / 10;
}

export function buildComplianceKpiTrendsPackFromParts(input: {
  orgId: string | null;
  periodDays: number;
  weekKeys: string[];
  baselineRows: ReturnType<typeof buildFrameworkBaselineRow>[];
  weeklyActivity: KpiWeeklyActivity[];
  attestationClosurePercent: number;
  attestationOverdue: number;
  generatedAt?: string;
}): ComplianceKpiTrendsPack {
  const frameworkTrends = buildFrameworkReadinessTrends(input.baselineRows, input.weekKeys);
  const overallReadiness =
    frameworkTrends.length === 0
      ? 0
      : Math.round(
          (frameworkTrends.reduce((s, f) => s + f.currentReadiness, 0) / frameworkTrends.length) * 10,
        ) / 10;
  const overallDelta =
    frameworkTrends.length === 0
      ? 0
      : Math.round(
          (frameworkTrends.reduce((s, f) => s + f.readinessDelta, 0) / frameworkTrends.length) * 10,
        ) / 10;

  const sorted = [...frameworkTrends].sort((a, b) => a.currentReadiness - b.currentReadiness);
  const gapsStartedTotal = input.weeklyActivity.reduce((s, w) => s + w.gapsStarted, 0);
  const gapsResolvedTotal = input.weeklyActivity.reduce((s, w) => s + w.gapsResolved, 0);

  return {
    version: COMPLIANCE_KPI_TRENDS_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    periodDays: input.periodDays,
    orgId: input.orgId,
    weekKeys: input.weekKeys,
    overallReadinessPercent: overallReadiness,
    overallReadinessDelta: overallDelta,
    attestationClosurePercent: input.attestationClosurePercent,
    attestationOverdue: input.attestationOverdue,
    gapVelocityPerWeek: computeGapVelocityPerWeek(input.weeklyActivity),
    gapsResolvedTotal,
    gapsStartedTotal,
    weeklyActivity: input.weeklyActivity,
    frameworkTrends,
    strongestFramework: sorted[sorted.length - 1]?.framework ?? null,
    weakestFramework: sorted[0]?.framework ?? null,
  };
}

export async function listAttestationEventsForOrg(
  orgId: string,
  sinceIso: string,
  supabase: SupabaseClient,
): Promise<{ event_type: string; created_at: string }[]> {
  const { data, error } = await supabase
    .from("compliance_control_attestation_events")
    .select("event_type, created_at")
    .eq("org_id", orgId)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error || !data) return [];
  return data.map((r) => ({
    event_type: String(r.event_type),
    created_at: String(r.created_at),
  }));
}

export async function buildComplianceKpiTrendsPack(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<ComplianceKpiTrendsPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const periodDays = opts.periodDays ?? 90;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const sinceIso = new Date(Date.now() - periodDays * 86_400_000).toISOString();
  const weekKeys = buildWeekKeys(periodDays);

  const reports = await Promise.all(
    BASELINE_COMPARISON_FRAMEWORKS.map((framework) =>
      buildContinuousAssessmentReport(userId, {
        framework,
        orgId: opts.orgId,
        periodDays: Math.min(periodDays, 30),
        supabase,
      }),
    ),
  );

  if (reports.some((r) => !r)) return null;

  const baselinePack = buildBaselineComparisonFromReports(
    reports.filter((r): r is NonNullable<typeof reports[number]> => r !== null),
    { orgId: opts.orgId, periodDays: Math.min(periodDays, 30) },
  );

  const [auditRows, remediations, attestationEvents, attestationBoard] = await Promise.all([
    listAuditTimestampsForCompliance(userId, { sinceIso, orgId: opts.orgId, supabase, limit: 2000 }),
    listComplianceGapRemediations(opts.orgId, supabase),
    listAttestationEventsForOrg(opts.orgId, sinceIso, supabase),
    listControlAttestationBoard(userId, opts.orgId, supabase),
  ]);

  let weeklyActivity = buildWeeklyActivityFromAudit(auditRows, weekKeys);
  weeklyActivity = mergeWeeklyActivityWithRemediations(
    weeklyActivity,
    remediations.map((r) => ({ createdAt: r.createdAt, resolvedAt: r.resolvedAt })),
    attestationEvents,
  );

  const attested = attestationBoard.filter((a) => a.status === "attested").length;
  const total = attestationBoard.length;
  const attestationClosurePercent =
    total > 0 ? Math.round((attested / total) * 1000) / 10 : 0;
  const attestationOverdue = attestationBoard.filter((a) => a.status === "overdue").length;

  return buildComplianceKpiTrendsPackFromParts({
    orgId: opts.orgId,
    periodDays,
    weekKeys,
    baselineRows: baselinePack.rows,
    weeklyActivity,
    attestationClosurePercent,
    attestationOverdue,
  });
}

export function complianceKpiTrendsToCsv(pack: ComplianceKpiTrendsPack): string {
  const header =
    "week_key,gaps_started,gaps_resolved,attestations_signed,audit_governance_events";
  const activityLines = pack.weeklyActivity.map((w) =>
    [w.weekKey, w.gapsStarted, w.gapsResolved, w.attestationsSigned, w.auditGovernanceEvents].join(","),
  );
  const frameworkHeader = "\nframework,current_readiness,prior_readiness,delta,improved,regressed";
  const frameworkLines = pack.frameworkTrends.map((f) =>
    [f.framework, f.currentReadiness, f.priorReadiness, f.readinessDelta, f.improved, f.regressed].join(","),
  );
  return `${header}\n${activityLines.join("\n")}${frameworkHeader}\n${frameworkLines.join("\n")}\n`;
}
