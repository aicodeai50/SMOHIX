import type { SupabaseClient } from "@supabase/supabase-js";

import { appendAuditEvent } from "@/lib/audit/append";
import { auditEvidenceDeepLink } from "@/lib/compliance/attestation/evidence";
import { COMPLIANCE_CONTROLS, getComplianceControl } from "@/lib/compliance/catalog";
import { frameworkLabel } from "@/lib/compliance/gap-remediation";
import type { ComplianceFramework } from "@/lib/compliance/types";
import { memberDisplayLabel } from "@/lib/compliance/control-ownership-matrix";
import { listOrgMembers, type OrgMemberRow } from "@/lib/org/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const ASSESSOR_EVIDENCE_REQUESTS_VERSION = "smohix-assessor-evidence-requests/1";

export const EVIDENCE_DOCUMENT_TYPES = [
  "control_evidence",
  "policy_document",
  "audit_export",
  "architecture",
  "other",
] as const;

export type EvidenceDocumentType = (typeof EVIDENCE_DOCUMENT_TYPES)[number];

export type EvidenceRequestStoredStatus = "open" | "fulfilled" | "cancelled";

export type EvidenceRequestWorkflowStatus = EvidenceRequestStoredStatus | "overdue";

export type AssessorEvidenceRequestRow = {
  id: string;
  orgId: string;
  controlId: string;
  controlRef: string;
  controlTitle: string;
  framework: ComplianceFramework;
  frameworkLabel: string;
  title: string;
  description: string | null;
  documentType: EvidenceDocumentType;
  storedStatus: EvidenceRequestStoredStatus;
  status: EvidenceRequestWorkflowStatus;
  requestedByUserId: string;
  requestedByLabel: string;
  assignedToUserId: string | null;
  assignedToLabel: string | null;
  dueAt: string;
  fulfilledAt: string | null;
  fulfilledByLabel: string | null;
  fulfillmentNote: string | null;
  auditEvidenceHref: string;
  createdAt: string;
  updatedAt: string;
};

export type AssessorEvidenceRequestPack = {
  version: typeof ASSESSOR_EVIDENCE_REQUESTS_VERSION;
  generatedAt: string;
  orgId: string | null;
  totalCount: number;
  openCount: number;
  overdueCount: number;
  fulfilledCount: number;
  cancelledCount: number;
  requests: AssessorEvidenceRequestRow[];
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

const DOCUMENT_TYPE_LABELS: Record<EvidenceDocumentType, string> = {
  control_evidence: "Control evidence",
  policy_document: "Policy document",
  audit_export: "Audit log export",
  architecture: "Architecture / diagram",
  other: "Other",
};

type DbRequest = {
  id: string;
  org_id: string;
  control_id: string;
  title: string;
  description: string | null;
  document_type: string;
  status: string;
  requested_by: string;
  assigned_to: string | null;
  due_at: string;
  fulfilled_at: string | null;
  fulfilled_by: string | null;
  fulfillment_note: string | null;
  created_at: string;
  updated_at: string;
};

export function documentTypeLabel(type: EvidenceDocumentType): string {
  return DOCUMENT_TYPE_LABELS[type];
}

export function isEvidenceDocumentType(value: string): value is EvidenceDocumentType {
  return (EVIDENCE_DOCUMENT_TYPES as readonly string[]).includes(value);
}

export function defaultEvidenceRequestDueAt(daysFromNow = 14): string {
  return new Date(Date.now() + daysFromNow * 86_400_000).toISOString();
}

export function computeEvidenceRequestStatus(input: {
  storedStatus: EvidenceRequestStoredStatus;
  dueAtIso: string;
  now?: Date;
}): EvidenceRequestWorkflowStatus {
  if (input.storedStatus !== "open") return input.storedStatus;
  const due = new Date(input.dueAtIso).getTime();
  const now = (input.now ?? new Date()).getTime();
  if (now > due) return "overdue";
  return "open";
}

function memberLabel(
  userId: string | null,
  members: OrgMemberRow[],
): string | null {
  if (!userId) return null;
  const m = members.find((row) => row.userId === userId);
  return m ? memberDisplayLabel(m) : "Member";
}

export function mapDbRequestToRow(raw: DbRequest, members: OrgMemberRow[]): AssessorEvidenceRequestRow | null {
  const control = getComplianceControl(raw.control_id);
  if (!control) return null;

  const storedStatus = raw.status as EvidenceRequestStoredStatus;
  const status = computeEvidenceRequestStatus({
    storedStatus,
    dueAtIso: raw.due_at,
  });

  return {
    id: raw.id,
    orgId: raw.org_id,
    controlId: raw.control_id,
    controlRef: control.ref,
    controlTitle: control.title,
    framework: control.framework,
    frameworkLabel: frameworkLabel(control.framework),
    title: raw.title,
    description: raw.description,
    documentType: raw.document_type as EvidenceDocumentType,
    storedStatus,
    status,
    requestedByUserId: raw.requested_by,
    requestedByLabel: memberLabel(raw.requested_by, members) ?? "Assessor",
    assignedToUserId: raw.assigned_to,
    assignedToLabel: memberLabel(raw.assigned_to, members),
    dueAt: raw.due_at,
    fulfilledAt: raw.fulfilled_at,
    fulfilledByLabel: memberLabel(raw.fulfilled_by, members),
    fulfillmentNote: raw.fulfillment_note,
    auditEvidenceHref: auditEvidenceDeepLink(raw.control_id),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export function buildAssessorEvidenceRequestPackFromRows(input: {
  orgId: string | null;
  rows: AssessorEvidenceRequestRow[];
  generatedAt?: string;
}): AssessorEvidenceRequestPack {
  const requests = [...input.rows].sort((a, b) => {
    const rank = (s: EvidenceRequestWorkflowStatus) => {
      if (s === "overdue") return 0;
      if (s === "open") return 1;
      if (s === "fulfilled") return 2;
      return 3;
    };
    return (
      rank(a.status) - rank(b.status) ||
      new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
    );
  });

  return {
    version: ASSESSOR_EVIDENCE_REQUESTS_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    orgId: input.orgId,
    totalCount: requests.length,
    openCount: requests.filter((r) => r.status === "open").length,
    overdueCount: requests.filter((r) => r.status === "overdue").length,
    fulfilledCount: requests.filter((r) => r.status === "fulfilled").length,
    cancelledCount: requests.filter((r) => r.status === "cancelled").length,
    requests,
  };
}

export async function listAssessorEvidenceRequests(
  orgId: string,
  supabase?: SupabaseClient,
): Promise<AssessorEvidenceRequestRow[]> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data, error } = await client
    .from("compliance_assessor_evidence_requests")
    .select(
      "id, org_id, control_id, title, description, document_type, status, requested_by, assigned_to, due_at, fulfilled_at, fulfilled_by, fulfillment_note, created_at, updated_at",
    )
    .eq("org_id", orgId)
    .order("due_at", { ascending: true });

  if (error || !data) return [];

  const members = await listOrgMembers(orgId, { supabase: client });
  const rows: AssessorEvidenceRequestRow[] = [];
  for (const raw of data as DbRequest[]) {
    const row = mapDbRequestToRow(raw, members);
    if (row) rows.push(row);
  }
  return rows;
}

export async function buildAssessorEvidenceRequestPack(
  userId: string,
  opts: { orgId: string | null; supabase?: SupabaseClient },
): Promise<AssessorEvidenceRequestPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const rows = await listAssessorEvidenceRequests(opts.orgId, supabase);
  return buildAssessorEvidenceRequestPackFromRows({ orgId: opts.orgId, rows });
}

export async function createAssessorEvidenceRequest(
  userId: string,
  orgId: string,
  input: {
    controlId: string;
    title: string;
    description?: string;
    documentType: EvidenceDocumentType;
    assignedToUserId?: string | null;
    dueAtIso?: string;
  },
  supabase?: SupabaseClient,
): Promise<{ ok: true; id: string } | { ok: false; reason: string }> {
  const control = getComplianceControl(input.controlId);
  if (!control) return { ok: false, reason: "invalid_control" };

  const title = input.title.trim();
  if (!title) return { ok: false, reason: "title_required" };

  const client = supabase ?? (await createServerSupabaseClient());
  const dueAt = input.dueAtIso ?? defaultEvidenceRequestDueAt(14);

  const { data, error } = await client
    .from("compliance_assessor_evidence_requests")
    .insert({
      org_id: orgId,
      control_id: input.controlId,
      title,
      description: input.description?.trim() || null,
      document_type: input.documentType,
      status: "open",
      requested_by: userId,
      assigned_to: input.assignedToUserId ?? null,
      due_at: dueAt,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, reason: "insert_failed" };

  await appendAuditEvent({
    event_type: "governance.assessor_evidence_request_created",
    user_id: userId,
    org_id: orgId,
    details: {
      request_id: data.id,
      control_id: input.controlId,
      document_type: input.documentType,
      due_at: dueAt,
    },
  });

  return { ok: true, id: String(data.id) };
}

export async function fulfillAssessorEvidenceRequest(
  userId: string,
  orgId: string,
  input: { requestId: string; note?: string },
  supabase?: SupabaseClient,
): Promise<boolean> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data, error } = await client
    .from("compliance_assessor_evidence_requests")
    .update({
      status: "fulfilled",
      fulfilled_at: new Date().toISOString(),
      fulfilled_by: userId,
      fulfillment_note: input.note?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.requestId)
    .eq("org_id", orgId)
    .eq("status", "open")
    .select("id, control_id")
    .maybeSingle();

  if (error || !data) return false;

  await appendAuditEvent({
    event_type: "governance.assessor_evidence_request_fulfilled",
    user_id: userId,
    org_id: orgId,
    details: {
      request_id: input.requestId,
      control_id: data.control_id,
    },
  });

  return true;
}

export async function cancelAssessorEvidenceRequest(
  userId: string,
  orgId: string,
  requestId: string,
  supabase?: SupabaseClient,
): Promise<boolean> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data, error } = await client
    .from("compliance_assessor_evidence_requests")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("org_id", orgId)
    .eq("status", "open")
    .select("id, control_id, requested_by")
    .maybeSingle();

  if (error || !data) return false;

  await appendAuditEvent({
    event_type: "governance.assessor_evidence_request_cancelled",
    user_id: userId,
    org_id: orgId,
    details: {
      request_id: requestId,
      control_id: data.control_id,
    },
  });

  return true;
}

export function frameworkConsolePath(framework: ComplianceFramework): string {
  return FRAMEWORK_CONSOLE_PATHS[framework];
}

export function assessorEvidenceRequestsToCsv(pack: AssessorEvidenceRequestPack): string {
  const header =
    "id,framework,control_ref,control_title,title,document_type,status,due_at,requested_by,assigned_to,fulfilled_at,description";
  const lines = pack.requests.map((r) =>
    [
      r.id,
      r.framework,
      r.controlRef,
      JSON.stringify(r.controlTitle),
      JSON.stringify(r.title),
      r.documentType,
      r.status,
      r.dueAt.slice(0, 10),
      JSON.stringify(r.requestedByLabel),
      JSON.stringify(r.assignedToLabel ?? ""),
      r.fulfilledAt?.slice(0, 10) ?? "",
      JSON.stringify(r.description ?? ""),
    ].join(","),
  );
  return `${header}\n${lines.join("\n")}\n`;
}

export const EVIDENCE_REQUEST_CONTROL_OPTIONS = COMPLIANCE_CONTROLS.map((c) => ({
  id: c.id,
  label: `${c.framework === "iso27001" ? "ISO" : c.framework.toUpperCase()} ${c.ref} — ${c.title}`,
}));
