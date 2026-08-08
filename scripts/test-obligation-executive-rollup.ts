import {
  buildObligationExecutiveBoardSummary,
  buildObligationExecutiveRollupFromParts,
  buildObligationExecutiveRollupHtml,
  obligationExecutiveRollupToCsv,
  OBLIGATION_EXECUTIVE_ROLLUP_VERSION,
} from "../lib/compliance/obligation-executive-rollup";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const forecast = {
  version: "smohix-board-obligation-forecast/1" as const,
  generatedAt: "2026-05-20T00:00:00.000Z",
  orgId: "org-1",
  horizonDays: 90,
  forecastWeekCount: 13,
  weekKeys: ["2026-05-19"],
  buckets: [
    {
      weekKey: "2026-05-19",
      weekLabel: "2026-05-19 → 2026-05-25",
      isCurrentWeek: true,
      totalCount: 5,
      overdueCount: 1,
      dueSoonCount: 2,
      upcomingCount: 2,
      densityScore: 50,
      byFramework: [],
    },
  ],
  peakWeekKey: "2026-06-02",
  peakWeekCount: 8,
  totalForecastObligations: 10,
  currentOverdue: 1,
  currentDueSoon: 2,
  committeeSummary: "Peak week 2026-06-02.",
  milestones: [{ dueAt: "2026-05-22", title: "SOC review", urgency: "due_soon" as const, dimension: "assessor" as const, href: "/x", framework: "soc2" as const }],
};

const crossover = {
  version: "smohix-obligation-crossover-report/1" as const,
  generatedAt: "2026-05-20T00:00:00.000Z",
  orgId: "org-1",
  horizonDays: 90,
  dueWindowDays: 7,
  totalObligations: 10,
  multiFrameworkObligationCount: 3,
  crossoverClusterCount: 1,
  sharedDueWindowCount: 0,
  frameworkPairs: [],
  entries: [],
  clusters: [],
  topReuseOpportunities: [],
};

const consolidation = {
  version: "smohix-obligation-consolidation-playbook/1" as const,
  generatedAt: "2026-05-20T00:00:00.000Z",
  orgId: "org-1",
  horizonDays: 90,
  crossoverClusterCount: 1,
  workflowCount: 1,
  stats: { planned: 0, inProgress: 1, collected: 0, verified: 0, dismissed: 0, tracked: 1 },
  workflows: [],
};

const sla = {
  version: "smohix-evidence-request-sla-dashboard/1" as const,
  generatedAt: "2026-05-20T00:00:00.000Z",
  orgId: "org-1",
  atRiskDays: 3,
  totalCount: 4,
  openCount: 2,
  overdueCount: 1,
  atRiskCount: 1,
  onTrackCount: 0,
  fulfilledCount: 2,
  cancelledCount: 0,
  fulfillmentRatePercent: 50,
  onTimeFulfillmentPercent: 100,
  avgFulfillmentDays: 2,
  overdueQueue: [
    {
      requestId: "r1",
      title: "Policy",
      controlRef: "CC1.2",
      frameworkLabel: "SOC 2",
      status: "overdue" as const,
      slaBucket: "overdue" as const,
      dueAt: "2026-05-01",
      daysUntilDue: -19,
      daysOverdue: 19,
      assignedToLabel: null,
      requestedByLabel: "Auditor",
      href: "/x",
    },
  ],
  atRiskQueue: [],
  assigneeSummaries: [],
  frameworkSummaries: [],
  auditorDigestPreview: "",
};

const pack = buildObligationExecutiveRollupFromParts({
  orgId: "org-1",
  orgName: "Acme",
  horizonDays: 90,
  forecast,
  crossover,
  consolidation,
  sla,
});

assert(pack.boardSummary.includes("Peak week"), "board summary");
assert(pack.version === OBLIGATION_EXECUTIVE_ROLLUP_VERSION, "version");

const html = buildObligationExecutiveRollupHtml({
  orgName: "Acme",
  horizonDays: 90,
  generatedAt: pack.generatedAt,
  forecast: pack.forecast,
  crossover: pack.crossover,
  consolidation: pack.consolidation,
  sla: pack.sla,
  boardSummary: pack.boardSummary,
});

assert(html.includes("Obligation executive rollup"), "html title");
assert(html.includes("@media print"), "print styles");
assert(html.includes("Forecast timeline"), "forecast section");
assert(html.includes("SLA breaches"), "sla section");

const csv = obligationExecutiveRollupToCsv(pack);
assert(csv.includes("sla,overdue,1"), "csv sla");

const summaryOnly = buildObligationExecutiveBoardSummary({
  forecast: null,
  crossover: null,
  consolidation: null,
  sla: null,
});
assert(summaryOnly.includes("No elevated"), "empty summary");

assert(isPathAllowedForAuditor("/governance/compliance/obligation-rollup"), "auditor path");

console.log("test-obligation-executive-rollup: ok");
