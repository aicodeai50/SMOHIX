import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { listControlAttestationBoard } from "@/lib/compliance/attestation/data";
import { BASELINE_COMPARISON_FRAMEWORKS } from "@/lib/compliance/baseline-comparison";
import { buildContinuousAssessmentReport } from "@/lib/compliance/continuous-assessment";
import { catalogIdForFrameworkRef } from "@/lib/compliance/fedramp-poam";
import { frameworkLabel, gapKeyFor } from "@/lib/compliance/gap-remediation";
import type { ProgramGapRow } from "@/lib/compliance/program-dashboard";
import {
  buildPolicyDriftPack,
  type PolicyDriftFinding,
  type PolicyDriftSeverity,
} from "@/lib/compliance/policy-drift";
import { getComplianceControl } from "@/lib/compliance/catalog";
import type { ComplianceFramework } from "@/lib/compliance/types";
import { listOrgMembers, type OrgMemberRow } from "@/lib/org/data";
import { memberDisplayLabel } from "@/lib/compliance/control-ownership-matrix";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const COMPLIANCE_EXCEPTION_REGISTER_VERSION = "smohix-compliance-exception-register/1";

export type ExceptionEntryType = "control_gap" | "policy_drift" | "compensating";
export type ExceptionEntryStatus = "open" | "approved" | "expired" | "remediated";
export type ExceptionSeverity = "high" | "medium" | "low";

const FRAMEWORK_CONSOLE_PATHS: Record<ComplianceFramework, string> = {
  soc2: "/governance/compliance/type-ii",
  iso27001: "/governance/compliance/iso-assessment",
  pcidss: "/governance/compliance/pci-dss",
  hipaa: "/governance/compliance/hipaa",
  nist_csf: "/governance/compliance/nist-csf",
  cis_v8: "/governance/compliance/cis-v8",
  cmmc_l2: "/governance/compliance/cmmc-l2",
  gdpr_art32: "/governance/compliance/gdpr-art32",
};

export type ComplianceExceptionEntry = {
  id: string;
  type: ExceptionEntryType;
  framework: ComplianceFramework;
  frameworkLabel: string;
  controlId: string;
  controlRef: string;
  title: string;
  reason: string;
  severity: ExceptionSeverity;
  status: ExceptionEntryStatus;
  expiresAt: string;
  isExpired: boolean;
  daysUntilExpiry: number | null;
  approverLabel: string | null;
  approverUserId: string | null;
  approvedAt: string | null;
  sourceDetail: string;
  href: string;
  playbookId: string | null;
  remediationId: string | null;
  gapKey: string | null;
};

export type FrameworkExceptionSummary = {
  framework: ComplianceFramework;
  label: string;
  total: number;
  open: number;
  approved: number;
  expired: number;
};

export type ComplianceExceptionRegisterPack = {
  version: typeof COMPLIANCE_EXCEPTION_REGISTER_VERSION;
  generatedAt: string;
  periodDays: number;
  orgId: string | null;
  totalCount: number;
  openCount: number;
  approvedCount: number;
  expiredCount: number;
  remediatedCount: number;
  expiringWithin14Days: number;
  policyExceptionCount: number;
  controlExceptionCount: number;
  rows: ComplianceExceptionEntry[];
  frameworkSummaries: FrameworkExceptionSummary[];
};

type RemediationRow = {
  id: string;
  gapKey: string;
  framework: ProgramGapRow["framework"];
  controlRef: string;
  title: string;
  reason: string;
  status: "open" | "in_progress" | "resolved" | "dismissed";
  updatedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdBy: string;
};

export function severityFromAssessmentReason(reason: string): ExceptionSeverity {
  const r = reason.toLowerCase();
  if (r.includes("no audit") || r.includes("no audit or policy")) return "high";
  if (r.includes("regressed")) return "medium";
  if (r.includes("partial")) return "medium";
  return "low";
}

export function severityFromPolicyDrift(severity: PolicyDriftSeverity): ExceptionSeverity {
  return severity;
}

export function defaultExceptionExpiryIso(daysFromNow: number, from = new Date()): string {
  return new Date(from.getTime() + daysFromNow * 86_400_000).toISOString();
}

export function daysUntil(iso: string, now = new Date()): number {
  return Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000);
}

export function resolveExceptionStatus(
  baseStatus: ExceptionEntryStatus,
  expiresAt: string,
  now = new Date(),
): ExceptionEntryStatus {
  if (baseStatus === "open" && new Date(expiresAt).getTime() < now.getTime()) {
    return "expired";
  }
  return baseStatus;
}

export function exceptionIdForAssessment(
  framework: ComplianceFramework,
  controlRef: string,
  reason: string,
): string {
  const digest = createHash("sha256").update(reason).digest("hex").slice(0, 10);
  return `assessment:${framework}:${controlRef}:${digest}`;
}

export function exceptionIdForPolicy(findingId: string): string {
  return `policy:${findingId}`;
}

export function memberLabelById(
  userId: string | null,
  members: OrgMemberRow[],
): { label: string | null; userId: string | null } {
  if (!userId) return { label: null, userId: null };
  const m = members.find((row) => row.userId === userId);
  if (!m) return { label: "Member", userId };
  return { label: memberDisplayLabel(m), userId };
}

export function buildAssessmentExceptionEntry(input: {
  framework: ComplianceFramework;
  controlRef: string;
  title: string;
  reason: string;
  periodDays: number;
  approverUserId: string | null;
  approverLabel: string | null;
  generatedAt: string;
}): ComplianceExceptionEntry {
  const controlId = catalogIdForFrameworkRef(input.framework, input.controlRef) ?? `${input.framework}:${input.controlRef}`;
  const expiresAt = defaultExceptionExpiryIso(Math.max(input.periodDays, 90), new Date(input.generatedAt));
  const status = resolveExceptionStatus("open", expiresAt);
  const daysUntilExpiry = daysUntil(expiresAt);

  return {
    id: exceptionIdForAssessment(input.framework, input.controlRef, input.reason),
    type: "control_gap",
    framework: input.framework,
    frameworkLabel: frameworkLabel(input.framework),
    controlId,
    controlRef: input.controlRef,
    title: input.title,
    reason: input.reason,
    severity: severityFromAssessmentReason(input.reason),
    status,
    expiresAt,
    isExpired: status === "expired",
    daysUntilExpiry: status === "expired" ? daysUntilExpiry : daysUntilExpiry,
    approverLabel: input.approverLabel,
    approverUserId: input.approverUserId,
    approvedAt: null,
    sourceDetail: "Continuous assessment monitoring window",
    href: FRAMEWORK_CONSOLE_PATHS[input.framework],
    playbookId: null,
    remediationId: null,
    gapKey: gapKeyFor({
      framework: input.framework,
      controlRef: input.controlRef,
      reason: input.reason,
    }),
  };
}

export function buildPolicyExceptionEntry(
  finding: PolicyDriftFinding,
  generatedAt: string,
): ComplianceExceptionEntry | null {
  const primaryControlId = finding.controlIds[0];
  const control = primaryControlId ? getComplianceControl(primaryControlId) : null;
  if (!control) return null;

  const resolvedFramework = control.framework;
  const controlRef = control.ref;
  const controlId = control.id;
  const expiresAt = defaultExceptionExpiryIso(
    60,
    finding.acceptedAt ? new Date(finding.acceptedAt) : new Date(generatedAt),
  );
  const status = resolveExceptionStatus("open", expiresAt);

  return {
    id: exceptionIdForPolicy(finding.id),
    type: "policy_drift",
    framework: resolvedFramework,
    frameworkLabel: frameworkLabel(resolvedFramework),
    controlId,
    controlRef,
    title: finding.title,
    reason: finding.detail,
    severity: severityFromPolicyDrift(finding.severity),
    status,
    expiresAt,
    isExpired: status === "expired",
    daysUntilExpiry: daysUntil(expiresAt),
    approverLabel: null,
    approverUserId: null,
    approvedAt: null,
    sourceDetail: `Policy drift · ${finding.kind} · playbook ${finding.playbookId}`,
    href: finding.href,
    playbookId: finding.playbookId,
    remediationId: null,
    gapKey: null,
  };
}

export function buildRemediationExceptionEntry(
  row: RemediationRow,
  members: OrgMemberRow[],
): ComplianceExceptionEntry {
  const gap: ProgramGapRow = {
    framework: row.framework,
    controlRef: row.controlRef,
    title: row.title,
    reason: row.reason,
  };
  const controlId = catalogIdForFrameworkRef(row.framework, row.controlRef) ?? `${row.framework}:${row.controlRef}`;
  const approver = memberLabelById(row.resolvedBy ?? row.createdBy, members);

  let baseStatus: ExceptionEntryStatus = "open";
  if (row.status === "dismissed") baseStatus = "approved";
  if (row.status === "resolved") baseStatus = "remediated";

  const expiresAt =
    row.status === "dismissed"
      ? defaultExceptionExpiryIso(180, new Date(row.updatedAt))
      : defaultExceptionExpiryIso(90, new Date(row.updatedAt));

  const status = resolveExceptionStatus(baseStatus, expiresAt);
  const approvedAt = row.status === "dismissed" || row.status === "resolved" ? row.resolvedAt ?? row.updatedAt : null;

  return {
    id: `remediation:${row.id}`,
    type: "compensating",
    framework: row.framework,
    frameworkLabel: frameworkLabel(row.framework),
    controlId,
    controlRef: row.controlRef,
    title: row.title,
    reason: row.reason,
    severity: severityFromAssessmentReason(row.reason),
    status,
    expiresAt,
    isExpired: status === "expired",
    daysUntilExpiry: daysUntil(expiresAt),
    approverLabel: approver.label,
    approverUserId: approver.userId,
    approvedAt,
    sourceDetail: `Gap remediation · ${row.status}`,
    href: "/governance/compliance/runbooks",
    playbookId: null,
    remediationId: row.id,
    gapKey: row.gapKey,
  };
}

export function mergeExceptionRows(
  assessmentRows: ComplianceExceptionEntry[],
  policyRows: ComplianceExceptionEntry[],
  remediationRows: ComplianceExceptionEntry[],
): ComplianceExceptionEntry[] {
  const byGapKey = new Map<string, ComplianceExceptionEntry>();
  const byId = new Map<string, ComplianceExceptionEntry>();

  for (const row of assessmentRows) {
    byId.set(row.id, row);
    if (row.gapKey) byGapKey.set(row.gapKey, row);
  }

  for (const row of policyRows) {
    byId.set(row.id, row);
  }

  for (const rem of remediationRows) {
    if (rem.gapKey && byGapKey.has(rem.gapKey)) {
      const base = byGapKey.get(rem.gapKey)!;
      const merged: ComplianceExceptionEntry = {
        ...base,
        ...rem,
        id: rem.id,
        type: rem.type,
        status: rem.status,
        approverLabel: rem.approverLabel ?? base.approverLabel,
        approverUserId: rem.approverUserId ?? base.approverUserId,
        approvedAt: rem.approvedAt,
        remediationId: rem.remediationId,
        sourceDetail: `${base.sourceDetail} · ${rem.sourceDetail}`,
        href: rem.href,
      };
      byId.delete(base.id);
      byId.set(merged.id, merged);
      byGapKey.set(rem.gapKey, merged);
    } else {
      byId.set(rem.id, rem);
      if (rem.gapKey) byGapKey.set(rem.gapKey, rem);
    }
  }

  return [...byId.values()].sort((a, b) => {
    const statusRank = (s: ExceptionEntryStatus) => {
      if (s === "open") return 0;
      if (s === "expired") return 1;
      if (s === "approved") return 2;
      return 3;
    };
    const sevRank = (s: ExceptionSeverity) => (s === "high" ? 0 : s === "medium" ? 1 : 2);
    return (
      statusRank(a.status) - statusRank(b.status) ||
      sevRank(a.severity) - sevRank(b.severity) ||
      a.frameworkLabel.localeCompare(b.frameworkLabel) ||
      a.controlRef.localeCompare(b.controlRef)
    );
  });
}

export function summarizeFrameworkExceptions(
  rows: ComplianceExceptionEntry[],
): FrameworkExceptionSummary[] {
  const map = new Map<ComplianceFramework, FrameworkExceptionSummary>();

  for (const row of rows) {
    const existing = map.get(row.framework) ?? {
      framework: row.framework,
      label: row.frameworkLabel,
      total: 0,
      open: 0,
      approved: 0,
      expired: 0,
    };
    existing.total += 1;
    if (row.status === "open") existing.open += 1;
    if (row.status === "approved") existing.approved += 1;
    if (row.status === "expired") existing.expired += 1;
    map.set(row.framework, existing);
  }

  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function buildComplianceExceptionRegisterPackFromParts(input: {
  orgId: string | null;
  periodDays: number;
  rows: ComplianceExceptionEntry[];
  generatedAt?: string;
}): ComplianceExceptionRegisterPack {
  const rows = input.rows;
  const openCount = rows.filter((r) => r.status === "open").length;
  const approvedCount = rows.filter((r) => r.status === "approved").length;
  const expiredCount = rows.filter((r) => r.status === "expired").length;
  const remediatedCount = rows.filter((r) => r.status === "remediated").length;
  const expiringWithin14Days = rows.filter(
    (r) =>
      r.status === "open" &&
      r.daysUntilExpiry !== null &&
      r.daysUntilExpiry >= 0 &&
      r.daysUntilExpiry <= 14,
  ).length;

  return {
    version: COMPLIANCE_EXCEPTION_REGISTER_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    periodDays: input.periodDays,
    orgId: input.orgId,
    totalCount: rows.length,
    openCount,
    approvedCount,
    expiredCount,
    remediatedCount,
    expiringWithin14Days,
    policyExceptionCount: rows.filter((r) => r.type === "policy_drift").length,
    controlExceptionCount: rows.filter((r) => r.type === "control_gap").length,
    rows,
    frameworkSummaries: summarizeFrameworkExceptions(rows),
  };
}

async function listRemediationRowsForRegister(
  orgId: string,
  supabase: SupabaseClient,
): Promise<RemediationRow[]> {
  const { data, error } = await supabase
    .from("compliance_gap_remediations")
    .select(
      "id, gap_key, framework, control_ref, title, reason, status, updated_at, resolved_at, resolved_by, created_by",
    )
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: String(row.id),
    gapKey: String(row.gap_key),
    framework: row.framework as ProgramGapRow["framework"],
    controlRef: String(row.control_ref),
    title: String(row.title),
    reason: String(row.reason),
    status: row.status as RemediationRow["status"],
    updatedAt: String(row.updated_at),
    resolvedAt: row.resolved_at ? String(row.resolved_at) : null,
    resolvedBy: row.resolved_by ? String(row.resolved_by) : null,
    createdBy: String(row.created_by),
  }));
}

export async function buildComplianceExceptionRegisterPack(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<ComplianceExceptionRegisterPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const periodDays = opts.periodDays ?? 30;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const generatedAt = new Date().toISOString();

  const [reports, policyPack, attestations, remediations, members] = await Promise.all([
    Promise.all(
      BASELINE_COMPARISON_FRAMEWORKS.map((framework) =>
        buildContinuousAssessmentReport(userId, {
          framework,
          orgId: opts.orgId!,
          periodDays,
          supabase,
        }),
      ),
    ),
    buildPolicyDriftPack(userId, { orgId: opts.orgId, periodDays, supabase }),
    listControlAttestationBoard(userId, opts.orgId, supabase),
    listRemediationRowsForRegister(opts.orgId, supabase),
    listOrgMembers(opts.orgId, { supabase }),
  ]);

  const ownerByControlId = new Map(
    attestations.map((a) => [a.controlId, { userId: a.ownerUserId, label: a.ownerLabel }]),
  );

  const assessmentRows: ComplianceExceptionEntry[] = [];
  for (const report of reports) {
    if (!report) continue;
    for (const ex of report.exceptions) {
      const controlId = catalogIdForFrameworkRef(report.framework, ex.controlRef);
      const owner = controlId ? ownerByControlId.get(controlId) : undefined;
      assessmentRows.push(
        buildAssessmentExceptionEntry({
          framework: report.framework,
          controlRef: ex.controlRef,
          title: ex.title,
          reason: ex.reason,
          periodDays,
          approverUserId: owner?.userId ?? null,
          approverLabel: owner?.label ?? null,
          generatedAt,
        }),
      );
    }
  }

  const policyRows: ComplianceExceptionEntry[] = [];
  if (policyPack) {
    for (const finding of policyPack.findings) {
      const entry = buildPolicyExceptionEntry(finding, generatedAt);
      if (entry) policyRows.push(entry);
    }
  }

  const remediationRows = remediations.map((r) => buildRemediationExceptionEntry(r, members));
  const rows = mergeExceptionRows(assessmentRows, policyRows, remediationRows);

  return buildComplianceExceptionRegisterPackFromParts({
    orgId: opts.orgId,
    periodDays,
    rows,
    generatedAt,
  });
}

export function complianceExceptionRegisterToCsv(pack: ComplianceExceptionRegisterPack): string {
  const header =
    "id,type,framework,control_ref,title,severity,status,expires_at,approver,approved_at,reason,source";
  const lines = pack.rows.map((r) =>
    [
      r.id,
      r.type,
      r.framework,
      r.controlRef,
      JSON.stringify(r.title),
      r.severity,
      r.status,
      r.expiresAt.slice(0, 10),
      JSON.stringify(r.approverLabel ?? ""),
      r.approvedAt?.slice(0, 10) ?? "",
      JSON.stringify(r.reason),
      JSON.stringify(r.sourceDetail),
    ].join(","),
  );
  return `${header}\n${lines.join("\n")}\n`;
}
