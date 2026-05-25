import {
  buildGrcCalendarFromEvents,
  dayKeyFromIso,
  monthGridForPack,
} from "../lib/compliance/grc-calendar";
import type { GrcCalendarEvent } from "../lib/compliance/grc-calendar";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const now = new Date();
const in14 = new Date(now.getTime() + 14 * 86_400_000).toISOString();
const in45 = new Date(now.getTime() + 45 * 86_400_000).toISOString();

const events: GrcCalendarEvent[] = [
  {
    id: "att-1",
    kind: "attestation_due",
    startsAt: in14,
    endsAt: null,
    title: "Attestation: soc2:CC6.1",
    detail: "Logical access",
    href: "/governance/compliance/attestations",
    status: "upcoming",
    dayKey: dayKeyFromIso(in14),
  },
  {
    id: "vendor-1",
    kind: "vendor_review",
    startsAt: in45,
    endsAt: null,
    title: "Vendor review: Acme SaaS",
    detail: "critical tier",
    href: "/governance/third-party-risk",
    status: "upcoming",
    dayKey: dayKeyFromIso(in45),
  },
];

const pack = buildGrcCalendarFromEvents({
  orgId: "org-1",
  horizonDays: 90,
  events,
  digestWebhookConfigured: true,
  slaRemindersEnabled: true,
});

assert(pack.events.length >= 2, "events in horizon");
assert(pack.eventsByDay[dayKeyFromIso(in14)]?.length === 1, "events grouped by day");
assert(pack.auditSeason.frameworkCount === 8, "eight frameworks in audit season");
assert(pack.upcomingCount >= 2, "upcoming count");

const { weeks, monthLabel } = monthGridForPack(pack, now.getUTCFullYear(), now.getUTCMonth());
assert(weeks.length >= 4, "month has weeks");
assert(monthLabel.length > 0, "month label");

assert(
  isPathAllowedForAuditor("/governance/compliance/calendar"),
  "auditor can open calendar",
);

console.log("test-grc-calendar: all checks passed");
