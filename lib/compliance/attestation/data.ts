import type { SupabaseClient } from "@supabase/supabase-js";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  auditEvidenceDeepLink,
  countLinkedAuditEvidence,
} from "@/lib/compliance/attestation/evidence";
import {
  computeAttestationStatus,
  defaultAttestationDueAt,
  isKnownControlId,
} from "@/lib/compliance/attestation/status";
import type {
  AttestationTrailEvent,
  ControlAttestationRow,
} from "@/lib/compliance/attestation/types";
import { COMPLIANCE_CONTROLS, getComplianceControl } from "@/lib/compliance/catalog";
import { listOrgMembers } from "@/lib/org/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const KNOWN_CONTROL_IDS = new Set(COMPLIANCE_CONTROLS.map((c) => c.id));

type DbAttestation = {
  id: string;
  org_id: string;
  control_id: string;
  owner_user_id: string | null;
  due_at: string;
  attested_at: string | null;
  attested_by: string | null;
  attestation_note: string | null;
};

async function appendAttestationEvent(
  supabase: SupabaseClient,
  input: {
    attestationId: string;
    orgId: string;
    actorUserId: string;
    eventType: AttestationTrailEvent["eventType"];
    details: Record<string, unknown>;
  },
): Promise<void> {
  await supabase.from("compliance_control_attestation_events").insert({
    attestation_id: input.attestationId,
    org_id: input.orgId,
    event_type: input.eventType,
    actor_user_id: input.actorUserId,
    details: input.details,
  });
}

export async function ensureAttestationsForOrg(
  orgId: string,
  actorUserId: string,
  supabase?: SupabaseClient,
): Promise<void> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data: existing } = await client
    .from("compliance_control_attestations")
    .select("control_id")
    .eq("org_id", orgId);

  const have = new Set((existing ?? []).map((r) => r.control_id as string));
  const missing = COMPLIANCE_CONTROLS.filter((c) => !have.has(c.id));
  if (missing.length === 0) return;

  const dueAt = defaultAttestationDueAt(90);
  await client.from("compliance_control_attestations").insert(
    missing.map((c) => ({
      org_id: orgId,
      control_id: c.id,
      due_at: dueAt,
      created_by: actorUserId,
    })),
  );
}

function ownerLabelFor(
  ownerUserId: string | null,
  members: Awaited<ReturnType<typeof listOrgMembers>>,
): string | null {
  if (!ownerUserId) return null;
  const m = members.find((row) => row.userId === ownerUserId);
  if (!m) return "Member";
  return m.displayName ?? m.email ?? "Member";
}

export async function listControlAttestationBoard(
  userId: string,
  orgId: string,
  supabase?: SupabaseClient,
): Promise<ControlAttestationRow[]> {
  const client = supabase ?? (await createServerSupabaseClient());
  await ensureAttestationsForOrg(orgId, userId, client);

  const { data, error } = await client
    .from("compliance_control_attestations")
    .select(
      "id, org_id, control_id, owner_user_id, due_at, attested_at, attested_by, attestation_note",
    )
    .eq("org_id", orgId)
    .order("due_at", { ascending: true });

  if (error || !data) return [];

  const members = await listOrgMembers(orgId);
  const rows: ControlAttestationRow[] = [];

  for (const raw of data as DbAttestation[]) {
    const control = getComplianceControl(raw.control_id);
    if (!control) continue;

    const linkedAuditEvidenceCount = await countLinkedAuditEvidence(userId, raw.control_id, {
      orgId,
    });

    rows.push({
      id: raw.id,
      orgId: raw.org_id,
      controlId: raw.control_id,
      control,
      ownerUserId: raw.owner_user_id,
      ownerLabel: ownerLabelFor(raw.owner_user_id, members),
      dueAt: raw.due_at,
      attestedAt: raw.attested_at,
      attestedBy: raw.attested_by,
      attestationNote: raw.attestation_note,
      status: computeAttestationStatus({
        dueAtIso: raw.due_at,
        attestedAtIso: raw.attested_at,
      }),
      linkedAuditEvidenceCount,
      auditEvidenceHref: auditEvidenceDeepLink(raw.control_id),
    });
  }

  return rows;
}

export async function listAttestationTrailsForOrg(
  orgId: string,
  supabase?: SupabaseClient,
): Promise<Map<string, AttestationTrailEvent[]>> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data, error } = await client
    .from("compliance_control_attestation_events")
    .select("id, attestation_id, event_type, actor_user_id, details, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(500);

  const map = new Map<string, AttestationTrailEvent[]>();
  if (error || !data) return map;

  for (const row of data) {
    const attestationId = row.attestation_id as string;
    const list = map.get(attestationId) ?? [];
    if (list.length >= 5) continue;
    list.push({
      id: row.id as string,
      eventType: row.event_type as AttestationTrailEvent["eventType"],
      actorUserId: row.actor_user_id as string,
      details: (row.details as Record<string, unknown>) ?? {},
      createdAt: row.created_at as string,
    });
    map.set(attestationId, list);
  }
  return map;
}

export async function listAttestationTrail(
  attestationId: string,
  supabase?: SupabaseClient,
): Promise<AttestationTrailEvent[]> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data, error } = await client
    .from("compliance_control_attestation_events")
    .select("id, event_type, actor_user_id, details, created_at")
    .eq("attestation_id", attestationId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    eventType: row.event_type as AttestationTrailEvent["eventType"],
    actorUserId: row.actor_user_id as string,
    details: (row.details as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  }));
}

export type AssignAttestationResult =
  | { ok: true }
  | { ok: false; reason: string };

export async function assignControlAttestation(
  userId: string,
  orgId: string,
  input: {
    attestationId: string;
    ownerUserId: string | null;
    dueAtIso: string;
  },
  supabase?: SupabaseClient,
): Promise<AssignAttestationResult> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data: row, error: fetchErr } = await client
    .from("compliance_control_attestations")
    .select("id, org_id, control_id, owner_user_id, due_at, attested_at")
    .eq("id", input.attestationId)
    .eq("org_id", orgId)
    .maybeSingle();

  if (fetchErr || !row) return { ok: false, reason: "Attestation not found." };

  const due = new Date(input.dueAtIso);
  if (Number.isNaN(due.getTime())) return { ok: false, reason: "Invalid due date." };

  const clearAttestation = due.getTime() > Date.now() && row.attested_at;

  const { error } = await client
    .from("compliance_control_attestations")
    .update({
      owner_user_id: input.ownerUserId,
      due_at: due.toISOString(),
      updated_at: new Date().toISOString(),
      ...(clearAttestation
        ? { attested_at: null, attested_by: null, attestation_note: null }
        : {}),
    })
    .eq("id", input.attestationId);

  if (error) return { ok: false, reason: error.message };

  const evidenceCount = await countLinkedAuditEvidence(userId, row.control_id as string, {
    orgId,
  });

  if (input.ownerUserId && input.ownerUserId !== row.owner_user_id) {
    await appendAttestationEvent(client, {
      attestationId: input.attestationId,
      orgId,
      actorUserId: userId,
      eventType: "owner_assigned",
      details: { owner_user_id: input.ownerUserId, control_id: row.control_id },
    });
    await appendAuditEvent({
      event_type: "governance.control_attestation_assigned",
      user_id: userId,
      org_id: orgId,
      details: {
        attestation_id: input.attestationId,
        control_id: row.control_id,
        owner_user_id: input.ownerUserId,
      },
    });
  }

  if (due.toISOString() !== row.due_at) {
    await appendAttestationEvent(client, {
      attestationId: input.attestationId,
      orgId,
      actorUserId: userId,
      eventType: "due_updated",
      details: { due_at: due.toISOString(), control_id: row.control_id },
    });
  }

  return { ok: true };
}

export type AttestControlResult = { ok: true } | { ok: false; reason: string };

export async function attestControl(
  userId: string,
  orgId: string,
  input: {
    attestationId: string;
    note?: string;
  },
  supabase?: SupabaseClient,
): Promise<AttestControlResult> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data: row, error: fetchErr } = await client
    .from("compliance_control_attestations")
    .select("id, org_id, control_id, owner_user_id")
    .eq("id", input.attestationId)
    .eq("org_id", orgId)
    .maybeSingle();

  if (fetchErr || !row) return { ok: false, reason: "Attestation not found." };

  const evidenceCount = await countLinkedAuditEvidence(userId, row.control_id as string, {
    orgId,
  });

  const note = input.note?.trim() || null;
  const now = new Date().toISOString();

  const { error } = await client
    .from("compliance_control_attestations")
    .update({
      attested_at: now,
      attested_by: userId,
      attestation_note: note,
      updated_at: now,
    })
    .eq("id", input.attestationId);

  if (error) return { ok: false, reason: error.message };

  await appendAttestationEvent(client, {
    attestationId: input.attestationId,
    orgId,
    actorUserId: userId,
    eventType: "attested",
    details: {
      control_id: row.control_id,
      linked_audit_evidence_count: evidenceCount,
      note,
      audit_href: auditEvidenceDeepLink(row.control_id as string),
    },
  });

  await appendAuditEvent({
    event_type: "governance.control_attestation_signed",
    user_id: userId,
    org_id: orgId,
    details: {
      attestation_id: input.attestationId,
      control_id: row.control_id,
      linked_audit_evidence_count: evidenceCount,
    },
  });

  return { ok: true };
}

export function validateControlIdForAttestation(controlId: string): boolean {
  return isKnownControlId(controlId, KNOWN_CONTROL_IDS);
}
