import type { SupabaseClient } from "@supabase/supabase-js";

import { listAcceptedPolicyGuardrailsByPlaybook } from "@/lib/approvals/policy-suggestions";
import { listAuditEventTypesForCompliance } from "@/lib/audit/data";
import type { AcceptedPolicyGuardrails } from "@/lib/approvals/policy-suggestions";
import { COMPLIANCE_CONTROLS } from "@/lib/compliance/catalog";
import type { ComplianceEvidenceAuditRow } from "@/lib/compliance/export";
import {
  getEvidenceBundleForOrg,
  listEvidenceBundlesForOrg,
  type EvidenceBundleRow,
} from "@/lib/compliance/evidence-bundle";
import { complianceControlsForAcceptedPolicy } from "@/lib/compliance/map-policy";
import { complianceControlsForAuditEvent } from "@/lib/compliance/map-audit";
import { getComplianceCoverageSummary } from "@/lib/compliance/summary";
import type { ComplianceFramework } from "@/lib/compliance/types";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const EVIDENCE_LINEAGE_VERSION = "smohix-evidence-lineage/1";

export type LineageStageId =
  | "audit_log"
  | "policy_acceptance"
  | "control_mapping"
  | "evidence_pack"
  | "evidence_bundle"
  | "assessor_workbook";

export type LineageStage = {
  stage: LineageStageId;
  label: string;
  count: number;
  detail: string;
  href: string;
};

export type LineageAuditSource = {
  eventType: string;
  eventCount: number;
};

export type LineagePolicySource = {
  playbookId: string;
};

export type ControlEvidenceTrail = {
  controlId: string;
  framework: ComplianceFramework;
  ref: string;
  title: string;
  status: "covered" | "partial" | "none";
  auditEvidenceCount: number;
  policyEvidenceCount: number;
  auditSources: LineageAuditSource[];
  policySources: LineagePolicySource[];
  bundleIds: string[];
  inLatestBundle: boolean;
  inAssessorWorkbook: boolean;
  lineageDepth: number;
};

export type BundleLineageSnapshot = {
  bundleId: string;
  windowLabel: string;
  createdAt: string;
  manifestSha256: string;
  auditEventCount: number;
  acceptedPolicyCount: number;
  storageUri: string;
  deliveryStatus: string;
  href: string;
};

export type EvidenceLineagePack = {
  version: typeof EVIDENCE_LINEAGE_VERSION;
  generatedAt: string;
  periodDays: number;
  sinceIso: string;
  orgId: string | null;
  pipeline: LineageStage[];
  auditEventsScanned: number;
  acceptedPolicyCount: number;
  mappedControlCount: number;
  bundleCount: number;
  assessorWorkbookExported: boolean;
  bundles: BundleLineageSnapshot[];
  trails: ControlEvidenceTrail[];
  hubControlIds: string[];
};

function controlRefsFromAuditRow(row: ComplianceEvidenceAuditRow): Partial<Record<ComplianceFramework, string[]>> {
  return {
    soc2: row.soc2Controls,
    iso27001: row.iso27001Controls,
    pcidss: row.pciDssControls,
    hipaa: row.hipaaControls,
    nist_csf: row.nistCsfControls,
    cis_v8: row.cisV8Controls,
    cmmc_l2: row.cmmcL2Controls,
    gdpr_art32: row.gdprArt32Controls,
  };
}

export function auditRowTouchesControl(
  row: ComplianceEvidenceAuditRow,
  framework: ComplianceFramework,
  ref: string,
): boolean {
  const refs = controlRefsFromAuditRow(row)[framework];
  return refs?.includes(ref) ?? false;
}

export function countAuditEventsByType(rows: { event_type: string }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const t = String(row.event_type ?? "").trim();
    if (!t) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return counts;
}

export function buildAuditSourcesByControl(
  eventTypeCounts: Map<string, number>,
): Map<string, LineageAuditSource[]> {
  const byControl = new Map<string, LineageAuditSource[]>();

  for (const [eventType, eventCount] of eventTypeCounts) {
    for (const control of complianceControlsForAuditEvent(eventType)) {
      const list = byControl.get(control.id) ?? [];
      list.push({ eventType, eventCount });
      byControl.set(control.id, list);
    }
  }

  for (const [, list] of byControl) {
    list.sort((a, b) => b.eventCount - a.eventCount);
  }

  return byControl;
}

export function buildPolicySourcesByControl(
  accepted: Record<string, import("@/lib/approvals/policy-suggestions").AcceptedPolicyGuardrails>,
): Map<string, LineagePolicySource[]> {
  const byControl = new Map<string, LineagePolicySource[]>();

  for (const guardrails of Object.values(accepted)) {
    for (const control of complianceControlsForAcceptedPolicy(guardrails)) {
      const list = byControl.get(control.id) ?? [];
      if (!list.some((p) => p.playbookId === guardrails.playbookId)) {
        list.push({ playbookId: guardrails.playbookId });
      }
      byControl.set(control.id, list);
    }
  }

  return byControl;
}

export function bundleOverlapsPeriod(bundle: EvidenceBundleRow, sinceIso: string): boolean {
  if (!bundle.sinceIso) return true;
  return bundle.sinceIso >= sinceIso;
}

export function controlsInBundlePack(
  packEvents: ComplianceEvidenceAuditRow[],
  packPolicies: { playbookId: string }[],
  acceptedByPlaybook: Record<string, AcceptedPolicyGuardrails>,
): Set<string> {
  const ids = new Set<string>();

  for (const row of packEvents) {
    for (const control of COMPLIANCE_CONTROLS) {
      if (auditRowTouchesControl(row, control.framework, control.ref)) {
        ids.add(control.id);
      }
    }
  }

  for (const policy of packPolicies) {
    const guardrails = acceptedByPlaybook[policy.playbookId];
    if (!guardrails) continue;
    for (const control of complianceControlsForAcceptedPolicy(guardrails)) {
      ids.add(control.id);
    }
  }

  return ids;
}

export function buildLineagePipeline(input: {
  auditEventsScanned: number;
  acceptedPolicyCount: number;
  mappedControlCount: number;
  bundleCount: number;
  assessorWorkbookExported: boolean;
  latestBundleAuditEvents: number;
}): LineageStage[] {
  return [
    {
      stage: "audit_log",
      label: "Audit log",
      count: input.auditEventsScanned,
      detail: "Org-scoped events in the assessment window",
      href: "/audit",
    },
    {
      stage: "policy_acceptance",
      label: "Accepted policies",
      count: input.acceptedPolicyCount,
      detail: "Automation playbooks with guardrails on file",
      href: "/governance/policies",
    },
    {
      stage: "control_mapping",
      label: "Control mapping",
      count: input.mappedControlCount,
      detail: "Catalog controls linked to audit and policy evidence",
      href: "/governance/compliance/baseline-comparison",
    },
    {
      stage: "evidence_pack",
      label: "Evidence pack",
      count: input.latestBundleAuditEvents || input.auditEventsScanned,
      detail: "Serialized audit + policy rows with control refs",
      href: "/governance/compliance/bundles",
    },
    {
      stage: "evidence_bundle",
      label: "Evidence bundles",
      count: input.bundleCount,
      detail: "Tamper-evident manifests with JSON/CSV artifacts",
      href: "/governance/compliance/bundles",
    },
    {
      stage: "assessor_workbook",
      label: "Assessor workbook",
      count: input.assessorWorkbookExported ? 1 : 0,
      detail: input.assessorWorkbookExported
        ? "ZIP export includes evidence pack + framework assessments"
        : "Not exported in this period — run workbook when ready",
      href: "/governance/compliance/workbook",
    },
  ];
}

export function buildControlEvidenceTrails(input: {
  coverageRows: {
    control: { id: string; framework: ComplianceFramework; ref: string; title: string };
    status: "covered" | "partial" | "none";
    auditEvidenceCount: number;
    policyEvidenceCount: number;
  }[];
  auditByControl: Map<string, LineageAuditSource[]>;
  policyByControl: Map<string, LineagePolicySource[]>;
  bundles: EvidenceBundleRow[];
  sinceIso: string;
  controlsInLatestBundle: Set<string>;
  assessorWorkbookExported: boolean;
}): ControlEvidenceTrail[] {
  const bundleIdsInPeriod = input.bundles
    .filter((b) => bundleOverlapsPeriod(b, input.sinceIso))
    .map((b) => b.id);

  const trails: ControlEvidenceTrail[] = [];

  for (const row of input.coverageRows) {
    const auditSources = input.auditByControl.get(row.control.id) ?? [];
    const policySources = input.policyByControl.get(row.control.id) ?? [];
    if (
      auditSources.length === 0 &&
      policySources.length === 0 &&
      row.auditEvidenceCount === 0 &&
      row.policyEvidenceCount === 0
    ) {
      continue;
    }

    const inLatestBundle = input.controlsInLatestBundle.has(row.control.id);
    const lineageDepth =
      (auditSources.length > 0 ? 1 : 0) +
      (policySources.length > 0 ? 1 : 0) +
      (inLatestBundle ? 1 : 0) +
      (input.assessorWorkbookExported && inLatestBundle ? 1 : 0);

    trails.push({
      controlId: row.control.id,
      framework: row.control.framework,
      ref: row.control.ref,
      title: row.control.title,
      status: row.status,
      auditEvidenceCount: row.auditEvidenceCount,
      policyEvidenceCount: row.policyEvidenceCount,
      auditSources,
      policySources,
      bundleIds: inLatestBundle || row.auditEvidenceCount > 0 || row.policyEvidenceCount > 0 ? bundleIdsInPeriod : [],
      inLatestBundle,
      inAssessorWorkbook: input.assessorWorkbookExported && inLatestBundle,
      lineageDepth,
    });
  }

  return trails.sort((a, b) => b.lineageDepth - a.lineageDepth || b.auditSources.length - a.auditSources.length);
}

export function buildEvidenceLineagePackFromParts(input: {
  orgId: string | null;
  periodDays: number;
  sinceIso: string;
  auditEventsScanned: number;
  acceptedPolicyCount: number;
  bundles: EvidenceBundleRow[];
  trails: ControlEvidenceTrail[];
  assessorWorkbookExported: boolean;
  latestBundleAuditEvents: number;
  generatedAt?: string;
}): EvidenceLineagePack {
  const mappedControlCount = input.trails.length;
  const bundles: BundleLineageSnapshot[] = input.bundles.map((b) => ({
    bundleId: b.id,
    windowLabel: b.windowLabel,
    createdAt: b.createdAt,
    manifestSha256: b.manifestSha256,
    auditEventCount: b.manifest.auditEventCount,
    acceptedPolicyCount: b.manifest.acceptedPolicyCount,
    storageUri: b.storageUri,
    deliveryStatus: b.deliveryStatus,
    href: `/governance/compliance/bundles`,
  }));

  const hubControlIds = [...input.trails]
    .sort((a, b) => b.lineageDepth - a.lineageDepth)
    .slice(0, 10)
    .map((t) => t.controlId);

  return {
    version: EVIDENCE_LINEAGE_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    periodDays: input.periodDays,
    sinceIso: input.sinceIso,
    orgId: input.orgId,
    pipeline: buildLineagePipeline({
      auditEventsScanned: input.auditEventsScanned,
      acceptedPolicyCount: input.acceptedPolicyCount,
      mappedControlCount,
      bundleCount: input.bundles.length,
      assessorWorkbookExported: input.assessorWorkbookExported,
      latestBundleAuditEvents: input.latestBundleAuditEvents,
    }),
    auditEventsScanned: input.auditEventsScanned,
    acceptedPolicyCount: input.acceptedPolicyCount,
    mappedControlCount,
    bundleCount: input.bundles.length,
    assessorWorkbookExported: input.assessorWorkbookExported,
    bundles,
    trails: input.trails,
    hubControlIds,
  };
}

export async function buildEvidenceLineagePack(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<EvidenceLineagePack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const periodDays = opts.periodDays ?? 30;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const sinceIso = new Date(Date.now() - periodDays * 86_400_000).toISOString();

  const [summary, auditRows, accepted, bundles] = await Promise.all([
    getComplianceCoverageSummary(userId, { sinceIso, orgId: opts.orgId, supabase }),
    listAuditEventTypesForCompliance(userId, { sinceIso, orgId: opts.orgId, supabase }),
    listAcceptedPolicyGuardrailsByPlaybook(supabase, userId),
    listEvidenceBundlesForOrg(opts.orgId, { limit: 12, supabase }),
  ]);

  const eventTypeCounts = countAuditEventsByType(auditRows);
  const auditByControl = buildAuditSourcesByControl(eventTypeCounts);
  const policyByControl = buildPolicySourcesByControl(accepted);

  const assessorWorkbookExported = [...eventTypeCounts.keys()].includes(
    "governance.assessor_workbook_exported",
  );

  let controlsInLatestBundle = new Set<string>();
  let latestBundleAuditEvents = 0;

  const latestBundle = bundles[0];
  if (latestBundle) {
    const full = await getEvidenceBundleForOrg(latestBundle.id, opts.orgId, { supabase });
    if (full) {
      latestBundleAuditEvents = full.pack.auditEvents.length;
      controlsInLatestBundle = controlsInBundlePack(
        full.pack.auditEvents,
        full.pack.acceptedPolicies.map((p) => ({ playbookId: p.playbookId })),
        accepted,
      );
    }
  }

  const trails = buildControlEvidenceTrails({
    coverageRows: summary.rows.map((r) => ({
      control: r.control,
      status: r.status,
      auditEvidenceCount: r.auditEvidenceCount,
      policyEvidenceCount: r.policyEvidenceCount,
    })),
    auditByControl,
    policyByControl,
    bundles,
    sinceIso,
    controlsInLatestBundle,
    assessorWorkbookExported,
  });

  return buildEvidenceLineagePackFromParts({
    orgId: opts.orgId,
    periodDays,
    sinceIso,
    auditEventsScanned: summary.auditEventsScanned,
    acceptedPolicyCount: summary.acceptedPolicyCount,
    bundles,
    trails,
    assessorWorkbookExported,
    latestBundleAuditEvents,
  });
}

export function evidenceLineageToCsv(pack: EvidenceLineagePack): string {
  const header =
    "control_id,framework,ref,status,audit_sources,policy_sources,bundle_ids,in_latest_bundle,in_assessor_workbook,lineage_depth";
  const lines = pack.trails.map((t) =>
    [
      t.controlId,
      t.framework,
      t.ref,
      t.status,
      t.auditSources.map((a) => `${a.eventType}(${a.eventCount})`).join(";"),
      t.policySources.map((p) => p.playbookId).join(";"),
      t.bundleIds.join(";"),
      t.inLatestBundle,
      t.inAssessorWorkbook,
      t.lineageDepth,
    ].join(","),
  );
  return `${header}\n${lines.join("\n")}\n`;
}
