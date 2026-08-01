import { logEvent } from "@/lib/observability/logger";

import type { LeadActivityEvent, PilotActivityEvent } from "./types";

export type LeadActivityRow = {
  id: string;
  lead_id: string;
  created_at: string;
  actor_email: string;
  event_type: LeadActivityEvent;
  summary: string;
  metadata: Record<string, unknown>;
};

export type PilotActivityRow = {
  id: string;
  pilot_id: string;
  created_at: string;
  actor_email: string;
  event_type: PilotActivityEvent;
  summary: string;
  metadata: Record<string, unknown>;
};

const devLeadActivity: LeadActivityRow[] = [];
const devPilotActivity: PilotActivityRow[] = [];

function isDevFallback(): boolean {
  return process.env.NODE_ENV === "development" && process.env.ZENTRO_CONTACT_DEV_STORE === "1";
}

async function getSupabase() {
  const { createServiceSupabaseClient } = await import("@/lib/supabase/admin");
  return createServiceSupabaseClient();
}

export async function recordLeadActivity(input: {
  leadId: string;
  actorEmail: string;
  eventType: LeadActivityEvent;
  summary: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const row = {
    lead_id: input.leadId,
    actor_email: input.actorEmail.slice(0, 254),
    event_type: input.eventType,
    summary: input.summary.slice(0, 500),
    metadata: input.metadata ?? {},
  };

  const supabase = await getSupabase();
  if (!supabase) {
    if (isDevFallback()) {
      devLeadActivity.unshift({
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        ...row,
      });
    }
    return;
  }

  const { error } = await supabase.from("lead_activity").insert(row);
  if (error) {
    logEvent("warn", "lead_activity_failed", { eventType: input.eventType, code: "insert_failed" });
  }
}

export async function listLeadActivity(leadId: string, limit = 50): Promise<LeadActivityRow[]> {
  const supabase = await getSupabase();
  if (!supabase) {
    if (!isDevFallback()) return [];
    return devLeadActivity.filter((a) => a.lead_id === leadId).slice(0, limit);
  }

  const { data, error } = await supabase
    .from("lead_activity")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as LeadActivityRow[];
}

export async function recordPilotActivity(input: {
  pilotId: string;
  actorEmail: string;
  eventType: PilotActivityEvent;
  summary: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const row = {
    pilot_id: input.pilotId,
    actor_email: input.actorEmail.slice(0, 254),
    event_type: input.eventType,
    summary: input.summary.slice(0, 500),
    metadata: input.metadata ?? {},
  };

  const supabase = await getSupabase();
  if (!supabase) {
    if (isDevFallback()) {
      devPilotActivity.unshift({
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        ...row,
      });
    }
    return;
  }

  const { error } = await supabase.from("pilot_activity").insert(row);
  if (error) {
    logEvent("warn", "pilot_activity_failed", { eventType: input.eventType, code: "insert_failed" });
  }
}

export async function listPilotActivity(pilotId: string, limit = 50): Promise<PilotActivityRow[]> {
  const supabase = await getSupabase();
  if (!supabase) {
    if (!isDevFallback()) return [];
    return devPilotActivity.filter((a) => a.pilot_id === pilotId).slice(0, limit);
  }

  const { data, error } = await supabase
    .from("pilot_activity")
    .select("*")
    .eq("pilot_id", pilotId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as PilotActivityRow[];
}

export async function listRecentLeadActivity(limit = 20): Promise<LeadActivityRow[]> {
  const supabase = await getSupabase();
  if (!supabase) {
    if (!isDevFallback()) return [];
    return devLeadActivity.slice(0, limit);
  }

  const { data, error } = await supabase
    .from("lead_activity")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as LeadActivityRow[];
}

/** Test helper */
export function clearDevActivityForTests(): void {
  devLeadActivity.length = 0;
  devPilotActivity.length = 0;
}
