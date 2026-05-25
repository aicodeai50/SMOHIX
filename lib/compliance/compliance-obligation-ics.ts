import type { SupabaseClient } from "@supabase/supabase-js";

import { listAssessorEvidenceRequests } from "@/lib/compliance/assessor-evidence-requests";
import { buildControlTestingSchedulesPack } from "@/lib/compliance/control-testing-schedules";
import type { ControlTestingSchedule } from "@/lib/compliance/control-testing-schedules";
import {
  buildGrcComplianceCalendar,
  dayKeyFromIso,
  type GrcCalendarEvent,
  type GrcCalendarEventKind,
} from "@/lib/compliance/grc-calendar";
import { getSiteUrl } from "@/lib/site";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const COMPLIANCE_OBLIGATION_ICS_VERSION = "zentro-compliance-obligation-ics/1";

export const OBLIGATION_ICS_CALENDAR_KINDS: GrcCalendarEventKind[] = [
  "attestation_due",
  "vendor_review",
  "recommended_bundle",
  "assessment_checkpoint",
];

export type IcsObligationSource = "grc_calendar" | "testing_schedule" | "evidence_request";

export type IcsObligationEvent = {
  id: string;
  source: IcsObligationSource;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  title: string;
  description: string;
  href: string;
  category: string;
  statusLabel: string;
};

export type ComplianceObligationIcsPack = {
  version: typeof COMPLIANCE_OBLIGATION_ICS_VERSION;
  generatedAt: string;
  orgId: string;
  horizonDays: number;
  siteUrl: string;
  calendarName: string;
  eventCount: number;
  subscriptionHint: string;
  ics: string;
};

export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n/g, "\\n")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

export function formatIcsUtcDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

export function formatIcsAllDay(dayKey: string): string {
  return dayKey.replace(/-/g, "");
}

export function icsUid(orgId: string, id: string, domain = "zentro.run"): string {
  const safe = id.replace(/[^a-zA-Z0-9-_.]/g, "-");
  return `obligation-${orgId}-${safe}@${domain}`;
}

export function icsCategoryForCalendarKind(kind: GrcCalendarEventKind): string {
  switch (kind) {
    case "attestation_due":
      return "Attestation";
    case "vendor_review":
      return "Vendor review";
    case "recommended_bundle":
      return "Evidence bundle";
    case "assessment_checkpoint":
      return "Framework checkpoint";
    default:
      return "GRC";
  }
}

export function grcCalendarEventToIcsObligation(
  event: GrcCalendarEvent,
  siteUrl: string,
): IcsObligationEvent | null {
  if (!OBLIGATION_ICS_CALENDAR_KINDS.includes(event.kind)) return null;
  if (event.status === "completed") return null;

  return {
    id: event.id,
    source: "grc_calendar",
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    allDay: true,
    title: event.title,
    description: `${event.detail} · ${event.status}`,
    href: `${siteUrl}${event.href}`,
    category: icsCategoryForCalendarKind(event.kind),
    statusLabel: event.status,
  };
}

export function testingScheduleToIcsObligation(
  schedule: ControlTestingSchedule,
  siteUrl: string,
): IcsObligationEvent | null {
  if (schedule.status === "completed") return null;
  if (
    schedule.kind !== "attestation_evidence" &&
    schedule.kind !== "scheduled_bundle" &&
    schedule.kind !== "framework_checkpoint"
  ) {
    return null;
  }

  const category =
    schedule.kind === "scheduled_bundle"
      ? "Evidence bundle"
      : schedule.kind === "framework_checkpoint"
        ? "Framework checkpoint"
        : "Control testing";

  return {
    id: `testing-${schedule.id}`,
    source: "testing_schedule",
    startsAt: schedule.nextRunAt,
    endsAt: schedule.windowEnd,
    allDay: false,
    title: schedule.title,
    description: `${schedule.detail} · ${schedule.cadenceLabel} · ${schedule.status}`,
    href: `${siteUrl}${schedule.href}`,
    category,
    statusLabel: schedule.status,
  };
}

export function evidenceRequestToIcsObligation(
  input: {
    id: string;
    title: string;
    description: string | null;
    dueAt: string;
    frameworkLabel: string;
    controlRef: string;
    status: string;
    href: string;
  },
  siteUrl: string,
): IcsObligationEvent {
  return {
    id: `evidence-req-${input.id}`,
    source: "evidence_request",
    startsAt: input.dueAt,
    endsAt: null,
    allDay: true,
    title: `Evidence request: ${input.title}`,
    description: `${input.frameworkLabel} ${input.controlRef}${input.description ? ` · ${input.description}` : ""} · ${input.status}`,
    href: `${siteUrl}${input.href}`,
    category: "Assessor request",
    statusLabel: input.status,
  };
}

export function dedupeIcsObligationEvents(events: IcsObligationEvent[]): IcsObligationEvent[] {
  const byId = new Map<string, IcsObligationEvent>();
  for (const e of events) {
    byId.set(e.id, e);
  }
  return [...byId.values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function buildIcsVevent(
  event: IcsObligationEvent,
  orgId: string,
  dtStamp: string,
): string {
  const lines = [
    "BEGIN:VEVENT",
    `UID:${icsUid(orgId, event.id)}`,
    `DTSTAMP:${dtStamp}`,
  ];

  if (event.allDay) {
    const day = formatIcsAllDay(dayKeyFromIso(event.startsAt));
    lines.push(`DTSTART;VALUE=DATE:${day}`);
    if (event.endsAt) {
      const endDay = formatIcsAllDay(dayKeyFromIso(event.endsAt));
      lines.push(`DTEND;VALUE=DATE:${endDay}`);
    }
  } else {
    lines.push(`DTSTART:${formatIcsUtcDateTime(event.startsAt)}`);
    if (event.endsAt) {
      lines.push(`DTEND:${formatIcsUtcDateTime(event.endsAt)}`);
    }
  }

  lines.push(
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    `URL:${event.href}`,
    `CATEGORIES:${escapeIcsText(event.category)}`,
    `STATUS:CONFIRMED`,
    "END:VEVENT",
  );

  return lines.join("\r\n");
}

export function buildIcsCalendarDocument(input: {
  orgId: string;
  calendarName: string;
  events: IcsObligationEvent[];
  generatedAt?: string;
}): string {
  const dtStamp = formatIcsUtcDateTime(input.generatedAt ?? new Date().toISOString());
  const vevents = input.events.map((e) => buildIcsVevent(e, input.orgId, dtStamp));

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Zentro//Compliance Obligations//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(input.calendarName)}`,
    `X-WR-TIMEZONE:UTC`,
    ...vevents,
    "END:VCALENDAR",
  ];

  return `${lines.join("\r\n")}\r\n`;
}

export function buildComplianceObligationIcsPackFromEvents(input: {
  orgId: string;
  horizonDays: number;
  events: IcsObligationEvent[];
  siteUrl?: string;
  generatedAt?: string;
}): ComplianceObligationIcsPack {
  const siteUrl = input.siteUrl ?? getSiteUrl();
  const events = dedupeIcsObligationEvents(input.events);
  const calendarName = "Zentro GRC obligations";

  return {
    version: COMPLIANCE_OBLIGATION_ICS_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    orgId: input.orgId,
    horizonDays: input.horizonDays,
    siteUrl,
    calendarName,
    eventCount: events.length,
    subscriptionHint:
      "Import the .ics file into Google Calendar, Outlook, or Apple Calendar. Re-download periodically to refresh deadlines. Assessor API: GET /api/governance/compliance/assessor/obligation-ics with a zentro_ca_* token.",
    ics: buildIcsCalendarDocument({
      orgId: input.orgId,
      calendarName,
      events,
      generatedAt: input.generatedAt,
    }),
  };
}

export async function buildComplianceObligationIcs(
  userId: string,
  opts: {
    orgId: string | null;
    horizonDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<ComplianceObligationIcsPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const horizonDays = opts.horizonDays ?? 365;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const siteUrl = getSiteUrl();

  const [calendar, testing, evidenceRequests] = await Promise.all([
    buildGrcComplianceCalendar(userId, { orgId: opts.orgId, horizonDays, supabase }),
    buildControlTestingSchedulesPack(userId, { orgId: opts.orgId, horizonDays, supabase }),
    listAssessorEvidenceRequests(opts.orgId, supabase),
  ]);

  const events: IcsObligationEvent[] = [];

  if (calendar) {
    for (const e of calendar.events) {
      const mapped = grcCalendarEventToIcsObligation(e, siteUrl);
      if (mapped) events.push(mapped);
    }
  }

  if (testing) {
    for (const s of testing.schedules) {
      const mapped = testingScheduleToIcsObligation(s, siteUrl);
      if (mapped) events.push(mapped);
    }
  }

  for (const req of evidenceRequests) {
    if (req.status === "fulfilled" || req.status === "cancelled") continue;
    events.push(
      evidenceRequestToIcsObligation(
        {
          id: req.id,
          title: req.title,
          description: req.description,
          dueAt: req.dueAt,
          frameworkLabel: req.frameworkLabel,
          controlRef: req.controlRef,
          status: req.status,
          href: "/governance/compliance/evidence-requests",
        },
        siteUrl,
      ),
    );
  }

  return buildComplianceObligationIcsPackFromEvents({
    orgId: opts.orgId,
    horizonDays,
    events,
    siteUrl,
  });
}
