import type { SupabaseClient } from "@supabase/supabase-js";

import { COMPLIANCE_CONTROLS, getComplianceControl } from "@/lib/compliance/catalog";
import {
  buildContinuousAssessmentReport,
  type AssessmentException,
} from "@/lib/compliance/continuous-assessment";
import type { ComplianceFramework } from "@/lib/compliance/types";
import { escapeCsvField } from "@/lib/audit/csv-escape";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const FEDRAMP_POAM_VERSION = "smohix-fedramp-poam/1";

/** FedRAMP assessment frameworks whose exceptions feed the POA&M pack. */
export const FEDRAMP_POAM_SOURCE_FRAMEWORKS: ComplianceFramework[] = [
  "soc2",
  "iso27001",
  "cmmc_l2",
];

export type CatalogNist80053Link = {
  catalogId: string;
  nistId: string;
  family: string;
  title: string;
  baseline: "moderate" | "high";
};

/** Curated Smohix catalog control → NIST SP 800-53 Rev 5 mappings for FedRAMP POA&M export. */
export const CATALOG_NIST_800_53_LINKS: CatalogNist80053Link[] = [
  { catalogId: "soc2:CC1.2", nistId: "PM-1", family: "PM", title: "Information security program plan", baseline: "moderate" },
  { catalogId: "soc2:CC5.3", nistId: "PL-2", family: "PL", title: "System security and privacy plans", baseline: "moderate" },
  { catalogId: "soc2:CC6.1", nistId: "AC-2", family: "AC", title: "Account management", baseline: "high" },
  { catalogId: "soc2:CC6.6", nistId: "SC-7", family: "SC", title: "Boundary protection", baseline: "high" },
  { catalogId: "soc2:CC7.2", nistId: "SI-4", family: "SI", title: "System monitoring", baseline: "high" },
  { catalogId: "soc2:CC7.3", nistId: "IR-4", family: "IR", title: "Incident handling", baseline: "high" },
  { catalogId: "soc2:CC7.4", nistId: "IR-8", family: "IR", title: "Incident response plan", baseline: "moderate" },
  { catalogId: "soc2:CC8.1", nistId: "CM-3", family: "CM", title: "Configuration change control", baseline: "moderate" },
  { catalogId: "iso:A.5.15", nistId: "AC-3", family: "AC", title: "Access enforcement", baseline: "high" },
  { catalogId: "iso:A.5.23", nistId: "SA-9", family: "SA", title: "External system services", baseline: "moderate" },
  { catalogId: "iso:A.5.24", nistId: "IR-5", family: "IR", title: "Incident monitoring", baseline: "moderate" },
  { catalogId: "iso:A.8.2", nistId: "AC-6", family: "AC", title: "Least privilege", baseline: "high" },
  { catalogId: "iso:A.8.9", nistId: "CM-2", family: "CM", title: "Baseline configuration", baseline: "moderate" },
  { catalogId: "iso:A.8.16", nistId: "AU-6", family: "AU", title: "Audit record review, analysis, and reporting", baseline: "moderate" },
  { catalogId: "iso:A.8.25", nistId: "SA-11", family: "SA", title: "Developer testing and evaluation", baseline: "moderate" },
  { catalogId: "cmmc_l2:3.1.1", nistId: "AC-2", family: "AC", title: "Account management", baseline: "high" },
  { catalogId: "cmmc_l2:3.1.2", nistId: "AC-3", family: "AC", title: "Access enforcement", baseline: "high" },
  { catalogId: "cmmc_l2:3.3.1", nistId: "AU-2", family: "AU", title: "Event logging", baseline: "moderate" },
  { catalogId: "cmmc_l2:3.3.2", nistId: "AU-12", family: "AU", title: "Audit record generation", baseline: "moderate" },
  { catalogId: "cmmc_l2:3.4.1", nistId: "CM-2", family: "CM", title: "Baseline configuration", baseline: "moderate" },
  { catalogId: "cmmc_l2:3.4.2", nistId: "CM-6", family: "CM", title: "Configuration settings", baseline: "moderate" },
  { catalogId: "cmmc_l2:3.6.1", nistId: "IR-4", family: "IR", title: "Incident handling", baseline: "high" },
  { catalogId: "cmmc_l2:3.6.2", nistId: "IR-6", family: "IR", title: "Incident reporting", baseline: "moderate" },
  { catalogId: "cmmc_l2:3.11.2", nistId: "RA-5", family: "RA", title: "Vulnerability monitoring and scanning", baseline: "high" },
  { catalogId: "cmmc_l2:3.13.1", nistId: "SC-7", family: "SC", title: "Boundary protection", baseline: "high" },
  { catalogId: "cmmc_l2:3.14.2", nistId: "SI-3", family: "SI", title: "Malicious code protection", baseline: "high" },
];

const NIST_BY_CATALOG = new Map(CATALOG_NIST_800_53_LINKS.map((l) => [l.catalogId, l]));

export function catalogIdForFrameworkRef(
  framework: ComplianceFramework,
  controlRef: string,
): string | null {
  if (framework === "iso27001") return `iso:${controlRef}`;
  return `${framework}:${controlRef}`;
}

export function riskRatingForWeakness(reason: string): "High" | "Moderate" | "Low" {
  const r = reason.toLowerCase();
  if (r.includes("no audit") || r.includes("no audit or policy")) return "High";
  if (r.includes("regressed")) return "Moderate";
  if (r.includes("partial")) return "Moderate";
  return "Low";
}

export function defaultPoamCompletionDate(daysFromNow = 90): string {
  return new Date(Date.now() + daysFromNow * 86_400_000).toISOString().slice(0, 10);
}

export type FedrampPoamGapSource = {
  framework: ComplianceFramework;
  controlRef: string;
  controlTitle: string;
  domain: string;
  reason: string;
};

export type FedrampPoamRow = {
  poamId: string;
  nistControlId: string;
  nistControlTitle: string;
  nistFamily: string;
  nistBaseline: string;
  weaknessDescription: string;
  sourceFrameworks: string[];
  sourceControlRefs: string[];
  riskRating: "High" | "Moderate" | "Low";
  status: "Open";
  scheduledCompletionDate: string;
  milestone: string;
  comments: string;
};

export type FedrampPoamPack = {
  version: typeof FEDRAMP_POAM_VERSION;
  generatedAt: string;
  periodDays: number;
  sinceIso: string;
  orgId: string | null;
  deploymentTier: string | null;
  dataRegion: string | null;
  dataBoundary: string | null;
  sourceFrameworks: ComplianceFramework[];
  gapSourceCount: number;
  poamRowCount: number;
  unmappedGapCount: number;
  rows: FedrampPoamRow[];
};

function frameworkLabel(framework: ComplianceFramework): string {
  if (framework === "soc2") return "SOC 2";
  if (framework === "iso27001") return "ISO 27001";
  if (framework === "cmmc_l2") return "CMMC L2 / 800-171";
  return framework;
}

function collectGapSources(exceptions: AssessmentException[], framework: ComplianceFramework): FedrampPoamGapSource[] {
  return exceptions.map((ex) => ({
    framework,
    controlRef: ex.controlRef,
    controlTitle: ex.title,
    domain: ex.domain,
    reason: ex.reason,
  }));
}

export function buildFedrampPoamRows(gaps: FedrampPoamGapSource[]): {
  rows: FedrampPoamRow[];
  unmappedGapCount: number;
} {
  const byNist = new Map<
    string,
    {
      link: CatalogNist80053Link;
      sources: FedrampPoamGapSource[];
      maxRisk: "High" | "Moderate" | "Low";
    }
  >();
  let unmappedGapCount = 0;

  for (const gap of gaps) {
    const catalogId = catalogIdForFrameworkRef(gap.framework, gap.controlRef);
    if (!catalogId) {
      unmappedGapCount += 1;
      continue;
    }
    const link = NIST_BY_CATALOG.get(catalogId);
    if (!link) {
      unmappedGapCount += 1;
      continue;
    }
    if (!getComplianceControl(catalogId)) {
      unmappedGapCount += 1;
      continue;
    }

    const risk = riskRatingForWeakness(gap.reason);
    const existing = byNist.get(link.nistId);
    if (!existing) {
      byNist.set(link.nistId, { link, sources: [gap], maxRisk: risk });
      continue;
    }
    existing.sources.push(gap);
    const order = { High: 3, Moderate: 2, Low: 1 };
    if (order[risk] > order[existing.maxRisk]) existing.maxRisk = risk;
  }

  const rows: FedrampPoamRow[] = [];
  let seq = 1;
  const sorted = [...byNist.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  for (const [nistId, entry] of sorted) {
    const frameworks = [...new Set(entry.sources.map((s) => frameworkLabel(s.framework)))];
    const refs = [...new Set(entry.sources.map((s) => `${frameworkLabel(s.framework)} ${s.controlRef}`))];
    const weaknessLines = entry.sources.map(
      (s) => `[${frameworkLabel(s.framework)} ${s.controlRef}] ${s.reason}`,
    );
    const completion = defaultPoamCompletionDate(entry.maxRisk === "High" ? 60 : 90);

    rows.push({
      poamId: `POAM-${String(seq).padStart(3, "0")}`,
      nistControlId: nistId,
      nistControlTitle: entry.link.title,
      nistFamily: entry.link.family,
      nistBaseline: entry.link.baseline,
      weaknessDescription: weaknessLines.join(" | "),
      sourceFrameworks: frameworks,
      sourceControlRefs: refs,
      riskRating: entry.maxRisk,
      status: "Open",
      scheduledCompletionDate: completion,
      milestone: `Remediate ${nistId} — close continuous assessment exception(s)`,
      comments: `Derived from Smohix continuous assessment gaps mapped to NIST SP 800-53 Rev 5 (${entry.link.baseline} baseline).`,
    });
    seq += 1;
  }

  return { rows, unmappedGapCount };
}

export async function buildFedrampPoamPack(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<FedrampPoamPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const periodDays = opts.periodDays ?? 30;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const reports = await Promise.all(
    FEDRAMP_POAM_SOURCE_FRAMEWORKS.map((framework) =>
      buildContinuousAssessmentReport(userId, {
        framework,
        orgId: opts.orgId,
        periodDays,
        supabase,
      }),
    ),
  );

  if (reports.some((r) => !r)) return null;

  const gaps: FedrampPoamGapSource[] = [];
  for (const report of reports) {
    if (!report) continue;
    gaps.push(...collectGapSources(report.exceptions, report.framework));
  }

  const { rows, unmappedGapCount } = buildFedrampPoamRows(gaps);
  const sinceIso = reports[0]?.currentPeriod.sinceIso ?? new Date().toISOString();

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("deployment_tier, data_region, data_boundary")
    .eq("id", opts.orgId)
    .maybeSingle();

  return {
    version: FEDRAMP_POAM_VERSION,
    generatedAt: new Date().toISOString(),
    periodDays,
    sinceIso,
    orgId: opts.orgId,
    deploymentTier: (orgRow?.deployment_tier as string | null) ?? null,
    dataRegion: (orgRow?.data_region as string | null) ?? null,
    dataBoundary: (orgRow?.data_boundary as string | null) ?? null,
    sourceFrameworks: [...FEDRAMP_POAM_SOURCE_FRAMEWORKS],
    gapSourceCount: gaps.length,
    poamRowCount: rows.length,
    unmappedGapCount,
    rows,
  };
}

const POAM_CSV_HEADERS = [
  "poam_id",
  "nist_control_id",
  "nist_control_title",
  "nist_family",
  "nist_baseline",
  "weakness_description",
  "source_frameworks",
  "source_control_refs",
  "risk_rating",
  "status",
  "scheduled_completion_date",
  "milestone",
  "comments",
] as const;

export function fedrampPoamToCsv(pack: FedrampPoamPack): string {
  const lines = [POAM_CSV_HEADERS.join(",")];
  for (const row of pack.rows) {
    lines.push(
      [
        row.poamId,
        row.nistControlId,
        row.nistControlTitle,
        row.nistFamily,
        row.nistBaseline,
        row.weaknessDescription,
        row.sourceFrameworks.join("; "),
        row.sourceControlRefs.join("; "),
        row.riskRating,
        row.status,
        row.scheduledCompletionDate,
        row.milestone,
        row.comments,
      ]
        .map((v) => escapeCsvField(String(v)))
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

export function validateCatalogNistLinks(): { ok: true } | { ok: false; missing: string[] } {
  const missing: string[] = [];
  for (const link of CATALOG_NIST_800_53_LINKS) {
    if (!COMPLIANCE_CONTROLS.some((c) => c.id === link.catalogId)) {
      missing.push(link.catalogId);
    }
  }
  return missing.length === 0 ? { ok: true } : { ok: false, missing };
}
