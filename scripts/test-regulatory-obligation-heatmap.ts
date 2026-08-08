import {
  buildRegulatoryObligationHeatmapFromItems,
  classifyObligationUrgency,
  collectRegulatoryObligationItems,
  obligationIntensityScore,
  regulatoryObligationHeatmapToCsv,
} from "../lib/compliance/regulatory-obligation-heatmap";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const now = new Date("2026-05-20T12:00:00.000Z");

assert(classifyObligationUrgency("2026-05-10T00:00:00.000Z", now) === "overdue", "overdue");
assert(classifyObligationUrgency("2026-05-24T00:00:00.000Z", now) === "due_soon", "due soon");
assert(classifyObligationUrgency("2026-07-01T00:00:00.000Z", now) === "upcoming", "upcoming");

assert(
  obligationIntensityScore({ overdue: 2, dueSoon: 1, upcoming: 3 }) >
    obligationIntensityScore({ overdue: 0, dueSoon: 0, upcoming: 3 }),
  "overdue weights higher",
);

const items = collectRegulatoryObligationItems({
  calendar: {
    version: "smohix-grc-calendar/1",
    generatedAt: now.toISOString(),
    orgId: "org-1",
    horizonDays: 90,
    rangeStart: "2026-05-20",
    rangeEnd: "2026-08-18",
    auditSeason: {
      label: "Q2 2026",
      quarterEnd: "2026-06-30",
      daysUntilQuarterEnd: 41,
      frameworkCount: 8,
      periodDays: 90,
    },
    digestWebhookConfigured: false,
    slaRemindersEnabled: false,
    eventsByDay: {},
    upcomingCount: 1,
    overdueCount: 1,
    events: [
      {
        id: "assessment-soc2-2026-06-30",
        kind: "assessment_checkpoint",
        startsAt: "2026-06-30T00:00:00.000Z",
        endsAt: null,
        title: "SOC 2 checkpoint",
        detail: "Quarter close",
        href: "/governance/compliance/type-ii",
        status: "upcoming",
        dayKey: "2026-06-30",
      },
      {
        id: "vendor-critical-1",
        kind: "vendor_review",
        startsAt: "2026-05-18T00:00:00.000Z",
        endsAt: null,
        title: "Vendor review",
        detail: "critical tier · Acme SaaS",
        href: "/governance/third-party-risk",
        status: "overdue",
        dayKey: "2026-05-18",
      },
    ],
  },
  testing: {
    version: "smohix-control-testing-schedules/1",
    generatedAt: now.toISOString(),
    orgId: "org-1",
    horizonDays: 90,
    schedules: [
      {
        id: "sched-1",
        kind: "framework_checkpoint",
        title: "ISO checkpoint window",
        cadenceLabel: "Quarterly",
        nextRunAt: "2026-05-22T00:00:00.000Z",
        windowStart: "2026-05-15T00:00:00.000Z",
        windowEnd: "2026-06-15T00:00:00.000Z",
        status: "due",
        controlCount: 12,
        controlIds: [],
        framework: "iso27001",
        detail: "Evidence window",
        href: "/governance/compliance/testing-schedules",
      },
    ],
    dueCount: 1,
    upcomingCount: 0,
    overdueCount: 0,
    attestationScheduleCount: 0,
    checkpointScheduleCount: 1,
    freshnessRetestCount: 0,
    bundleScheduleCount: 0,
  },
  evidenceRequests: [
    {
      id: "req-1",
      orgId: "org-1",
      controlId: "soc2:CC1.2",
      controlRef: "CC1.2",
      controlTitle: "Control environment",
      framework: "soc2",
      frameworkLabel: "SOC 2",
      title: "Board minutes",
      description: null,
      documentType: "control_evidence",
      storedStatus: "open",
      status: "overdue",
      requestedByUserId: "u1",
      requestedByLabel: "Auditor",
      assignedToUserId: null,
      assignedToLabel: null,
      dueAt: "2026-05-10T00:00:00.000Z",
      fulfilledAt: null,
      fulfilledByLabel: null,
      fulfillmentNote: null,
      auditEvidenceHref: "/audit",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ],
  horizonDays: 90,
  now,
});

assert(items.length >= 3, "collects calendar, testing, and requests");

const pack = buildRegulatoryObligationHeatmapFromItems({
  orgId: "org-1",
  horizonDays: 90,
  items,
  generatedAt: now.toISOString(),
});

assert(pack.totalOpen === items.length, "total open matches items");
assert(pack.totalOverdue >= 1, "has overdue");
const soc2Cell = pack.frameworkGrid.find((c) => c.key === "soc2");
assert(soc2Cell !== undefined && soc2Cell.openCount >= 1, "soc2 framework bucket");
const criticalVendor = pack.vendorTierGrid.find((c) => c.key === "critical");
assert(criticalVendor !== undefined && criticalVendor.openCount >= 1, "critical vendor tier");
const csv = regulatoryObligationHeatmapToCsv(pack);
assert(csv.includes("framework,soc2"), "csv framework row");

assert(
  isPathAllowedForAuditor("/governance/compliance/obligation-heatmap"),
  "auditor may view obligation heatmap",
);

console.log("test-regulatory-obligation-heatmap: ok");
