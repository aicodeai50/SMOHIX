import type { SupabaseClient } from "@supabase/supabase-js";

import { appendAuditEvent } from "@/lib/audit/append";
import { sendTransactionalEmailWithAudit } from "@/lib/notifications/email";
import { listOrgMembers } from "@/lib/org/data";

export type IncidentCommandEventType = "comment" | "handoff" | "copilot_context";

export type IncidentCommandEvent = {
  id: string;
  incidentId: string;
  orgId: string | null;
  userId: string;
  eventType: IncidentCommandEventType;
  body: string;
  targetUserId: string | null;
  createdAt: string;
};

function mapCommandEvent(row: Record<string, unknown>): IncidentCommandEvent {
  return {
    id: String(row.id),
    incidentId: String(row.incident_id),
    orgId: typeof row.org_id === "string" ? row.org_id : null,
    userId: String(row.user_id),
    eventType: String(row.event_type) as IncidentCommandEventType,
    body: String(row.body ?? ""),
    targetUserId: typeof row.target_user_id === "string" ? row.target_user_id : null,
    createdAt: String(row.created_at),
  };
}

export async function listIncidentCommandEvents(
  supabase: SupabaseClient,
  incidentId: string,
): Promise<IncidentCommandEvent[]> {
  const { data, error } = await supabase
    .from("incident_command_events")
    .select("id, incident_id, org_id, user_id, event_type, body, target_user_id, created_at")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    return [];
  }

  return data.map((row) => mapCommandEvent(row as Record<string, unknown>));
}

export async function createIncidentCommandEvent(input: {
  supabase: SupabaseClient;
  incidentId: string;
  userId: string;
  orgId: string | null;
  eventType: IncidentCommandEventType;
  body: string;
  targetUserId?: string | null;
}): Promise<{ ok: true; eventId: string } | { ok: false; reason: string }> {
  const body = input.body.trim().slice(0, 4000);
  if (!body) {
    return { ok: false, reason: "Message is required." };
  }

  const { data, error } = await input.supabase
    .from("incident_command_events")
    .insert({
      incident_id: input.incidentId,
      org_id: input.orgId,
      user_id: input.userId,
      event_type: input.eventType,
      body,
      target_user_id: input.targetUserId ?? null,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return { ok: false, reason: error?.message ?? "Could not add incident event." };
  }

  await appendAuditEvent({
    event_type: `incident.${input.eventType}_added`,
    user_id: input.userId,
    org_id: input.orgId,
    details: {
      incident_id: input.incidentId,
      command_event_id: data.id,
      target_user_id: input.targetUserId ?? null,
    },
  });

  return { ok: true, eventId: String(data.id) };
}

export async function notifyIncidentResponders(input: {
  supabase: SupabaseClient;
  incidentId: string;
  orgId: string | null;
  actorUserId: string;
  title: string;
  body: string;
  kind: string;
  targetUserId?: string | null;
}): Promise<void> {
  if (!input.orgId) {
    return;
  }

  const members = await listOrgMembers(input.orgId, { supabase: input.supabase });
  const recipients = members.filter((member) =>
    input.targetUserId ? member.userId === input.targetUserId : member.userId !== input.actorUserId,
  );

  if (recipients.length === 0) {
    return;
  }

  await input.supabase.from("user_notifications").insert(
    recipients.map((member) => ({
      org_id: input.orgId,
      user_id: member.userId,
      actor_user_id: input.actorUserId,
      incident_id: input.incidentId,
      kind: input.kind,
      title: input.title.slice(0, 180),
      body: input.body.slice(0, 1000),
    })),
  );

  await Promise.all(
    recipients
      .filter((member) => member.email)
      .map((member) =>
        sendTransactionalEmailWithAudit({
          userId: input.actorUserId,
          orgId: input.orgId,
          to: member.email!,
          subject: input.title.slice(0, 180),
          text: input.body,
          auditDetails: {
            incident_id: input.incidentId,
            notification_kind: input.kind,
            recipient_user_id: member.userId,
          },
        }),
      ),
  );
}
