import type { SupabaseClient } from "@supabase/supabase-js";

import { listControlAttestationBoard } from "@/lib/compliance/attestation/data";
import type { ControlAttestationRow } from "@/lib/compliance/attestation/types";
import type { AttestationWorkflowStatus } from "@/lib/compliance/attestation/status";
import { getComplianceControl } from "@/lib/compliance/catalog";
import type { ComplianceFramework } from "@/lib/compliance/types";
import {
  buildScopeBoundaryMapperPack,
  type ScopeBoundarySystem,
  type ScopeDataFlow,
} from "@/lib/compliance/scope-boundary-mapper";
import { listOrgMembers, type OrgMemberRow } from "@/lib/org/data";
import { POLICY_REVIEWER_ROLES, roleLabel } from "@/lib/org/roles";
import type { ServiceRow } from "@/lib/services/data";
import { listServicesForUser } from "@/lib/services/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const CONTROL_OWNERSHIP_MATRIX_VERSION = "zentro-control-ownership-matrix/1";

const FRAMEWORK_LABELS: Record<ComplianceFramework, string> = {
  soc2: "SOC 2",
  iso27001: "ISO 27001",
  pcidss: "PCI DSS",
  hipaa: "HIPAA",
  nist_csf: "NIST CSF",
  cis_v8: "CIS v8",
  cmmc_l2: "CMMC L2",
  gdpr_art32: "GDPR Art. 32",
};

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

export type LinkedScopeSystem = {
  id: string;
  name: string;
  kind: ScopeBoundarySystem["kind"];
  href: string;
  inScope: boolean;
};

export type ControlOwnershipRow = {
  controlId: string;
  framework: ComplianceFramework;
  frameworkLabel: string;
  ref: string;
  title: string;
  domain: string;
  accountable: string | null;
  accountableUserId: string | null;
  responsible: string[];
  consulted: string[];
  informed: string[];
  linkedSystems: LinkedScopeSystem[];
  attestationStatus: AttestationWorkflowStatus;
  attestationDueAt: string;
  gaps: string[];
  completenessPercent: number;
  frameworkConsolePath: string;
  attestationHref: string;
};

export type FrameworkOwnershipSummary = {
  framework: ComplianceFramework;
  label: string;
  controlCount: number;
  accountableAssigned: number;
  scopeLinked: number;
  attested: number;
};

export type ControlOwnershipMatrixPack = {
  version: typeof CONTROL_OWNERSHIP_MATRIX_VERSION;
  generatedAt: string;
  orgId: string | null;
  totalControls: number;
  accountableAssignedCount: number;
  unassignedAccountableCount: number;
  scopeLinkedCount: number;
  attestedCount: number;
  avgCompletenessPercent: number;
  rows: ControlOwnershipRow[];
  frameworkSummaries: FrameworkOwnershipSummary[];
};

export function memberDisplayLabel(member: OrgMemberRow): string {
  return member.displayName ?? member.email ?? `User ${member.userId.slice(0, 8)}`;
}

export function buildControlToScopeIndex(
  systems: ScopeBoundarySystem[],
  dataFlows: ScopeDataFlow[],
): Map<string, LinkedScopeSystem[]> {
  const index = new Map<string, LinkedScopeSystem[]>();

  const push = (controlId: string, system: ScopeBoundarySystem) => {
    if (!getComplianceControl(controlId)) return;
    const list = index.get(controlId) ?? [];
    if (list.some((s) => s.id === system.id)) return;
    list.push({
      id: system.id,
      name: system.name,
      kind: system.kind,
      href: system.href,
      inScope: system.inScope,
    });
    index.set(controlId, list);
  };

  for (const sys of systems) {
    for (const controlId of sys.controlIds) {
      push(controlId, sys);
    }
  }

  for (const flow of dataFlows) {
    for (const controlId of flow.controlIds) {
      const from = systems.find((s) => s.id === flow.fromSystemId);
      const to = systems.find((s) => s.id === flow.toSystemId);
      if (from) push(controlId, from);
      if (to) push(controlId, to);
    }
  }

  return index;
}

export function buildConsultedLabels(members: OrgMemberRow[]): string[] {
  return members
    .filter((m) => POLICY_REVIEWER_ROLES.includes(m.role))
    .map((m) => `${memberDisplayLabel(m)} (${roleLabel(m.role)})`)
    .slice(0, 5);
}

export function buildInformedLabels(members: OrgMemberRow[]): string[] {
  return members
    .filter((m) => m.role === "auditor" || m.role === "viewer" || m.role === "operator")
    .map((m) => `${memberDisplayLabel(m)} (${roleLabel(m.role)})`)
    .slice(0, 5);
}

export function buildResponsibleLabels(
  linkedSystems: LinkedScopeSystem[],
  servicesById: Map<string, ServiceRow>,
): string[] {
  const labels: string[] = [];
  const seen = new Set<string>();

  for (const sys of linkedSystems.filter((s) => s.inScope)) {
    if (sys.kind === "service" && sys.id.startsWith("service-")) {
      const serviceId = sys.id.replace(/^service-/, "");
      const svc = servicesById.get(serviceId);
      const owner = svc?.ownerHint?.trim();
      const label = owner ? `${sys.name} — ${owner}` : sys.name;
      if (!seen.has(label)) {
        seen.add(label);
        labels.push(label);
      }
      continue;
    }
    if (!seen.has(sys.name)) {
      seen.add(sys.name);
      labels.push(sys.name);
    }
  }

  return labels.slice(0, 6);
}

export function computeOwnershipCompleteness(input: {
  accountableUserId: string | null;
  responsibleCount: number;
  attestationStatus: AttestationWorkflowStatus;
  consultedCount: number;
}): number {
  let score = 0;
  if (input.accountableUserId) score += 40;
  if (input.responsibleCount > 0) score += 35;
  if (input.attestationStatus === "attested") score += 15;
  if (input.consultedCount > 0) score += 10;
  return Math.min(100, score);
}

export function buildOwnershipGaps(input: {
  accountableUserId: string | null;
  responsibleCount: number;
  attestationStatus: AttestationWorkflowStatus;
}): string[] {
  const gaps: string[] = [];
  if (!input.accountableUserId) gaps.push("Assign accountable owner on attestation board");
  if (input.responsibleCount === 0) gaps.push("Link control to in-scope service, vendor, or data flow");
  if (input.attestationStatus === "overdue") gaps.push("Overdue attestation — sign or reassign");
  else if (input.attestationStatus === "pending") gaps.push("Pending attestation sign-off");
  return gaps;
}

export function buildControlOwnershipRow(
  attestation: ControlAttestationRow,
  linkedSystems: LinkedScopeSystem[],
  servicesById: Map<string, ServiceRow>,
  members: OrgMemberRow[],
): ControlOwnershipRow {
  const responsible = buildResponsibleLabels(linkedSystems, servicesById);
  const consulted = buildConsultedLabels(members);
  const informed = buildInformedLabels(members);
  const inScopeLinked = linkedSystems.filter((s) => s.inScope);

  const completenessPercent = computeOwnershipCompleteness({
    accountableUserId: attestation.ownerUserId,
    responsibleCount: responsible.length,
    attestationStatus: attestation.status,
    consultedCount: consulted.length,
  });

  const gaps = buildOwnershipGaps({
    accountableUserId: attestation.ownerUserId,
    responsibleCount: responsible.length,
    attestationStatus: attestation.status,
  });

  return {
    controlId: attestation.controlId,
    framework: attestation.control.framework,
    frameworkLabel: FRAMEWORK_LABELS[attestation.control.framework],
    ref: attestation.control.ref,
    title: attestation.control.title,
    domain: attestation.control.domain,
    accountable: attestation.ownerLabel,
    accountableUserId: attestation.ownerUserId,
    responsible,
    consulted,
    informed,
    linkedSystems: linkedSystems.slice(0, 8),
    attestationStatus: attestation.status,
    attestationDueAt: attestation.dueAt,
    gaps,
    completenessPercent,
    frameworkConsolePath: FRAMEWORK_CONSOLE_PATHS[attestation.control.framework],
    attestationHref: "/governance/compliance/attestations",
  };
}

export function summarizeFrameworkOwnership(rows: ControlOwnershipRow[]): FrameworkOwnershipSummary[] {
  const byFw = new Map<ComplianceFramework, FrameworkOwnershipSummary>();

  for (const row of rows) {
    const existing = byFw.get(row.framework) ?? {
      framework: row.framework,
      label: row.frameworkLabel,
      controlCount: 0,
      accountableAssigned: 0,
      scopeLinked: 0,
      attested: 0,
    };
    existing.controlCount += 1;
    if (row.accountableUserId) existing.accountableAssigned += 1;
    if (row.linkedSystems.some((s) => s.inScope)) existing.scopeLinked += 1;
    if (row.attestationStatus === "attested") existing.attested += 1;
    byFw.set(row.framework, existing);
  }

  return [...byFw.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function buildControlOwnershipMatrixPackFromParts(input: {
  orgId: string | null;
  rows: ControlOwnershipRow[];
  generatedAt?: string;
}): ControlOwnershipMatrixPack {
  const rows = [...input.rows].sort((a, b) => {
    if (a.framework !== b.framework) return a.frameworkLabel.localeCompare(b.frameworkLabel);
    return a.ref.localeCompare(b.ref);
  });

  const accountableAssignedCount = rows.filter((r) => r.accountableUserId).length;
  const scopeLinkedCount = rows.filter((r) => r.linkedSystems.some((s) => s.inScope)).length;
  const attestedCount = rows.filter((r) => r.attestationStatus === "attested").length;
  const avgCompletenessPercent =
    rows.length === 0
      ? 0
      : Math.round(rows.reduce((sum, r) => sum + r.completenessPercent, 0) / rows.length);

  return {
    version: CONTROL_OWNERSHIP_MATRIX_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    orgId: input.orgId,
    totalControls: rows.length,
    accountableAssignedCount,
    unassignedAccountableCount: rows.length - accountableAssignedCount,
    scopeLinkedCount,
    attestedCount,
    avgCompletenessPercent,
    rows,
    frameworkSummaries: summarizeFrameworkOwnership(rows),
  };
}

export async function buildControlOwnershipMatrixPack(
  userId: string,
  opts: {
    orgId: string | null;
    supabase?: SupabaseClient;
  },
): Promise<ControlOwnershipMatrixPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const [attestations, scopePack, members, services] = await Promise.all([
    listControlAttestationBoard(userId, opts.orgId, supabase),
    buildScopeBoundaryMapperPack(userId, { orgId: opts.orgId, supabase }),
    listOrgMembers(opts.orgId, { supabase }),
    listServicesForUser(userId, opts.orgId),
  ]);

  if (!scopePack) return null;

  const scopeIndex = buildControlToScopeIndex(scopePack.systems, scopePack.dataFlows);
  const servicesById = new Map(services.map((s) => [s.id, s]));

  const rows = attestations.map((a) =>
    buildControlOwnershipRow(a, scopeIndex.get(a.controlId) ?? [], servicesById, members),
  );

  return buildControlOwnershipMatrixPackFromParts({
    orgId: opts.orgId,
    rows,
  });
}

export function controlOwnershipMatrixToCsv(pack: ControlOwnershipMatrixPack): string {
  const header =
    "control_id,framework,ref,title,accountable,responsible,consulted,informed,linked_systems,attestation_status,completeness_percent,gaps";
  const lines = pack.rows.map((r) =>
    [
      r.controlId,
      r.framework,
      r.ref,
      JSON.stringify(r.title),
      JSON.stringify(r.accountable ?? ""),
      r.responsible.map((x) => JSON.stringify(x)).join(";"),
      r.consulted.map((x) => JSON.stringify(x)).join(";"),
      r.informed.map((x) => JSON.stringify(x)).join(";"),
      r.linkedSystems.map((s) => s.name).join(";"),
      r.attestationStatus,
      r.completenessPercent,
      JSON.stringify(r.gaps.join(" · ")),
    ].join(","),
  );
  return `${header}\n${lines.join("\n")}\n`;
}
