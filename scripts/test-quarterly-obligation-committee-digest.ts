import {
  buildCommitteeDigestMarkdown,
  buildCommitteeDigestPayload,
  buildQuarterlyObligationCommitteeDigestFromParts,
  committeeDigestToCsv,
  isQuarterlyDigestDue,
  QUARTERLY_OBLIGATION_COMMITTEE_DIGEST_VERSION,
} from "../lib/compliance/quarterly-obligation-committee-digest";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const now = new Date("2026-05-20T12:00:00.000Z").getTime();

assert(isQuarterlyDigestDue(null), "first delivery due");
assert(!isQuarterlyDigestDue("2026-04-01T00:00:00.000Z", 90, now), "recent delivery not due");
assert(isQuarterlyDigestDue("2026-01-01T00:00:00.000Z", 90, now), "old delivery due");

const pack = buildQuarterlyObligationCommitteeDigestFromParts({
  orgId: "org-1",
  horizonDays: 90,
  forecast: {
    version: "zentro-board-obligation-forecast/1",
    generatedAt: "2026-05-20T00:00:00.000Z",
    orgId: "org-1",
    horizonDays: 90,
    forecastWeekCount: 13,
    weekKeys: [],
    buckets: [],
    peakWeekKey: "2026-06-02",
    peakWeekCount: 8,
    totalForecastObligations: 12,
    currentOverdue: 2,
    currentDueSoon: 3,
    committeeSummary: "Peak week 2026-06-02 with 8 obligations.",
    milestones: [],
  },
  crossover: {
    version: "zentro-obligation-crossover-report/1",
    generatedAt: "2026-05-20T00:00:00.000Z",
    orgId: "org-1",
    horizonDays: 90,
    dueWindowDays: 7,
    totalObligations: 12,
    multiFrameworkObligationCount: 4,
    crossoverClusterCount: 2,
    sharedDueWindowCount: 1,
    frameworkPairs: [],
    entries: [],
    clusters: [
      {
        id: "cluster-1",
        kind: "shared_control",
        theme: "cross_framework_control_link",
        windowStart: "2026-05-20",
        windowEnd: "2026-05-24",
        controlIds: ["soc2:CC6.1"],
        controlRefs: ["CC6.1"],
        frameworks: ["soc2", "iso27001"],
        obligationIds: ["a"],
        obligationCount: 2,
        overdueCount: 1,
        evidenceReuseNote: "Collect once.",
      },
    ],
    topReuseOpportunities: [],
  },
  sla: {
    version: "zentro-evidence-request-sla-dashboard/1",
    generatedAt: "2026-05-20T00:00:00.000Z",
    orgId: "org-1",
    atRiskDays: 3,
    totalCount: 5,
    openCount: 3,
    overdueCount: 1,
    atRiskCount: 1,
    onTrackCount: 1,
    fulfilledCount: 2,
    cancelledCount: 0,
    fulfillmentRatePercent: 40,
    onTimeFulfillmentPercent: 100,
    avgFulfillmentDays: 2,
    overdueQueue: [],
    atRiskQueue: [],
    assigneeSummaries: [],
    frameworkSummaries: [],
    auditorDigestPreview: "",
  },
  lastDeliveryAt: "2026-01-01T00:00:00.000Z",
  orgName: "Acme Corp",
});

assert(pack.quarterlyDue, "pack marks quarterly due");
assert(pack.digestPreviewMarkdown.includes("Forecast timeline"), "markdown sections");
assert(pack.digestPreviewMarkdown.includes("Crossover clusters"), "crossover in markdown");

const payload = buildCommitteeDigestPayload(
  {
    orgId: "org-1",
    generatedAt: pack.generatedAt,
    horizonDays: 90,
    forecast: pack.forecast,
    crossover: pack.crossover,
    sla: pack.sla,
  },
  "https://zentro.run",
);

assert(payload.type === "zentro.obligation_committee_digest", "payload type");
assert(payload.forecast.peakWeekCount === 8, "payload peak");
assert(payload.crossover.clusterCount === 2, "payload crossover");
assert(payload.sla.overdue === 1, "payload sla");

const csv = committeeDigestToCsv(pack);
assert(csv.includes("forecast,peak_week_count,8"), "csv peak row");

assert(
  isPathAllowedForAuditor("/governance/compliance/committee-digest"),
  "auditor may view committee digest",
);

assert(QUARTERLY_OBLIGATION_COMMITTEE_DIGEST_VERSION.includes("committee"), "version id");

console.log("test-quarterly-obligation-committee-digest: ok");
