import type { SupabaseClient } from "@supabase/supabase-js";

import type { ComplianceFramework } from "@/lib/compliance/types";
import { frameworkLabel } from "@/lib/compliance/gap-remediation";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listThirdPartyVendors } from "@/lib/third-party-risk/data";
import type {
  ThirdPartyVendorRow,
  VendorControlRow,
  VendorRiskTier,
} from "@/lib/third-party-risk/types";

export const INHERITED_CONTROL_COVERAGE_GAPS_VERSION =
  "zentro-inherited-control-coverage-gaps/1";

export type InheritedControlGapKind =
  | "no_audit_evidence"
  | "not_attested"
  | "overdue_attestation";

export type InheritedControlGapRow = {
  id: string;
  vendorId: string;
  vendorName: string;
  riskTier: VendorRiskTier;
  category: ThirdPartyVendorRow["category"];
  vendorStatus: ThirdPartyVendorRow["status"];
  vendorReadinessPercent: number;
  controlId: string;
  controlRef: string;
  controlTitle: string;
  framework: ComplianceFramework;
  frameworkLabel: string;
  gapKind: InheritedControlGapKind;
  attestationStatus: VendorControlRow["attestationStatus"];
  linkedAuditEvidenceCount: number;
  detail: string;
  vendorHref: string;
  controlHref: string;
};

export type VendorCoverageSummary = {
  vendorId: string;
  vendorName: string;
  riskTier: VendorRiskTier;
  category: ThirdPartyVendorRow["category"];
  status: ThirdPartyVendorRow["status"];
  inheritedControlCount: number;
  gapCount: number;
  readinessPercent: number;
  reviewDueAt: string | null;
};

export type TierGapSummary = {
  tier: VendorRiskTier;
  vendorCount: number;
  vendorsWithGaps: number;
  gapCount: number;
};

export type InheritedControlCoverageGapPack = {
  version: typeof INHERITED_CONTROL_COVERAGE_GAPS_VERSION;
  generatedAt: string;
  periodDays: number;
  orgId: string | null;
  vendorCount: number;
  vendorsWithGaps: number;
  totalGapCount: number;
  criticalVendorGapCount: number;
  activeVendorCount: number;
  gaps: InheritedControlGapRow[];
  vendorSummaries: VendorCoverageSummary[];
  tierSummaries: TierGapSummary[];
};

const TIER_RANK: Record<VendorRiskTier, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const GAP_RANK: Record<InheritedControlGapKind, number> = {
  overdue_attestation: 0,
  no_audit_evidence: 1,
  not_attested: 2,
};

export function expectedReadinessFloorForTier(tier: VendorRiskTier): number {
  switch (tier) {
    case "critical":
      return 80;
    case "high":
      return 65;
    case "medium":
      return 50;
    case "low":
      return 35;
  }
}

export function classifyInheritedControlGap(
  control: VendorControlRow,
  riskTier: VendorRiskTier,
): InheritedControlGapKind | null {
  if (control.source !== "inherited") return null;

  if (control.attestationStatus === "overdue") {
    return "overdue_attestation";
  }

  if (control.linkedAuditEvidenceCount === 0) {
    return "no_audit_evidence";
  }

  const strictAttestation = riskTier === "critical" || riskTier === "high";
  if (
    strictAttestation &&
    control.attestationStatus !== "attested" &&
    control.attestationStatus !== null
  ) {
    return "not_attested";
  }

  if (strictAttestation && control.attestationStatus === null) {
    return "not_attested";
  }

  return null;
}

export function gapDetailForKind(
  kind: InheritedControlGapKind,
  riskTier: VendorRiskTier,
): string {
  switch (kind) {
    case "no_audit_evidence":
      return `No linked audit evidence in monitoring window — ${riskTier} tier expects reuse of org control evidence.`;
    case "overdue_attestation":
      return "Inherited control attestation is overdue.";
    case "not_attested":
      return `${riskTier} tier vendor requires attested inherited controls.`;
  }
}

export function buildInheritedControlGapsForVendor(
  vendor: ThirdPartyVendorRow,
): InheritedControlGapRow[] {
  const rows: InheritedControlGapRow[] = [];

  for (const control of vendor.controls) {
    const kind = classifyInheritedControlGap(control, vendor.riskTier);
    if (!kind) continue;

    rows.push({
      id: `${vendor.id}::${control.controlId}::${kind}`,
      vendorId: vendor.id,
      vendorName: vendor.name,
      riskTier: vendor.riskTier,
      category: vendor.category,
      vendorStatus: vendor.status,
      vendorReadinessPercent: vendor.readinessPercent,
      controlId: control.controlId,
      controlRef: control.control.ref,
      controlTitle: control.control.title,
      framework: control.control.framework,
      frameworkLabel: frameworkLabel(control.control.framework),
      gapKind: kind,
      attestationStatus: control.attestationStatus,
      linkedAuditEvidenceCount: control.linkedAuditEvidenceCount,
      detail: gapDetailForKind(kind, vendor.riskTier),
      vendorHref: "/governance/third-party-risk",
      controlHref: control.auditEvidenceHref,
    });
  }

  return rows;
}

export function summarizeVendorCoverage(
  vendor: ThirdPartyVendorRow,
  gapCount: number,
): VendorCoverageSummary {
  const inheritedControlCount = vendor.controls.filter((c) => c.source === "inherited").length;
  return {
    vendorId: vendor.id,
    vendorName: vendor.name,
    riskTier: vendor.riskTier,
    category: vendor.category,
    status: vendor.status,
    inheritedControlCount,
    gapCount,
    readinessPercent: vendor.readinessPercent,
    reviewDueAt: vendor.reviewDueAt,
  };
}

export function summarizeTierGaps(
  vendorSummaries: VendorCoverageSummary[],
  gaps: InheritedControlGapRow[],
): TierGapSummary[] {
  const tiers: VendorRiskTier[] = ["critical", "high", "medium", "low"];
  return tiers.map((tier) => {
    const vendors = vendorSummaries.filter((v) => v.riskTier === tier);
    return {
      tier,
      vendorCount: vendors.length,
      vendorsWithGaps: vendors.filter((v) => v.gapCount > 0).length,
      gapCount: gaps.filter((g) => g.riskTier === tier).length,
    };
  });
}

export function buildInheritedControlCoverageGapPackFromVendors(input: {
  orgId: string | null;
  periodDays: number;
  vendors: ThirdPartyVendorRow[];
  generatedAt?: string;
}): InheritedControlCoverageGapPack {
  const allGaps: InheritedControlGapRow[] = [];
  const vendorSummaries: VendorCoverageSummary[] = [];

  for (const vendor of input.vendors) {
    const vendorGaps = buildInheritedControlGapsForVendor(vendor);
    allGaps.push(...vendorGaps);
    vendorSummaries.push(summarizeVendorCoverage(vendor, vendorGaps.length));
  }

  const gaps = allGaps.sort((a, b) => {
    return (
      TIER_RANK[a.riskTier] - TIER_RANK[b.riskTier] ||
      GAP_RANK[a.gapKind] - GAP_RANK[b.gapKind] ||
      a.vendorName.localeCompare(b.vendorName) ||
      a.controlRef.localeCompare(b.controlRef)
    );
  });

  const vendorsWithGaps = vendorSummaries.filter((v) => v.gapCount > 0).length;
  const criticalVendorGapCount = vendorSummaries.filter(
    (v) => v.riskTier === "critical" && v.gapCount > 0,
  ).length;

  return {
    version: INHERITED_CONTROL_COVERAGE_GAPS_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    periodDays: input.periodDays,
    orgId: input.orgId,
    vendorCount: input.vendors.length,
    vendorsWithGaps,
    totalGapCount: gaps.length,
    criticalVendorGapCount,
    activeVendorCount: input.vendors.filter((v) => v.status === "active").length,
    gaps,
    vendorSummaries: vendorSummaries.sort(
      (a, b) => TIER_RANK[a.riskTier] - TIER_RANK[b.riskTier] || b.gapCount - a.gapCount,
    ),
    tierSummaries: summarizeTierGaps(vendorSummaries, gaps),
  };
}

export async function buildInheritedControlCoverageGapPack(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<InheritedControlCoverageGapPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const periodDays = opts.periodDays ?? 30;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const vendors = await listThirdPartyVendors(userId, opts.orgId, supabase);

  return buildInheritedControlCoverageGapPackFromVendors({
    orgId: opts.orgId,
    periodDays,
    vendors,
  });
}

export function inheritedControlCoverageGapsToCsv(
  pack: InheritedControlCoverageGapPack,
): string {
  const header =
    "vendor_name,risk_tier,category,control_ref,control_title,framework,gap_kind,attestation_status,audit_evidence_count,vendor_readiness,detail";
  const lines = pack.gaps.map((g) =>
    [
      JSON.stringify(g.vendorName),
      g.riskTier,
      g.category,
      g.controlRef,
      JSON.stringify(g.controlTitle),
      g.framework,
      g.gapKind,
      g.attestationStatus ?? "",
      g.linkedAuditEvidenceCount,
      g.vendorReadinessPercent,
      JSON.stringify(g.detail),
    ].join(","),
  );
  return `${header}\n${lines.join("\n")}\n`;
}
