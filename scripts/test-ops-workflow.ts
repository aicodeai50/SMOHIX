/**
 * Operations workflow soft-link helpers + Phase 17 UX contracts.
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
  formatPolicyHintForDisplay,
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
assert(
  extractIncidentIdFromApprovalContext({
    actionLabel: `Guarded change for incident ${sampleId}`,
  }) === sampleId,
  "extract bare incident uuid from action",
);

const display = formatPolicyHintForDisplay(
  `two-person approval | change window | incident:${sampleId} | risk:high | requires:two-person`,
);
assert(!display.includes("incident:"), "display strips incident token");
assert(!display.toLowerCase().includes("risk:"), "display strips risk token");
assert(display.includes("two-person") || display.includes("change window"), "keeps human policy text");

const brief = withIncidentIdOnBrief({ riskScore: 40, confidenceScore: 50 }, sampleId);
assert(brief.incident_id === sampleId, "brief merge");

assert(newIncidentHrefForService("svc-1").includes("service_id=svc-1"), "service→incident href");
assert(approvalsHrefForIncident(sampleId).includes(`incident=${sampleId}`), "approvals href");
assert(automationsHrefForIncident(sampleId).includes(`incident=${sampleId}`), "automations href");
assert(copilotHrefForIncident(sampleId).includes(`incident=${sampleId}`), "copilot href");
assert(servicesHrefForService("svc-9").includes("#service-svc-9"), "service deep link");

const servicesPage = read("app/(app)/services/page.tsx");
assert(servicesPage.includes("Create incident"), "services create-incident CTA");
assert(servicesPage.includes("newIncidentHrefForService"), "services href helper");

const newIncidentPage = read("app/(app)/incidents/new/page.tsx");
assert(newIncidentPage.includes("Creating from service") || newIncidentPage.includes("Back to service"), "new incident service banner");

const incidentPage = read("app/(app)/incidents/[id]/page.tsx");
assert(incidentPage.includes("Next actions"), "incident workflow strip");
assert(incidentPage.includes("approvalsHrefForIncident"), "incident→approvals");
assert(incidentPage.includes("Ask Copilot"), "incident→copilot");
assert(!incidentPage.includes("audit_log"), "no raw audit_log copy");

const approvalsPage = read("app/(app)/approvals/page.tsx");
assert(approvalsPage.includes("formatPolicyHintForDisplay"), "approvals sanitize policy display");
assert(approvalsPage.includes("Open incident"), "approvals backlink");
assert(approvalsPage.includes("linkedIncidentId"), "approvals row soft-link field");

const approvalsData = read("lib/approvals/data.ts");
assert(approvalsData.includes("linkedIncidentId"), "mapRow sets linkedIncidentId");

const approvalsActions = read("app/(app)/approvals/actions.ts");
assert(approvalsActions.includes("attachIncidentTokenToPolicyHint"), "approval create stores incident");

const automations = read("components/automations/AutomationsConsole.tsx");
assert(automations.includes("Back to incident"), "automations incident backlink");
assert(!automations.includes("audit payload"), "no audit payload jargon");

const copilotPage = read("app/(app)/copilot/page.tsx");
assert(copilotPage.includes("Incident context"), "copilot incident banner");

const timeline = read("lib/incidents/timeline.ts");
assert(timeline.includes("automation.dry_run") || timeline.includes("approval.requested"), "timeline includes workflow events");

console.log("test-ops-workflow: all checks passed");
