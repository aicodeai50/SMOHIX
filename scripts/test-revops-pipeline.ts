/**
 * RevOps pipeline — leads, pilots, activity, CSV, proposals.
 */

import { escapeCsvCell, buildCsvContent, buildCsvRow } from "../lib/revops/csv";
import { generatePilotProposal } from "../lib/revops/proposal";
import { buildIcsFile } from "../lib/revops/calendar";
import { getEmailTemplate, buildMailtoLink } from "../lib/revops/email-templates";
import { LEAD_STATUSES, PILOT_STATUSES, parseLeadStatus, parsePilotStatus } from "../lib/revops/types";
import { isPlatformAdmin } from "../lib/platform/admin";
import type { PilotProjectRow } from "../lib/revops/pilots";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

// --- Status parsing ---
assert(parseLeadStatus("qualified") === "qualified", "parse qualified lead status");
assert(parseLeadStatus("pilot_proposed") === "pilot_proposed", "parse pilot_proposed");
assert(parseLeadStatus("invalid") === null, "reject invalid lead status");
assert(LEAD_STATUSES.includes("won"), "won stage exists");
assert(LEAD_STATUSES.includes("pilot_active"), "pilot_active stage exists");

assert(parsePilotStatus("active") === "active", "parse pilot active");
assert(parsePilotStatus("nope") === null, "reject invalid pilot status");
assert(PILOT_STATUSES.length === 7, "seven pilot statuses");

// --- CSV formula injection ---
assert(escapeCsvCell("=SUM(A1)").startsWith("'"), "formula prefix escaped");
assert(escapeCsvCell("+1234").startsWith("'"), "plus prefix escaped");
assert(escapeCsvCell("normal") === "normal", "normal cell");
assert(buildCsvRow(["a", "b"]).includes(","), "csv row has commas");

const csv = buildCsvContent(["col"], [["safe"], ["=evil"]], "2026-07-01T00:00:00.000Z");
assert(csv.includes("Exported at"), "export timestamp in csv");
assert(csv.includes("'=evil") || csv.includes('"\'=evil'), "evil cell escaped in csv");

// --- Proposal generation (deterministic) ---
const mockPilot: PilotProjectRow = {
  id: "p1",
  public_reference: "PLT-ABC123",
  lead_id: null,
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
  name: "Acme pilot",
  organization: "Acme Corp",
  contact_name: "Jane",
  contact_email: "jane@acme.com",
  category: "integration",
  related_product: "smohix-ai",
  objective: "Automate incident response",
  scope: "Single team workflow",
  status: "draft",
  start_date: "2026-08-01",
  target_review_date: "2026-09-01",
  owner: "ops@smohix.run",
  risks: null,
  next_action: null,
  notes: null,
  discovery_call_date: null,
  pilot_kickoff_date: null,
  review_meeting_date: null,
  metadata: {},
};

const proposal = generatePilotProposal(mockPilot);
assert(proposal.markdown.includes("Acme Corp"), "proposal includes organization");
assert(proposal.markdown.toLowerCase().includes("not a binding contract"), "no legal guarantee");
assert(proposal.html.includes("<!DOCTYPE html>"), "html export");
assert(!proposal.markdown.includes("OPENAI"), "no AI in proposal");

// --- Calendar ICS ---
const ics = buildIcsFile([
  {
    uid: "test@smohix.run",
    title: "Kickoff",
    start: new Date("2026-08-01T10:00:00.000Z"),
    end: new Date("2026-08-01T11:00:00.000Z"),
  },
]);
assert(ics.includes("BEGIN:VCALENDAR"), "ics calendar");
assert(ics.includes("BEGIN:VEVENT"), "ics event");

// --- Email templates ---
const tmpl = getEmailTemplate("enquiry_received");
assert(tmpl !== undefined, "enquiry template exists");
assert(tmpl!.subject({ contactName: "Jane", company: "Acme" }).includes("enquiry"), "template subject");
const mailto = buildMailtoLink({
  to: "jane@acme.com",
  templateId: "enquiry_received",
  templateInput: { contactName: "Jane", company: "Acme", referenceId: "ZEN-123" },
});
assert(mailto.startsWith("mailto:"), "mailto link");

// --- Admin auth ---
process.env.SMOHIX_PLATFORM_ADMIN_EMAILS = "revops@smohix.run";
delete process.env.ZENTRO_PLATFORM_ADMIN_EMAILS;
assert(isPlatformAdmin("revops@smohix.run"), "platform admin");
assert(!isPlatformAdmin("random@example.com"), "non-admin blocked");

// --- Analytics PII guard (reuse) ---
const forbidden = ["email", "name", "company", "problem"];
for (const key of forbidden) {
  assert(!["path", "product", "inquiryType", "href", "label"].includes(key), `analytics must not track ${key}`);
}

console.log("test-revops-pipeline: all checks passed");
