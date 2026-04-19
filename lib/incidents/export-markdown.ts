import type { IncidentDetail } from "@/lib/incidents/types";

function esc(s: string): string {
  return s.replace(/\|/g, "\\|");
}

/** Markdown export for sharing / archives (no secrets). */
export function incidentDetailToMarkdown(row: IncidentDetail): string {
  const lines: string[] = [
    `# Incident: ${esc(row.title)}`,
    "",
    "| Field | Value |",
    "| --- | --- |",
    `| Id | \`${esc(row.id)}\` |`,
    `| Severity | ${esc(row.severity)} |`,
    `| Status | ${esc(row.status)} |`,
    `| Updated | ${esc(row.updated)} |`,
  ];
  if (row.serviceName) {
    lines.push(`| Service | ${esc(row.serviceName)} |`);
  }
  if (row.ownerHint) {
    lines.push(`| Owner / on-call | ${esc(row.ownerHint)} |`);
  }
  if (row.runbookSlug) {
    const title = row.runbookTitle ?? row.runbookSlug;
    lines.push(`| Runbook | [${esc(title)}](/runbooks/${esc(row.runbookSlug)}) |`);
  }
  lines.push("", "## Postmortem & notes", "");
  lines.push(row.postmortem?.trim() ? row.postmortem.trim() : "_No notes yet._");
  lines.push("");
  return lines.join("\n");
}
