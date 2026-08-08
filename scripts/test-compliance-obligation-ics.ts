import {
  buildComplianceObligationIcsPackFromEvents,
  buildIcsCalendarDocument,
  buildIcsVevent,
  dedupeIcsObligationEvents,
  escapeIcsText,
  evidenceRequestToIcsObligation,
  formatIcsAllDay,
  formatIcsUtcDateTime,
  grcCalendarEventToIcsObligation,
  icsUid,
  OBLIGATION_ICS_CALENDAR_KINDS,
} from "../lib/compliance/compliance-obligation-ics";
import type { GrcCalendarEvent } from "../lib/compliance/grc-calendar";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(escapeIcsText("a;b\nc") === "a\\;b\\nc", "ics escape semicolon and newline");
assert(formatIcsAllDay("2026-05-24") === "20260524", "all day format");
assert(formatIcsUtcDateTime("2026-05-24T12:00:00.000Z").endsWith("Z"), "utc format ends Z");

const site = "https://smohix.run";
const attestationEvent: GrcCalendarEvent = {
  id: "att-1",
  kind: "attestation_due",
  startsAt: "2026-06-01T00:00:00.000Z",
  endsAt: null,
  title: "Attestation: CC6.1",
  detail: "Logical access",
  href: "/governance/compliance/attestations",
  status: "upcoming",
  dayKey: "2026-06-01",
};

const mapped = grcCalendarEventToIcsObligation(attestationEvent, site);
assert(mapped !== null && mapped.allDay, "attestation mapped all-day");

const digestEvent: GrcCalendarEvent = {
  ...attestationEvent,
  id: "digest-1",
  kind: "scheduled_digest",
};
assert(grcCalendarEventToIcsObligation(digestEvent, site) === null, "digest excluded");

assert(OBLIGATION_ICS_CALENDAR_KINDS.includes("vendor_review"), "vendor in kinds");

const evidence = evidenceRequestToIcsObligation(
  {
    id: "r1",
    title: "Access logs",
    description: "Q1",
    dueAt: "2026-06-15T00:00:00.000Z",
    frameworkLabel: "SOC 2",
    controlRef: "CC6.1",
    status: "open",
    href: "/governance/compliance/evidence-requests",
  },
  site,
);
assert(evidence.href.startsWith("https://"), "absolute url");

const events = dedupeIcsObligationEvents([mapped!, evidence, mapped!]);
assert(events.length === 2, "dedupe");

const vevent = buildIcsVevent(events[0]!, "org-1", formatIcsUtcDateTime(new Date().toISOString()));
assert(vevent.includes("BEGIN:VEVENT") && vevent.includes("SUMMARY:"), "vevent structure");

const ics = buildIcsCalendarDocument({
  orgId: "org-1",
  calendarName: "Test",
  events,
});
assert(ics.includes("BEGIN:VCALENDAR") && ics.includes("END:VCALENDAR"), "calendar wrapper");

const pack = buildComplianceObligationIcsPackFromEvents({
  orgId: "org-1",
  horizonDays: 365,
  events,
  siteUrl: site,
});
assert(pack.eventCount === 2, "pack count");
assert(icsUid("org", "id-1").includes("org"), "uid");

assert(isPathAllowedForAuditor("/governance/compliance/obligation-ics"), "auditor path");

console.log("test-compliance-obligation-ics: all checks passed");
