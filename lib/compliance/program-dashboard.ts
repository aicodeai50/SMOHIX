import type { SupabaseClient } from "@supabase/supabase-js";

import { listControlAttestationBoard } from "@/lib/compliance/attestation/data";
import { buildIso27001AssessmentReport } from "@/lib/compliance/iso-assessment";
import { buildHipaaSecurityAssessmentReport } from "@/lib/compliance/hipaa-assessment";
import { buildCisV8AssessmentReport } from "@/lib/compliance/cis-v8-assessment";
import { buildCmmcL2AssessmentReport } from "@/lib/compliance/cmmc-l2-assessment";
import { buildGdprArt32AssessmentReport } from "@/lib/compliance/gdpr-art32-assessment";
import { buildNistCsfAlignmentReport } from "@/lib/compliance/nist-csf-assessment";
import { buildPciDssAssessmentReport } from "@/lib/compliance/pci-dss-assessment";
import { buildSoc2TypeIIReport } from "@/lib/compliance/type-ii-report";
import {
  listComplianceGapRemediations,
  summarizeGapRemediationStats,
  type ComplianceGapRemediationStats,
} from "@/lib/compliance/gap-remediation";
import { listThirdPartyVendors } from "@/lib/third-party-risk/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ProgramGapRow = {
  framework: "soc2" | "iso27001" | "pcidss" | "hipaa" | "nist_csf" | "cis_v8" | "cmmc_l2" | "gdpr_art32";
  controlRef: string;
  title: string;
  reason: string;
};

export type ProgramOverdueAttestation = {
  controlRef: string;
  title: string;
  dueAt: string;
  ownerLabel: string | null;
};

export type ComplianceProgramDashboard = {
  generatedAt: string;
  periodDays: number;
  overallReadinessPercent: number;
  soc2: {
    readinessPercent: number;
    exceptionCount: number;
    trends: { improved: number; unchanged: number; regressed: number };
  };
  iso27001: {
    readinessPercent: number;
    exceptionCount: number;
    domainCount: number;
    weakestDomain: string | null;
  };
  pcidss: {
    readinessPercent: number;
    exceptionCount: number;
    requirementCount: number;
    weakestRequirement: string | null;
  };
  hipaa: {
    readinessPercent: number;
    exceptionCount: number;
    safeguardCount: number;
    weakestSafeguard: string | null;
  };
  nistCsf: {
    readinessPercent: number;
    exceptionCount: number;
    overallMaturityTier: number;
    overallMaturityLabel: string;
    functionCount: number;
    weakestFunction: string | null;
  };
  cisV8: {
    readinessPercent: number;
    exceptionCount: number;
    attainedIg: string;
    attainedIgLabel: string;
    implementationGroupCount: number;
    weakestIg: string | null;
  };
  cmmcL2: {
    readinessPercent: number;
    exceptionCount: number;
    sprsScore: number;
    sprsBand: string;
    familyCount: number;
    weakestFamily: string | null;
  };
  gdprArt32: {
    readinessPercent: number;
    exceptionCount: number;
    dpaBand: string;
    domainCount: number;
    weakestDomain: string | null;
  };
  attestations: {
    total: number;
    attested: number;
    pending: number;
    overdue: number;
  };
  vendors: {
    count: number;
    critical: number;
    avgReadinessPercent: number;
    reusedEvidenceCount: number;
  };
  evidenceBundleCount: number;
  legalHoldIncidentCount: number;
  topGaps: ProgramGapRow[];
  overdueAttestations: ProgramOverdueAttestation[];
  gapRemediations: ComplianceGapRemediationStats;
};

export function computeOverallProgramReadiness(
  parts: { value: number; weight: number }[],
): number {
  const totalWeight = parts.reduce((s, p) => s + p.weight, 0);
  if (totalWeight <= 0) return 0;
  const weighted = parts.reduce((s, p) => s + p.value * p.weight, 0) / totalWeight;
  return Math.round(weighted * 10) / 10;
}

export async function buildComplianceProgramDashboard(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    auditorReadOnly?: boolean;
    supabase?: SupabaseClient;
  },
): Promise<ComplianceProgramDashboard | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const periodDays = opts.periodDays ?? 30;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const [soc2, iso, pci, hipaa, nistCsf, cisV8, cmmcL2, gdprArt32, attestations, vendors] =
    await Promise.all([
      buildSoc2TypeIIReport(userId, { ...opts, periodDays, supabase }),
      buildIso27001AssessmentReport(userId, { ...opts, periodDays, supabase }),
      buildPciDssAssessmentReport(userId, { ...opts, periodDays, supabase }),
      buildHipaaSecurityAssessmentReport(userId, { ...opts, periodDays, supabase }),
      buildNistCsfAlignmentReport(userId, { ...opts, periodDays, supabase }),
      buildCisV8AssessmentReport(userId, { ...opts, periodDays, supabase }),
      buildCmmcL2AssessmentReport(userId, { ...opts, periodDays, supabase }),
      buildGdprArt32AssessmentReport(userId, { ...opts, periodDays, supabase }),
      listControlAttestationBoard(userId, opts.orgId, supabase),
      listThirdPartyVendors(userId, opts.orgId, supabase),
    ]);

  if (!soc2 || !iso || !pci || !hipaa || !nistCsf || !cisV8 || !cmmcL2 || !gdprArt32) return null;

  const soc2Trends = { improved: 0, unchanged: 0, regressed: 0 };
  for (const row of soc2.controlMonitoring) {
    soc2Trends[row.trend] += 1;
  }

  const isoWeakest = [...iso.domainSummary].sort(
    (a, b) => a.readinessPercent - b.readinessPercent,
  )[0];
  const pciWeakest = [...pci.domainSummary].sort(
    (a, b) => a.readinessPercent - b.readinessPercent,
  )[0];
  const hipaaWeakest = [...hipaa.domainSummary].sort(
    (a, b) => a.readinessPercent - b.readinessPercent,
  )[0];
  const nistWeakest = [...nistCsf.functionMaturity].sort(
    (a, b) => a.readinessPercent - b.readinessPercent,
  )[0];
  const cisWeakest = [...cisV8.igReadiness].sort(
    (a, b) => a.readinessPercent - b.readinessPercent,
  )[0];
  const cmmcWeakest = [...cmmcL2.familyReadiness].sort(
    (a, b) => a.readinessPercent - b.readinessPercent,
  )[0];
  const gdprWeakest = [...gdprArt32.domainReadiness].sort(
    (a, b) => a.readinessPercent - b.readinessPercent,
  )[0];

  const attestationStats = {
    total: attestations.length,
    attested: attestations.filter((a) => a.status === "attested").length,
    pending: attestations.filter((a) => a.status === "pending").length,
    overdue: attestations.filter((a) => a.status === "overdue").length,
  };

  const attestationReadiness =
    attestationStats.total > 0
      ? (attestationStats.attested / attestationStats.total) * 100
      : 0;

  const vendorAvgReadiness =
    vendors.length > 0
      ? vendors.reduce((s, v) => s + v.readinessPercent, 0) / vendors.length
      : 0;

  const overallReadinessPercent = computeOverallProgramReadiness([
    { value: soc2.readinessPercent, weight: 2 },
    { value: iso.readinessPercent, weight: 2 },
    { value: pci.readinessPercent, weight: 2 },
    { value: hipaa.readinessPercent, weight: 2 },
    { value: nistCsf.readinessPercent, weight: 2 },
    { value: cisV8.readinessPercent, weight: 2 },
    { value: cmmcL2.readinessPercent, weight: 2 },
    { value: gdprArt32.readinessPercent, weight: 2 },
    { value: attestationReadiness, weight: 1.5 },
    { value: vendorAvgReadiness, weight: 1 },
  ]);

  const topGaps: ProgramGapRow[] = [
    ...soc2.exceptions.slice(0, 4).map((ex) => ({
      framework: "soc2" as const,
      controlRef: ex.controlRef,
      title: ex.title,
      reason: ex.reason,
    })),
    ...iso.exceptions.slice(0, 3).map((ex) => ({
      framework: "iso27001" as const,
      controlRef: ex.controlRef,
      title: ex.title,
      reason: ex.reason,
    })),
    ...pci.exceptions.slice(0, 2).map((ex) => ({
      framework: "pcidss" as const,
      controlRef: ex.controlRef,
      title: ex.title,
      reason: ex.reason,
    })),
    ...hipaa.exceptions.slice(0, 2).map((ex) => ({
      framework: "hipaa" as const,
      controlRef: ex.controlRef,
      title: ex.title,
      reason: ex.reason,
    })),
    ...nistCsf.exceptions.slice(0, 2).map((ex) => ({
      framework: "nist_csf" as const,
      controlRef: ex.controlRef,
      title: ex.title,
      reason: ex.reason,
    })),
    ...cisV8.exceptions.slice(0, 2).map((ex) => ({
      framework: "cis_v8" as const,
      controlRef: ex.controlRef,
      title: ex.title,
      reason: ex.reason,
    })),
    ...cmmcL2.exceptions.slice(0, 2).map((ex) => ({
      framework: "cmmc_l2" as const,
      controlRef: ex.controlRef,
      title: ex.title,
      reason: ex.reason,
    })),
    ...gdprArt32.exceptions.slice(0, 2).map((ex) => ({
      framework: "gdpr_art32" as const,
      controlRef: ex.controlRef,
      title: ex.title,
      reason: ex.reason,
    })),
  ].slice(0, 16);

  const overdueAttestations: ProgramOverdueAttestation[] = attestations
    .filter((a) => a.status === "overdue")
    .slice(0, 6)
    .map((a) => ({
      controlRef: a.control.ref,
      title: a.control.title,
      dueAt: a.dueAt,
      ownerLabel: a.ownerLabel,
    }));

  const gapRemediationRows = await listComplianceGapRemediations(opts.orgId, supabase);
  const gapRemediations = summarizeGapRemediationStats(gapRemediationRows);

  return {
    generatedAt: new Date().toISOString(),
    periodDays,
    overallReadinessPercent,
    soc2: {
      readinessPercent: soc2.readinessPercent,
      exceptionCount: soc2.exceptions.length,
      trends: soc2Trends,
    },
    iso27001: {
      readinessPercent: iso.readinessPercent,
      exceptionCount: iso.exceptions.length,
      domainCount: iso.domainSummary.length,
      weakestDomain: isoWeakest?.domain ?? null,
    },
    pcidss: {
      readinessPercent: pci.readinessPercent,
      exceptionCount: pci.exceptions.length,
      requirementCount: pci.domainSummary.length,
      weakestRequirement: pciWeakest?.domain ?? null,
    },
    hipaa: {
      readinessPercent: hipaa.readinessPercent,
      exceptionCount: hipaa.exceptions.length,
      safeguardCount: hipaa.domainSummary.length,
      weakestSafeguard: hipaaWeakest?.domain ?? null,
    },
    nistCsf: {
      readinessPercent: nistCsf.readinessPercent,
      exceptionCount: nistCsf.exceptions.length,
      overallMaturityTier: nistCsf.overallMaturityTier,
      overallMaturityLabel: nistCsf.overallMaturityLabel,
      functionCount: nistCsf.functionMaturity.length,
      weakestFunction: nistWeakest?.function ?? null,
    },
    cisV8: {
      readinessPercent: cisV8.readinessPercent,
      exceptionCount: cisV8.exceptions.length,
      attainedIg: cisV8.attainedIg,
      attainedIgLabel: cisV8.attainedIgLabel,
      implementationGroupCount: cisV8.igReadiness.length,
      weakestIg: cisWeakest?.implementationGroup ?? null,
    },
    cmmcL2: {
      readinessPercent: cmmcL2.readinessPercent,
      exceptionCount: cmmcL2.exceptions.length,
      sprsScore: cmmcL2.sprsScore,
      sprsBand: cmmcL2.sprsBand,
      familyCount: cmmcL2.familyReadiness.length,
      weakestFamily: cmmcWeakest?.family ?? null,
    },
    gdprArt32: {
      readinessPercent: gdprArt32.readinessPercent,
      exceptionCount: gdprArt32.exceptions.length,
      dpaBand: gdprArt32.dpaBand,
      domainCount: gdprArt32.domainReadiness.length,
      weakestDomain: gdprWeakest?.domain ?? null,
    },
    attestations: attestationStats,
    vendors: {
      count: vendors.length,
      critical: vendors.filter((v) => v.riskTier === "critical").length,
      avgReadinessPercent: Math.round(vendorAvgReadiness * 10) / 10,
      reusedEvidenceCount: vendors.reduce((s, v) => s + v.reusedEvidenceCount, 0),
    },
    evidenceBundleCount: soc2.evidenceBundleCount,
    legalHoldIncidentCount: soc2.legalHoldIncidentCount,
    topGaps,
    overdueAttestations,
    gapRemediations,
  };
}
