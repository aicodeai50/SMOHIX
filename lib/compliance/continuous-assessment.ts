import type { SupabaseClient } from "@supabase/supabase-js";

import { COMPLIANCE_CONTROLS } from "@/lib/compliance/catalog";
import { getComplianceCoverageSummary } from "@/lib/compliance/summary";
import type {
  ComplianceCoverageRow,
  ComplianceFramework,
  ComplianceSummary,
} from "@/lib/compliance/types";
import { listEvidenceBundlesForOrg } from "@/lib/compliance/evidence-bundle";
import { listLegalHoldsForUser } from "@/lib/legal-hold/list";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ControlTrend = "improved" | "unchanged" | "regressed";

export type ControlMonitoringRow = {
  controlId: string;
  ref: string;
  title: string;
  domain: string;
  currentStatus: ComplianceCoverageRow["status"];
  priorStatus: ComplianceCoverageRow["status"];
  trend: ControlTrend;
  auditEvidenceCurrent: number;
  auditEvidencePrior: number;
};

export type AssessmentException = {
  controlRef: string;
  title: string;
  domain: string;
  reason: string;
};

export type DomainAssessmentSummary = {
  domain: string;
  covered: number;
  partial: number;
  none: number;
  total: number;
  readinessPercent: number;
};

export type ContinuousAssessmentReport = {
  generatedAt: string;
  framework: ComplianceFramework;
  periodDays: number;
  auditorReadOnly: boolean;
  currentPeriod: ComplianceSummary;
  priorPeriod: ComplianceSummary;
  controlMonitoring: ControlMonitoringRow[];
  exceptions: AssessmentException[];
  domainSummary: DomainAssessmentSummary[];
  evidenceBundleCount: number;
  legalHoldIncidentCount: number;
  readinessPercent: number;
  monitoringNote: string;
};

function sinceIsoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function statusRank(status: ComplianceCoverageRow["status"]): number {
  if (status === "covered") return 3;
  if (status === "partial") return 2;
  return 1;
}

function computeTrend(
  current: ComplianceCoverageRow["status"],
  prior: ComplianceCoverageRow["status"],
): ControlTrend {
  const cur = statusRank(current);
  const prev = statusRank(prior);
  if (cur > prev) return "improved";
  if (cur < prev) return "regressed";
  return "unchanged";
}

export function buildControlMonitoringForFramework(
  framework: ComplianceFramework,
  current: ComplianceSummary,
  prior: ComplianceSummary,
): ControlMonitoringRow[] {
  const priorById = new Map(prior.rows.map((r) => [r.control.id, r]));
  return COMPLIANCE_CONTROLS.filter((c) => c.framework === framework).map((control) => {
    const cur = current.rows.find((r) => r.control.id === control.id);
    const prev = priorById.get(control.id);
    const currentStatus = cur?.status ?? "none";
    const priorStatus = prev?.status ?? "none";
    return {
      controlId: control.id,
      ref: control.ref,
      title: control.title,
      domain: control.domain,
      currentStatus,
      priorStatus,
      trend: computeTrend(currentStatus, priorStatus),
      auditEvidenceCurrent: cur?.auditEvidenceCount ?? 0,
      auditEvidencePrior: prev?.auditEvidenceCount ?? 0,
    };
  });
}

export function buildAssessmentExceptions(
  monitoring: ControlMonitoringRow[],
): AssessmentException[] {
  const out: AssessmentException[] = [];
  for (const row of monitoring) {
    if (row.currentStatus === "none") {
      out.push({
        controlRef: row.ref,
        title: row.title,
        domain: row.domain,
        reason: "No audit or policy evidence in the current monitoring window.",
      });
    } else if (row.currentStatus === "partial") {
      out.push({
        controlRef: row.ref,
        title: row.title,
        domain: row.domain,
        reason: "Partial evidence — missing audit events or accepted policy mapping.",
      });
    } else if (row.trend === "regressed") {
      out.push({
        controlRef: row.ref,
        title: row.title,
        domain: row.domain,
        reason: "Control posture regressed versus the prior monitoring window.",
      });
    }
  }
  return out;
}

export function buildDomainSummary(monitoring: ControlMonitoringRow[]): DomainAssessmentSummary[] {
  const byDomain = new Map<string, ControlMonitoringRow[]>();
  for (const row of monitoring) {
    const list = byDomain.get(row.domain) ?? [];
    list.push(row);
    byDomain.set(row.domain, list);
  }
  return [...byDomain.entries()].map(([domain, rows]) => {
    const covered = rows.filter((r) => r.currentStatus === "covered").length;
    const partial = rows.filter((r) => r.currentStatus === "partial").length;
    const none = rows.filter((r) => r.currentStatus === "none").length;
    const total = rows.length;
    const readinessPercent =
      total > 0 ? Math.round(((covered + partial * 0.5) / total) * 1000) / 10 : 0;
    return { domain, covered, partial, none, total, readinessPercent };
  });
}

const MONITORING_NOTES: Record<ComplianceFramework, string> = {
  soc2:
    "Continuous control monitoring compares the current window to the immediately prior period of equal length. Auditor role is read-only across governance and audit surfaces.",
  iso27001:
    "Annex A continuous assessment compares ISO 27001:2022 control evidence for the current window against the immediately prior period of equal length.",
  pcidss:
    "PCI DSS v4 readiness scoring maps representative requirements to the same audit and policy evidence used for SOC 2 and ISO 27001.",
  hipaa:
    "HIPAA Security Rule safeguards (45 CFR 164) mapped to shared audit and policy evidence; BAA vendors inherit these controls in the third-party risk register.",
  nist_csf:
    "NIST Cybersecurity Framework 2.0 core functions aligned to audit and policy evidence with implementation maturity tiers (Partial → Adaptive).",
  cis_v8:
    "CIS Controls v8 safeguards mapped to shared audit and policy evidence with Implementation Group (IG1–IG3) readiness scoring.",
  cmmc_l2:
    "CMMC 2.0 Level 2 overlay maps NIST SP 800-171 Rev 2 practices to audit and policy evidence with SPRS-style scoring (0–110).",
  gdpr_art32:
    "GDPR Article 32(1) security-of-processing measures mapped to audit and policy evidence with DPA-oriented readiness bands.",
};

export async function buildContinuousAssessmentReport(
  userId: string,
  opts: {
    framework: ComplianceFramework;
    orgId: string | null;
    periodDays?: number;
    auditorReadOnly?: boolean;
    supabase?: SupabaseClient;
  },
): Promise<ContinuousAssessmentReport | null> {
  if (!hasSupabaseAuth() || !userId) return null;

  const periodDays = opts.periodDays ?? 30;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const currentSince = sinceIsoDaysAgo(periodDays);
  const priorSince = sinceIsoDaysAgo(periodDays * 2);
  const priorUntil = currentSince;

  const [currentPeriod, priorPeriod] = await Promise.all([
    getComplianceCoverageSummary(userId, {
      sinceIso: currentSince,
      orgId: opts.orgId,
      supabase,
    }),
    getComplianceCoverageSummary(userId, {
      sinceIso: priorSince,
      untilIso: priorUntil,
      orgId: opts.orgId,
      supabase,
    }),
  ]);

  const controlMonitoring = buildControlMonitoringForFramework(
    opts.framework,
    currentPeriod,
    priorPeriod,
  );
  const exceptions = buildAssessmentExceptions(controlMonitoring);
  const domainSummary = buildDomainSummary(controlMonitoring);

  const bundles = opts.orgId
    ? await listEvidenceBundlesForOrg(opts.orgId, { limit: 100, supabase })
    : [];
  const legalHolds = await listLegalHoldsForUser(userId, opts.orgId);

  const withEvidence = controlMonitoring.filter((r) => r.currentStatus !== "none");
  const readinessPercent =
    controlMonitoring.length > 0
      ? Math.round((withEvidence.length / controlMonitoring.length) * 1000) / 10
      : 0;

  return {
    generatedAt: new Date().toISOString(),
    framework: opts.framework,
    periodDays,
    auditorReadOnly: opts.auditorReadOnly ?? false,
    currentPeriod,
    priorPeriod,
    controlMonitoring,
    exceptions,
    domainSummary,
    evidenceBundleCount: bundles.length,
    legalHoldIncidentCount: legalHolds.incidentCount,
    readinessPercent,
    monitoringNote: MONITORING_NOTES[opts.framework],
  };
}
