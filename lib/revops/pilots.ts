import { randomBytes } from "node:crypto";

import { logEvent } from "@/lib/observability/logger";

import { recordLeadActivity, recordPilotActivity } from "./activity";
import type { ExtendedLeadRow } from "./leads";
import { updateLeadWithActivity } from "./leads";
import type { PilotStatus } from "./types";

export type PilotProjectRow = {
  id: string;
  public_reference: string;
  lead_id: string | null;
  created_at: string;
  updated_at: string;
  name: string;
  organization: string;
  contact_name: string;
  contact_email: string;
  category: string | null;
  related_product: string | null;
  objective: string | null;
  scope: string | null;
  status: PilotStatus;
  start_date: string | null;
  target_review_date: string | null;
  owner: string | null;
  risks: string | null;
  next_action: string | null;
  notes: string | null;
  discovery_call_date: string | null;
  pilot_kickoff_date: string | null;
  review_meeting_date: string | null;
  metadata: Record<string, unknown>;
};

export type PilotUpdatePatch = {
  name?: string;
  organization?: string;
  contactName?: string;
  contactEmail?: string;
  category?: string | null;
  relatedProduct?: string | null;
  objective?: string | null;
  scope?: string | null;
  status?: PilotStatus;
  startDate?: string | null;
  targetReviewDate?: string | null;
  owner?: string | null;
  risks?: string | null;
  nextAction?: string | null;
  notes?: string | null;
  discoveryCallDate?: string | null;
  pilotKickoffDate?: string | null;
  reviewMeetingDate?: string | null;
};

const devPilots: PilotProjectRow[] = [];

function isDevFallback(): boolean {
  return process.env.NODE_ENV === "development" && process.env.ZENTRO_CONTACT_DEV_STORE === "1";
}

async function getSupabase() {
  const { createServiceSupabaseClient } = await import("@/lib/supabase/admin");
  return createServiceSupabaseClient();
}

function generatePilotReference(): string {
  return `PLT-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function getPilotById(id: string): Promise<PilotProjectRow | null> {
  const supabase = await getSupabase();
  if (!supabase) {
    if (!isDevFallback()) return null;
    return devPilots.find((p) => p.id === id) ?? null;
  }
  const { data, error } = await supabase.from("pilot_projects").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data as PilotProjectRow;
}

export async function listPilots(options: {
  page: number;
  limit: number;
  status?: PilotStatus | null;
  search?: string | null;
  owner?: string | null;
}): Promise<{ rows: PilotProjectRow[]; total: number }> {
  const supabase = await getSupabase();
  const offset = (options.page - 1) * options.limit;

  if (!supabase) {
    if (!isDevFallback()) return { rows: [], total: 0 };
    let filtered = [...devPilots];
    if (options.status) filtered = filtered.filter((p) => p.status === options.status);
    if (options.owner) filtered = filtered.filter((p) => p.owner === options.owner);
    if (options.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.organization.toLowerCase().includes(q) ||
          p.public_reference.toLowerCase().includes(q),
      );
    }
    return { rows: filtered.slice(offset, offset + options.limit), total: filtered.length };
  }

  let query = supabase
    .from("pilot_projects")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + options.limit - 1);

  if (options.status) query = query.eq("status", options.status);
  if (options.owner) query = query.eq("owner", options.owner);
  if (options.search) {
    const q = options.search.trim().slice(0, 100);
    query = query.or(`name.ilike.%${q}%,organization.ilike.%${q}%,public_reference.ilike.%${q}%`);
  }

  const { data, error, count } = await query;
  if (error || !data) return { rows: [], total: 0 };
  return { rows: data as PilotProjectRow[], total: count ?? data.length };
}

export async function createPilotFromLead(
  lead: ExtendedLeadRow,
  actorEmail: string,
  overrides?: Partial<{
    name: string;
    objective: string;
    scope: string;
    owner: string;
  }>,
): Promise<PilotProjectRow | null> {
  const publicReference = generatePilotReference();
  const row = {
    public_reference: publicReference,
    lead_id: lead.id,
    name: overrides?.name ?? `${lead.company} pilot`,
    organization: lead.company,
    contact_name: lead.name,
    contact_email: lead.email,
    category: lead.pilot_category,
    related_product: lead.product_context,
    objective: overrides?.objective ?? lead.problem_summary.slice(0, 500),
    scope: overrides?.scope ?? null,
    status: "draft" as const,
    owner: overrides?.owner ?? lead.assigned_to,
    metadata: { source_reference: lead.public_reference },
  };

  const supabase = await getSupabase();
  let pilot: PilotProjectRow;

  if (!supabase) {
    if (!isDevFallback()) return null;
    const now = new Date().toISOString();
    pilot = {
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      start_date: null,
      target_review_date: null,
      risks: null,
      next_action: null,
      notes: null,
      discovery_call_date: lead.discovery_call_date,
      pilot_kickoff_date: lead.pilot_kickoff_date,
      review_meeting_date: lead.review_meeting_date,
      ...row,
    };
    devPilots.unshift(pilot);
  } else {
    const { data, error } = await supabase.from("pilot_projects").insert(row).select("*").single();
    if (error || !data) return null;
    pilot = data as PilotProjectRow;
  }

  await updateLeadWithActivity(
    lead.id,
    { pilotProjectId: pilot.id, status: "pilot_proposed" },
    actorEmail,
  );

  await recordPilotActivity({
    pilotId: pilot.id,
    actorEmail,
    eventType: "pilot_created",
    summary: `Pilot created from lead ${lead.public_reference}`,
    metadata: { leadId: lead.id },
  });

  await recordLeadActivity({
    leadId: lead.id,
    actorEmail,
    eventType: "pilot_proposed",
    summary: `Pilot ${publicReference} created`,
    metadata: { pilotId: pilot.id },
  });

  logEvent("info", "pilot_created", { pilotId: pilot.id, leadId: lead.id });
  return pilot;
}

export async function updatePilotWithActivity(
  id: string,
  patch: PilotUpdatePatch,
  actorEmail: string,
): Promise<boolean> {
  const existing = await getPilotById(id);
  if (!existing) return false;

  const update: Record<string, unknown> = {};
  if (patch.name) update.name = patch.name.slice(0, 200);
  if (patch.organization) update.organization = patch.organization.slice(0, 200);
  if (patch.contactName) update.contact_name = patch.contactName.slice(0, 120);
  if (patch.contactEmail) update.contact_email = patch.contactEmail.slice(0, 254);
  if (patch.category !== undefined) update.category = patch.category?.slice(0, 100) ?? null;
  if (patch.relatedProduct !== undefined)
    update.related_product = patch.relatedProduct?.slice(0, 200) ?? null;
  if (patch.objective !== undefined) update.objective = patch.objective?.slice(0, 2000) ?? null;
  if (patch.scope !== undefined) update.scope = patch.scope?.slice(0, 2000) ?? null;
  if (patch.status) update.status = patch.status;
  if (patch.startDate !== undefined) update.start_date = patch.startDate;
  if (patch.targetReviewDate !== undefined) update.target_review_date = patch.targetReviewDate;
  if (patch.owner !== undefined) update.owner = patch.owner?.slice(0, 200) ?? null;
  if (patch.risks !== undefined) update.risks = patch.risks?.slice(0, 2000) ?? null;
  if (patch.nextAction !== undefined) update.next_action = patch.nextAction?.slice(0, 500) ?? null;
  if (patch.notes !== undefined) update.notes = patch.notes?.slice(0, 4000) ?? null;
  if (patch.discoveryCallDate !== undefined) update.discovery_call_date = patch.discoveryCallDate;
  if (patch.pilotKickoffDate !== undefined) update.pilot_kickoff_date = patch.pilotKickoffDate;
  if (patch.reviewMeetingDate !== undefined) update.review_meeting_date = patch.reviewMeetingDate;

  const supabase = await getSupabase();
  if (!supabase) {
    if (!isDevFallback()) return false;
    const row = devPilots.find((p) => p.id === id);
    if (!row) return false;
    Object.assign(row, update, { updated_at: new Date().toISOString() });
  } else {
    const { error } = await supabase.from("pilot_projects").update(update).eq("id", id);
    if (error) return false;
  }

  if (patch.status && patch.status !== existing.status) {
    const eventType =
      patch.status === "active"
        ? "pilot_started"
        : patch.status === "completed"
          ? "pilot_completed"
          : patch.status === "cancelled"
            ? "pilot_cancelled"
            : "status_changed";
    await recordPilotActivity({
      pilotId: id,
      actorEmail,
      eventType,
      summary: `Status changed from ${existing.status} to ${patch.status}`,
      metadata: { from: existing.status, to: patch.status },
    });

    if (existing.lead_id) {
      if (patch.status === "active") {
        await updateLeadWithActivity(existing.lead_id, { status: "pilot_active" }, actorEmail);
      }
    }
  }

  if (patch.notes !== undefined && patch.notes !== existing.notes) {
    await recordPilotActivity({
      pilotId: id,
      actorEmail,
      eventType: "note_added",
      summary: "Notes updated",
    });
  }

  return true;
}

export async function listPilotsForExport(filters: {
  status?: PilotStatus | null;
}): Promise<PilotProjectRow[]> {
  const { rows } = await listPilots({ ...filters, page: 1, limit: 5000, search: null, owner: null });
  return rows;
}
