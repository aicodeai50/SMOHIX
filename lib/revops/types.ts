import { LEAD_STATUSES, type LeadStatus } from "@/lib/contact/leads";

export type { LeadStatus };
export { LEAD_STATUSES };

export const LEAD_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type LeadPriority = (typeof LEAD_PRIORITIES)[number];

export const LEAD_ACTIVITY_EVENTS = [
  "lead_created",
  "status_changed",
  "assigned",
  "note_added",
  "follow_up_scheduled",
  "contact_attempted",
  "pilot_proposed",
  "pilot_started",
  "lead_won",
  "lead_closed",
  "priority_changed",
  "next_action_set",
  "email_drafted",
  "email_sent",
] as const;

export type LeadActivityEvent = (typeof LEAD_ACTIVITY_EVENTS)[number];

export const PILOT_STATUSES = [
  "draft",
  "proposed",
  "approved",
  "active",
  "paused",
  "completed",
  "cancelled",
] as const;

export type PilotStatus = (typeof PILOT_STATUSES)[number];

export const PILOT_ACTIVITY_EVENTS = [
  "pilot_created",
  "status_changed",
  "assigned",
  "note_added",
  "follow_up_scheduled",
  "proposal_generated",
  "proposal_sent",
  "pilot_started",
  "pilot_completed",
  "pilot_cancelled",
] as const;

export type PilotActivityEvent = (typeof PILOT_ACTIVITY_EVENTS)[number];

export function leadStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

export function pilotStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function parseLeadStatus(value: string | null | undefined): LeadStatus | null {
  if (!value) return null;
  return LEAD_STATUSES.includes(value as LeadStatus) ? (value as LeadStatus) : null;
}

export function parsePilotStatus(value: string | null | undefined): PilotStatus | null {
  if (!value) return null;
  return PILOT_STATUSES.includes(value as PilotStatus) ? (value as PilotStatus) : null;
}

export function parseLeadPriority(value: string | null | undefined): LeadPriority | null {
  if (!value) return null;
  return LEAD_PRIORITIES.includes(value as LeadPriority) ? (value as LeadPriority) : null;
}
