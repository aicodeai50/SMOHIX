import { logEvent } from "@/lib/observability/logger";

import { recordLeadActivity } from "./activity";
import type { LeadPriority, LeadStatus } from "./types";

export type ExtendedLeadRow = {
  id: string;
  public_reference: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  company: string;
  country: string;
  inquiry_type: string;
  problem_summary: string;
  budget_range: string | null;
  timeline: string | null;
  product_context: string | null;
  pilot_category: string | null;
  consent: boolean;
  source_path: string | null;
  status: LeadStatus;
  assigned_to: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  next_action: string | null;
  follow_up_date: string | null;
  priority: LeadPriority;
  source_label: string | null;
  discovery_call_date: string | null;
  pilot_kickoff_date: string | null;
  review_meeting_date: string | null;
  pilot_project_id: string | null;
};

export type LeadUpdatePatch = {
  status?: LeadStatus;
  notes?: string | null;
  assignedTo?: string | null;
  nextAction?: string | null;
  followUpDate?: string | null;
  priority?: LeadPriority;
  sourceLabel?: string | null;
  discoveryCallDate?: string | null;
  pilotKickoffDate?: string | null;
  reviewMeetingDate?: string | null;
  pilotProjectId?: string | null;
};

function isDevFallback(): boolean {
  return process.env.NODE_ENV === "development" && process.env.ZENTRO_CONTACT_DEV_STORE === "1";
}

async function getSupabase() {
  const { createServiceSupabaseClient } = await import("@/lib/supabase/admin");
  return createServiceSupabaseClient();
}

function mapLeadEventForStatus(status: LeadStatus): "lead_won" | "lead_closed" | "pilot_proposed" | "pilot_started" | "status_changed" {
  if (status === "won") return "lead_won";
  if (status === "closed" || status === "spam") return "lead_closed";
  if (status === "pilot_proposed") return "pilot_proposed";
  if (status === "pilot_active") return "pilot_started";
  return "status_changed";
}

export async function getLeadById(id: string): Promise<ExtendedLeadRow | null> {
  const supabase = await getSupabase();
  if (!supabase) {
    if (!isDevFallback()) return null;
    const { devLeadsExtended } = await import("./dev-store");
    return devLeadsExtended.find((l) => l.id === id) ?? null;
  }

  const { data, error } = await supabase.from("contact_leads").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data as ExtendedLeadRow;
}

export async function listExtendedLeads(options: {
  page: number;
  limit: number;
  inquiryType?: string | null;
  status?: LeadStatus | null;
  search?: string | null;
  assignedTo?: string | null;
  priority?: LeadPriority | null;
  overdueFollowUp?: boolean;
}): Promise<{ rows: ExtendedLeadRow[]; total: number }> {
  const supabase = await getSupabase();
  const offset = (options.page - 1) * options.limit;

  if (!supabase) {
    if (!isDevFallback()) return { rows: [], total: 0 };
    const { devLeadsExtended } = await import("./dev-store");
    let filtered = [...devLeadsExtended];
    if (options.inquiryType) filtered = filtered.filter((r) => r.inquiry_type === options.inquiryType);
    if (options.status) filtered = filtered.filter((r) => r.status === options.status);
    if (options.assignedTo) filtered = filtered.filter((r) => r.assigned_to === options.assignedTo);
    if (options.priority) filtered = filtered.filter((r) => r.priority === options.priority);
    if (options.overdueFollowUp) {
      const now = Date.now();
      filtered = filtered.filter(
        (r) => r.follow_up_date && new Date(r.follow_up_date).getTime() < now,
      );
    }
    if (options.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.email.toLowerCase().includes(q) ||
          r.company.toLowerCase().includes(q) ||
          r.public_reference.toLowerCase().includes(q),
      );
    }
    return { rows: filtered.slice(offset, offset + options.limit), total: filtered.length };
  }

  let query = supabase
    .from("contact_leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + options.limit - 1);

  if (options.inquiryType) query = query.eq("inquiry_type", options.inquiryType);
  if (options.status) query = query.eq("status", options.status);
  if (options.assignedTo) query = query.eq("assigned_to", options.assignedTo);
  if (options.priority) query = query.eq("priority", options.priority);
  if (options.overdueFollowUp) {
    query = query.lt("follow_up_date", new Date().toISOString()).not("follow_up_date", "is", null);
  }
  if (options.search) {
    const q = options.search.trim().slice(0, 100);
    query = query.or(`email.ilike.%${q}%,company.ilike.%${q}%,public_reference.ilike.%${q}%`);
  }

  const { data, error, count } = await query;
  if (error || !data) return { rows: [], total: 0 };
  return { rows: data as ExtendedLeadRow[], total: count ?? data.length };
}

export async function updateLeadWithActivity(
  id: string,
  patch: LeadUpdatePatch,
  actorEmail: string,
): Promise<boolean> {
  const existing = await getLeadById(id);
  if (!existing) return false;

  const update: Record<string, unknown> = {};
  if (patch.status) update.status = patch.status;
  if (patch.notes !== undefined) update.notes = patch.notes?.slice(0, 4000) ?? null;
  if (patch.assignedTo !== undefined) update.assigned_to = patch.assignedTo?.slice(0, 200) ?? null;
  if (patch.nextAction !== undefined) update.next_action = patch.nextAction?.slice(0, 500) ?? null;
  if (patch.followUpDate !== undefined) update.follow_up_date = patch.followUpDate;
  if (patch.priority) update.priority = patch.priority;
  if (patch.sourceLabel !== undefined) update.source_label = patch.sourceLabel?.slice(0, 200) ?? null;
  if (patch.discoveryCallDate !== undefined) update.discovery_call_date = patch.discoveryCallDate;
  if (patch.pilotKickoffDate !== undefined) update.pilot_kickoff_date = patch.pilotKickoffDate;
  if (patch.reviewMeetingDate !== undefined) update.review_meeting_date = patch.reviewMeetingDate;
  if (patch.pilotProjectId !== undefined) update.pilot_project_id = patch.pilotProjectId;

  const supabase = await getSupabase();
  if (!supabase) {
    if (!isDevFallback()) return false;
    const { devLeadsExtended } = await import("./dev-store");
    const row = devLeadsExtended.find((l) => l.id === id);
    if (!row) return false;
    Object.assign(row, {
      status: patch.status ?? row.status,
      notes: patch.notes !== undefined ? patch.notes : row.notes,
      assigned_to: patch.assignedTo !== undefined ? patch.assignedTo : row.assigned_to,
      next_action: patch.nextAction !== undefined ? patch.nextAction : row.next_action,
      follow_up_date: patch.followUpDate !== undefined ? patch.followUpDate : row.follow_up_date,
      priority: patch.priority ?? row.priority,
      source_label: patch.sourceLabel !== undefined ? patch.sourceLabel : row.source_label,
      discovery_call_date:
        patch.discoveryCallDate !== undefined ? patch.discoveryCallDate : row.discovery_call_date,
      pilot_kickoff_date:
        patch.pilotKickoffDate !== undefined ? patch.pilotKickoffDate : row.pilot_kickoff_date,
      review_meeting_date:
        patch.reviewMeetingDate !== undefined ? patch.reviewMeetingDate : row.review_meeting_date,
      pilot_project_id:
        patch.pilotProjectId !== undefined ? patch.pilotProjectId : row.pilot_project_id,
      updated_at: new Date().toISOString(),
    });
  } else {
    const { error } = await supabase.from("contact_leads").update(update).eq("id", id);
    if (error) return false;
  }

  if (patch.status && patch.status !== existing.status) {
    await recordLeadActivity({
      leadId: id,
      actorEmail,
      eventType: mapLeadEventForStatus(patch.status),
      summary: `Status changed from ${existing.status} to ${patch.status}`,
      metadata: { from: existing.status, to: patch.status },
    });
  }
  if (patch.assignedTo !== undefined && patch.assignedTo !== existing.assigned_to) {
    await recordLeadActivity({
      leadId: id,
      actorEmail,
      eventType: "assigned",
      summary: patch.assignedTo ? `Assigned to ${patch.assignedTo}` : "Assignment cleared",
      metadata: { assignedTo: patch.assignedTo },
    });
  }
  if (patch.notes !== undefined && patch.notes !== existing.notes) {
    await recordLeadActivity({
      leadId: id,
      actorEmail,
      eventType: "note_added",
      summary: "Internal notes updated",
    });
  }
  if (patch.followUpDate !== undefined && patch.followUpDate !== existing.follow_up_date) {
    await recordLeadActivity({
      leadId: id,
      actorEmail,
      eventType: "follow_up_scheduled",
      summary: patch.followUpDate
        ? `Follow-up scheduled for ${patch.followUpDate.slice(0, 10)}`
        : "Follow-up date cleared",
      metadata: { followUpDate: patch.followUpDate },
    });
  }
  if (patch.priority && patch.priority !== existing.priority) {
    await recordLeadActivity({
      leadId: id,
      actorEmail,
      eventType: "priority_changed",
      summary: `Priority changed to ${patch.priority}`,
      metadata: { priority: patch.priority },
    });
  }
  if (patch.nextAction !== undefined && patch.nextAction !== existing.next_action) {
    await recordLeadActivity({
      leadId: id,
      actorEmail,
      eventType: "next_action_set",
      summary: patch.nextAction ? `Next action: ${patch.nextAction.slice(0, 120)}` : "Next action cleared",
    });
  }

  logEvent("info", "lead_updated", {
    leadId: id,
    actorEmail: actorEmail.split("@")[1] ?? "unknown",
    fields: Object.keys(update),
  });

  return true;
}

export async function listLeadsForExport(filters: {
  inquiryType?: string | null;
  status?: LeadStatus | null;
  search?: string | null;
}): Promise<ExtendedLeadRow[]> {
  const { rows } = await listExtendedLeads({ ...filters, page: 1, limit: 5000 });
  return rows;
}
