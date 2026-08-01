import type { ExtendedLeadRow } from "./leads";
import type { PilotProjectRow } from "./pilots";

export type ProposalDocument = {
  markdown: string;
  html: string;
  title: string;
};

function section(title: string, body: string): string {
  return `## ${title}\n\n${body.trim()}\n`;
}

export function generatePilotProposal(
  pilot: PilotProjectRow,
  lead?: ExtendedLeadRow | null,
): ProposalDocument {
  const title = `Pilot proposal — ${pilot.organization}`;
  const problem = lead?.problem_summary ?? pilot.objective ?? "To be confirmed with the customer.";
  const objective =
    pilot.objective ??
    "Define a measurable outcome for the pilot engagement with clear success criteria.";
  const scope =
    pilot.scope ??
    "Scope will be finalized during discovery. This draft reflects information captured at intake.";
  const deliverables = [
    "Pilot charter document (this proposal)",
    "Configured environment or integration path agreed in discovery",
    "Weekly check-in cadence for the pilot duration",
    "Pilot review summary with recommendations",
  ];
  const responsibilities = [
    "**Zentro:** technical guidance, scoped configuration support, and pilot review.",
    "**Customer:** timely access to stakeholders, test data where needed, and feedback on milestones.",
  ];
  const assumptions = [
    "Pilot work uses non-production or agreed isolated environments unless otherwise documented.",
    "No production SLA is implied during the pilot phase.",
    "Third-party systems require customer-provided credentials and approvals.",
  ];
  const securityNotes = [
    "Data handling follows Zentro privacy commitments at zentro.run/privacy.",
    "Connector URLs and credentials remain customer-controlled.",
    "This document is not a legal agreement or compliance attestation.",
  ];
  const successCriteria = [
    "Agreed objective demonstrably met or gap analysis documented",
    "Key integration or workflow validated with customer sign-off",
    "Decision recorded: proceed, extend, or conclude",
  ];
  const nextSteps = [
    "Confirm discovery call and stakeholders",
    "Finalize scope and timeline",
    "Execute pilot kickoff",
    "Schedule target review date",
  ];

  const md = [
    `# ${title}`,
    "",
    `**Reference:** ${pilot.public_reference}`,
    `**Status:** ${pilot.status}`,
    `**Organization:** ${pilot.organization}`,
    `**Contact:** ${pilot.contact_name} (${pilot.contact_email})`,
    pilot.category ? `**Category:** ${pilot.category}` : "",
    pilot.related_product ? `**Product context:** ${pilot.related_product}` : "",
    pilot.start_date ? `**Target start:** ${pilot.start_date}` : "",
    pilot.target_review_date ? `**Target review:** ${pilot.target_review_date}` : "",
    "",
    section("Problem statement", problem),
    section("Objective", objective),
    section("Scope", scope),
    section("Deliverables", deliverables.map((d) => `- ${d}`).join("\n")),
    section("Responsibilities", responsibilities.join("\n")),
    section("Assumptions", assumptions.map((a) => `- ${a}`).join("\n")),
    section("Security and privacy notes", securityNotes.map((s) => `- ${s}`).join("\n")),
    section("Success criteria", successCriteria.map((s) => `- ${s}`).join("\n")),
    section("Next steps", nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")),
    "",
    "---",
    "",
    "*Draft generated from Zentro RevOps data. Review and edit before sharing. Not a binding contract.*",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; line-height: 1.5; color: #111; }
  h1 { font-size: 1.5rem; }
  h2 { font-size: 1.1rem; margin-top: 1.5rem; border-bottom: 1px solid #ddd; padding-bottom: 0.25rem; }
  .meta { color: #555; font-size: 0.9rem; }
  .footer { margin-top: 2rem; font-size: 0.85rem; color: #666; }
  @media print { body { margin: 1cm; } }
</style>
</head>
<body>
${markdownToSimpleHtml(md)}
<p class="footer">Draft generated from Zentro RevOps. Review before sharing. Not a binding contract.</p>
</body>
</html>`;

  return { markdown: md, html, title };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function markdownToSimpleHtml(md: string): string {
  return md
    .split("\n")
    .map((line) => {
      if (line.startsWith("# ")) return `<h1>${escapeHtml(line.slice(2))}</h1>`;
      if (line.startsWith("## ")) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
      if (line.startsWith("- ")) return `<li>${inlineFormat(escapeHtml(line.slice(2)))}</li>`;
      if (/^\d+\.\s/.test(line)) return `<li>${inlineFormat(escapeHtml(line.replace(/^\d+\.\s/, "")))}</li>`;
      if (line.startsWith("**") && line.includes(":")) return `<p class="meta">${inlineFormat(escapeHtml(line))}</p>`;
      if (line.trim() === "") return "";
      if (line.startsWith("---")) return "<hr/>";
      if (line.startsWith("*") && line.endsWith("*")) return `<p class="footer">${escapeHtml(line.slice(1, -1))}</p>`;
      return `<p>${inlineFormat(escapeHtml(line))}</p>`;
    })
    .join("\n");
}

function inlineFormat(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}
