/**
 * Operations workflow soft-link helpers.
 * Run: npx --yes tsx scripts/test-ops-workflow.ts
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  approvalsHrefForIncident,
  attachIncidentTokenToPolicyHint,
  automationsHrefForIncident,
  copilotHrefForIncident,
  extractIncidentIdFromApprovalContext,
  isIncidentUuid,
  newIncidentHrefForService,
  servicesHrefForService,
  withIncidentIdOnBrief,
} from "../lib/workflow/incident-links";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function read(rel: string): string {
  return readFileSync(path.join(root, rel), "utf8");
}

const sampleId = "a1b2c3d4-e5f6-4718-9abc-def012345678";
assert(isIncidentUuid(sampleId), "uuid recognition");
assert(!isIncidentUuid("not-a-uuid"), "rejects non-uuid");

const hint = attachIncidentTokenToPolicyHint("two-person | change window", sampleId);
assert(hint.includes("incident:"), "token attached");
assert(
  extractIncidentIdFromApprovalContext({ policyHint: hint }) === sampleId,
  "extract from policy hint",
);
assert(
  extractIncidentIdFromApprovalContext({
    decisionBriefJson: { riskScore: 1, incident_id: sampleId },
  }) === sampleId,
  "extract from brief",
);

const brief = withIncidentIdOnBrief({ riskScore: 40, confidenceScore: 50 }, sampleId);
assert(brief.incident_id === sampleId, "brief merge");

assert(newIncidentHrefForService("svc-1").includes("service_id=svc-1"), "service→incident href");
assert(approvalsHrefForIncident(sampleId).includes(`incident=${sampleId}`), "approvals href");
assert(automationsHrefForIncident(sampleId).includes(`incident=${sampleId}`), "automations href");
assert(copilotHrefForIncident(sampleId).includes(`incident=${sampleId}`), "copilot href");
assert(servicesHrefForService("svc-9").includes("#service-svc-9"), "service deep link");

const servicesPage = read("app/(app)/services/page.tsx");
assert(servicesPage.includes("newIncidentHrefForService") || servicesPage.includes("incidents/new?service_id="), "services create-incident CTA");

const incidentPage = read("app/(app)/incidents/[id]/page.tsx");
assert(incidentPage.includes("Next actions") || incidentPage.includes("workflow"), "incident workflow strip");
assert(incidentPage.includes("approvalsHrefForIncident") || incidentPage.includes("/approvals?incident="), "incident→approvals");
assert(incidentPage.includes("Ask Copilot") || incidentPage.includes("Open scoped Copilot"), "incident→copilot");

const approvalsPage = read("app/(app)/approvals/page.tsx");
assert(approvalsPage.includes("incident"), "approvals accepts incident context");
assert(approvalsPage.includes("extractIncidentIdFromApprovalContext") || approvalsPage.includes("Open incident"), "approvals backlink");

const approvalsActions = read("app/(app)/approvals/actions.ts");
assert(approvalsActions.includes("attachIncidentTokenToPolicyHint") || approvalsActions.includes("incident_id"), "approval create stores incident");

const timeline = read("lib/incidents/timeline.ts");
assert(timeline.includes("automation.dry_run") || timeline.includes("approval.requested"), "timeline includes workflow events");

console.log("test-ops-workflow: all checks passed");
