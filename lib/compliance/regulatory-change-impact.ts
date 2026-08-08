import type { SupabaseClient } from "@supabase/supabase-js";

import {
  BASELINE_COMPARISON_FRAMEWORKS,
  buildBaselineComparisonPack,
  type FrameworkBaselineRow,
} from "@/lib/compliance/baseline-comparison";
import { getComplianceControl } from "@/lib/compliance/catalog";
import type { ComplianceFramework } from "@/lib/compliance/types";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const REGULATORY_CHANGE_IMPACT_VERSION = "smohix-regulatory-change-impact/1";

export type RegulatoryImpactKind =
  | "new_obligation"
  | "evidence_refresh"
  | "scope_expansion"
  | "reporting_change";

export type RegulatoryControlImpact = {
  controlId: string;
  framework: ComplianceFramework;
  ref: string;
  title: string;
  kind: RegulatoryImpactKind;
  note: string;
};

export type RegulatoryChangeScenario = {
  id: string;
  regulation: string;
  title: string;
  effectiveLabel: string;
  summary: string;
  jurisdictions: string[];
  impacts: RegulatoryControlImpact[];
};

export type RegulatoryScenarioImpactRow = {
  scenarioId: string;
  controlId: string;
  kind: RegulatoryImpactKind;
  currentStatus: "covered" | "partial" | "none";
  simulatedStatus: "covered" | "partial" | "none";
  readinessPenalty: number;
  note: string;
  href: string;
};

export type RegulatoryScenarioResult = {
  scenario: RegulatoryChangeScenario;
  impactedControlCount: number;
  newlyExposedCount: number;
  refreshRequiredCount: number;
  projectedReadinessDrop: number;
  frameworkDeltas: {
    framework: ComplianceFramework;
    label: string;
    currentReadiness: number;
    projectedReadiness: number;
    delta: number;
  }[];
  rows: RegulatoryScenarioImpactRow[];
};

export type RegulatoryChangeImpactPack = {
  version: typeof REGULATORY_CHANGE_IMPACT_VERSION;
  generatedAt: string;
  periodDays: number;
  orgId: string | null;
  catalogVersion: string;
  scenarios: RegulatoryChangeScenario[];
  results: RegulatoryScenarioResult[];
  highestImpactScenarioId: string | null;
};

/** Curated regulatory change catalog — maps to catalog controls for impact simulation. */
export const REGULATORY_CHANGE_SCENARIOS: RegulatoryChangeScenario[] = [
  {
    id: "eu-dora-2025-ict",
    regulation: "EU DORA",
    title: "ICT risk management & third-party register",
    effectiveLabel: "Jan 2025 (EU financial entities)",
    summary:
      "Expands operational resilience evidence for vendors, logging, and incident reporting tied to ICT supply chain.",
    jurisdictions: ["EU", "EEA"],
    impacts: [
      {
        controlId: "soc2:CC1.2",
        framework: "soc2",
        ref: "CC1.2",
        title: "Board oversight of internal control",
        kind: "scope_expansion",
        note: "Deeper third-party ICT risk documentation expected.",
      },
      {
        controlId: "iso:A.5.23",
        framework: "iso27001",
        ref: "A.5.23",
        title: "Information security for cloud services",
        kind: "scope_expansion",
        note: "Supplier security agreements and monitoring evidence.",
      },
      {
        controlId: "pcidss:12.3.1",
        framework: "pcidss",
        ref: "12.3.1",
        title: "Targeted risk analysis for PCI scope",
        kind: "evidence_refresh",
        note: "Refresh TPSP inventory and responsibility matrix.",
      },
      {
        controlId: "nist_csf:GV.OC-01",
        framework: "nist_csf",
        ref: "GV.OC-01",
        title: "Organizational cybersecurity risk strategy",
        kind: "new_obligation",
        note: "Formal supply-chain risk program for critical ICT providers.",
      },
    ],
  },
  {
    id: "pci-dss-4-logging",
    regulation: "PCI DSS v4.0",
    title: "Logging & daily log review cadence",
    effectiveLabel: "Mar 2025 (v4.0 full adoption)",
    summary:
      "Strengthens log capture, time sync, and daily review evidence for cardholder data environments.",
    jurisdictions: ["Global"],
    impacts: [
      {
        controlId: "pcidss:10.2.1",
        framework: "pcidss",
        ref: "10.2.1",
        title: "Audit trails for access",
        kind: "evidence_refresh",
        note: "Re-validate log fields and retention for CDE access.",
      },
      {
        controlId: "hipaa:164.312b",
        framework: "hipaa",
        ref: "164.312(b)",
        title: "Audit controls",
        kind: "evidence_refresh",
        note: "Ensure required attributes on each log event.",
      },
      {
        controlId: "soc2:CC7.2",
        framework: "soc2",
        ref: "CC7.2",
        title: "System monitoring",
        kind: "scope_expansion",
        note: "Align SOC monitoring narrative with PCI log review cadence.",
      },
      {
        controlId: "cis_v8:8.2",
        framework: "cis_v8",
        ref: "8.2",
        title: "Collect audit logs",
        kind: "evidence_refresh",
        note: "Centralize and review security-relevant logs daily.",
      },
    ],
  },
  {
    id: "hipaa-security-rule-2024",
    regulation: "HIPAA Security Rule",
    title: "Risk analysis & ePHI access review",
    effectiveLabel: "2024 proposed / 2025 enforcement posture",
    summary:
      "Expects documented risk analysis updates and stronger access review evidence for ePHI systems.",
    jurisdictions: ["US"],
    impacts: [
      {
        controlId: "hipaa:164.308a1",
        framework: "hipaa",
        ref: "164.308(a)(1)",
        title: "Security management process",
        kind: "evidence_refresh",
        note: "Refresh annual risk analysis and remediation tracking.",
      },
      {
        controlId: "hipaa:164.312a1",
        framework: "hipaa",
        ref: "164.312(a)(1)",
        title: "Access control",
        kind: "scope_expansion",
        note: "Periodic access review for workforce and systems.",
      },
      {
        controlId: "soc2:CC6.1",
        framework: "soc2",
        ref: "CC6.1",
        title: "Logical access controls",
        kind: "scope_expansion",
        note: "Map HIPAA access reviews to SOC logical access evidence.",
      },
    ],
  },
  {
    id: "gdpr-art32-breach-ready",
    regulation: "GDPR Art. 32 / breach notification",
    title: "Processor breach readiness & encryption proof",
    effectiveLabel: "Ongoing (supervisory emphasis 2025–2026)",
    summary:
      "Supervisory focus on processor agreements, encryption, and demonstrable restore/testing for personal data.",
    jurisdictions: ["EU", "UK"],
    impacts: [
      {
        controlId: "gdpr_art32:32-a2",
        framework: "gdpr_art32",
        ref: "32-a2",
        title: "Encryption of personal data",
        kind: "evidence_refresh",
        note: "Document encryption scope for data in transit and at rest.",
      },
      {
        controlId: "gdpr_art32:32-r2",
        framework: "gdpr_art32",
        ref: "32-r2",
        title: "Timely restore of availability",
        kind: "evidence_refresh",
        note: "Tabletop restore tests with measurable RTO/RPO.",
      },
      {
        controlId: "gdpr_art32:32-d1",
        framework: "gdpr_art32",
        ref: "32-d1",
        title: "Regular testing of security measures",
        kind: "reporting_change",
        note: "Evidence pack for DPIA-linked testing cadence.",
      },
      {
        controlId: "iso:A.5.24",
        framework: "iso27001",
        ref: "A.5.24",
        title: "Incident management planning",
        kind: "scope_expansion",
        note: "Align 72-hour breach notification runbooks.",
      },
    ],
  },
  {
    id: "cmmc-l2-sprm-2025",
    regulation: "CMMC Level 2 / NIST 800-171",
    title: "SPRM & POA&M closure evidence",
    effectiveLabel: "2025 CMMC assessment window",
    summary:
      "Assessors expect closed-loop POA&M items and system security plans with traceable control implementation.",
    jurisdictions: ["US", "Defense industrial base"],
    impacts: [
      {
        controlId: "cmmc_l2:3.13.1",
        framework: "cmmc_l2",
        ref: "3.13.1",
        title: "Monitor communications at system boundaries",
        kind: "evidence_refresh",
        note: "Refresh self-assessment and POA&M closure proof.",
      },
      {
        controlId: "cmmc_l2:3.11.2",
        framework: "cmmc_l2",
        ref: "3.11.2",
        title: "Vulnerability scanning",
        kind: "evidence_refresh",
        note: "Authenticated scans on CUI assets.",
      },
      {
        controlId: "nist_csf:ID.RA-01",
        framework: "nist_csf",
        ref: "ID.RA-01",
        title: "Vulnerabilities identified and documented",
        kind: "reporting_change",
        note: "Link POA&M milestones to improvement backlog.",
      },
    ],
  },
];

export const REGULATORY_CHANGE_CATALOG_VERSION = "2026.05-regulatory-v1";

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

const CONSOLE_PATHS: Record<ComplianceFramework, string> = {
  soc2: "/governance/compliance/type-ii",
  iso27001: "/governance/compliance/iso-assessment",
  pcidss: "/governance/compliance/pci-dss",
  hipaa: "/governance/compliance/hipaa",
  nist_csf: "/governance/compliance/nist-csf",
  cis_v8: "/governance/compliance/cis-v8",
  cmmc_l2: "/governance/compliance/cmmc-l2",
  gdpr_art32: "/governance/compliance/gdpr-art32",
};

function simulateStatusAfterImpact(
  current: "covered" | "partial" | "none",
  kind: RegulatoryImpactKind,
): { simulated: "covered" | "partial" | "none"; penalty: number } {
  if (kind === "reporting_change") {
    return { simulated: current, penalty: current === "covered" ? 0 : 1 };
  }
  if (kind === "new_obligation") {
    if (current === "covered") return { simulated: "partial", penalty: 2 };
    return { simulated: "none", penalty: 3 };
  }
  if (kind === "scope_expansion") {
    if (current === "covered") return { simulated: "partial", penalty: 2 };
    if (current === "partial") return { simulated: "none", penalty: 2 };
    return { simulated: "none", penalty: 3 };
  }
  // evidence_refresh
  if (current === "covered") return { simulated: "partial", penalty: 2 };
  if (current === "partial") return { simulated: "none", penalty: 2 };
  return { simulated: "none", penalty: 1 };
}

export function buildCoverageByControlFromBaselines(
  baselines: FrameworkBaselineRow[],
  summaryRows: { control: { id: string; framework: ComplianceFramework }; status: "covered" | "partial" | "none" }[],
): Map<string, "covered" | "partial" | "none"> {
  const map = new Map<string, "covered" | "partial" | "none">();
  for (const row of summaryRows) {
    map.set(row.control.id, row.status);
  }
  return map;
}

export function simulateRegulatoryScenario(
  scenario: RegulatoryChangeScenario,
  coverageByControl: Map<string, "covered" | "partial" | "none">,
  baselineByFramework: Map<ComplianceFramework, FrameworkBaselineRow>,
): RegulatoryScenarioResult {
  const rows: RegulatoryScenarioImpactRow[] = [];
  let projectedPenalty = 0;
  const frameworkPenalty = new Map<ComplianceFramework, number>();

  for (const impact of scenario.impacts) {
    if (!getComplianceControl(impact.controlId)) continue;
    const currentStatus = coverageByControl.get(impact.controlId) ?? "none";
    const { simulated, penalty } = simulateStatusAfterImpact(currentStatus, impact.kind);
    projectedPenalty += penalty;
    frameworkPenalty.set(
      impact.framework,
      (frameworkPenalty.get(impact.framework) ?? 0) + penalty,
    );

    rows.push({
      scenarioId: scenario.id,
      controlId: impact.controlId,
      kind: impact.kind,
      currentStatus,
      simulatedStatus: simulated,
      readinessPenalty: penalty,
      note: impact.note,
      href: CONSOLE_PATHS[impact.framework] ?? "/governance/compliance/program",
    });
  }

  rows.sort((a, b) => b.readinessPenalty - a.readinessPenalty);

  const frameworkDeltas = BASELINE_COMPARISON_FRAMEWORKS.map((framework) => {
    const baseline = baselineByFramework.get(framework);
    const currentReadiness = baseline?.readinessPercent ?? 0;
    const penalty = frameworkPenalty.get(framework) ?? 0;
    const drop = Math.min(currentReadiness, Math.round(penalty * 1.2));
    const projectedReadiness = Math.max(0, currentReadiness - drop);
    return {
      framework,
      label: FRAMEWORK_LABELS[framework],
      currentReadiness,
      projectedReadiness,
      delta: projectedReadiness - currentReadiness,
    };
  }).filter((f) => f.currentReadiness > 0 || (frameworkPenalty.get(f.framework) ?? 0) > 0);

  const newlyExposedCount = rows.filter(
    (r) => r.currentStatus === "none" && r.simulatedStatus === "none" && r.kind === "new_obligation",
  ).length;
  const refreshRequiredCount = rows.filter((r) => r.kind === "evidence_refresh").length;
  const projectedReadinessDrop = Math.round(projectedPenalty * 0.8);

  return {
    scenario,
    impactedControlCount: rows.length,
    newlyExposedCount,
    refreshRequiredCount,
    projectedReadinessDrop,
    frameworkDeltas,
    rows,
  };
}

export function buildRegulatoryChangeImpactPackFromBaselines(input: {
  orgId: string | null;
  periodDays: number;
  coverageByControl: Map<string, "covered" | "partial" | "none">;
  baselines: FrameworkBaselineRow[];
  generatedAt?: string;
}): RegulatoryChangeImpactPack {
  const baselineByFramework = new Map(input.baselines.map((b) => [b.framework, b]));
  const results = REGULATORY_CHANGE_SCENARIOS.map((scenario) =>
    simulateRegulatoryScenario(scenario, input.coverageByControl, baselineByFramework),
  ).sort((a, b) => b.projectedReadinessDrop - a.projectedReadinessDrop);

  return {
    version: REGULATORY_CHANGE_IMPACT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    periodDays: input.periodDays,
    orgId: input.orgId,
    catalogVersion: REGULATORY_CHANGE_CATALOG_VERSION,
    scenarios: REGULATORY_CHANGE_SCENARIOS,
    results,
    highestImpactScenarioId: results[0]?.scenario.id ?? null,
  };
}

export async function buildRegulatoryChangeImpactPack(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<RegulatoryChangeImpactPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const periodDays = opts.periodDays ?? 30;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const baselinePack = await buildBaselineComparisonPack(userId, {
    orgId: opts.orgId,
    periodDays,
    supabase,
  });
  if (!baselinePack) return null;

  const { getComplianceCoverageSummary } = await import("@/lib/compliance/summary");
  const sinceIso = baselinePack.sinceIso;
  const summary = await getComplianceCoverageSummary(userId, {
    sinceIso,
    orgId: opts.orgId,
    supabase,
  });

  const coverageByControl = buildCoverageByControlFromBaselines(
    baselinePack.rows,
    summary.rows.map((r) => ({ control: r.control, status: r.status })),
  );

  return buildRegulatoryChangeImpactPackFromBaselines({
    orgId: opts.orgId,
    periodDays,
    coverageByControl,
    baselines: baselinePack.rows,
  });
}

export function regulatoryChangeImpactToCsv(pack: RegulatoryChangeImpactPack): string {
  const header =
    "scenario_id,regulation,control_id,kind,current_status,simulated_status,readiness_penalty,note";
  const lines: string[] = [];
  for (const result of pack.results) {
    for (const row of result.rows) {
      lines.push(
        [
          result.scenario.id,
          result.scenario.regulation,
          row.controlId,
          row.kind,
          row.currentStatus,
          row.simulatedStatus,
          row.readinessPenalty,
          JSON.stringify(row.note),
        ].join(","),
      );
    }
  }
  return `${header}\n${lines.join("\n")}\n`;
}
