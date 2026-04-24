import type { AuditDisplayRow } from "@/lib/audit/types";
import type { AuditWhisper } from "@/lib/audit/whispers";
import type { DryRunRecord } from "@/lib/automations/runs-dev";
import type { IncidentDetail } from "@/lib/incidents/types";
import type { IncidentTimelineEntry } from "@/lib/incidents/timeline";

function esc(s: string): string {
  return s.replace(/\|/g, "\\|");
}

function section(title: string): string[] {
  return ["", `## ${title}`, ""];
}

export function incidentReviewToMarkdown(input: {
  incident: IncidentDetail;
  timeline: IncidentTimelineEntry[];
  latestDryRun: DryRunRecord | null;
  latestWhisper: AuditWhisper | null;
  auditRows: AuditDisplayRow[];
}): string {
  const { incident, timeline, latestDryRun, latestWhisper, auditRows } = input;

  const lines: string[] = [
    `# Post-Incident Review: ${esc(incident.title)}`,
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "| Field | Value |",
    "| --- | --- |",
    `| Incident ID | \`${esc(incident.id)}\` |`,
    `| Severity | ${esc(incident.severity)} |`,
    `| Status | ${esc(incident.status)} |`,
    `| Updated | ${esc(incident.updated)} |`,
    `| Owner | ${incident.ownerHint ? esc(incident.ownerHint) : "—"} |`,
    `| Runbook | ${incident.runbookTitle ? esc(incident.runbookTitle) : incident.runbookSlug ? esc(incident.runbookSlug) : "—"} |`,
    `| Service | ${incident.serviceName ? esc(incident.serviceName) : "—"} |`,
  ];

  lines.push(...section("Incident Narrative"));
  lines.push(
    incident.postmortem?.trim()
      ? incident.postmortem.trim()
      : "_No postmortem notes captured yet._",
  );

  lines.push(...section("Timeline"));
  if (timeline.length === 0) {
    lines.push("_No timeline events captured yet._");
  } else {
    for (const entry of timeline) {
      lines.push(`- ${entry.at} — ${entry.label}`);
    }
  }

  lines.push(...section("Execution Evidence"));
  if (latestDryRun) {
    lines.push(
      `- Latest dry-run: \`${latestDryRun.playbookId}\` at ${latestDryRun.at} (${latestDryRun.ok ? "ok" : "failed"})`,
    );
    if (latestDryRun.detail) {
      lines.push(`- Dry-run detail: ${latestDryRun.detail}`);
    }
  } else {
    lines.push("- Latest dry-run: _none_");
  }

  if (latestWhisper) {
    lines.push(
      `- Latest audit whisper: ${latestWhisper.atLabel} | ${latestWhisper.eventType} | ${latestWhisper.summary}`,
    );
  } else {
    lines.push("- Latest audit whisper: _none_");
  }

  lines.push(...section("Audit Trail Snapshot"));
  if (auditRows.length === 0) {
    lines.push("_No incident-linked audit rows found._");
  } else {
    for (const row of auditRows.slice(0, 25)) {
      lines.push(`- ${row.ts} — ${row.action} — ${row.target}`);
    }
    if (auditRows.length > 25) {
      lines.push(`- ... ${auditRows.length - 25} more row(s) not shown`);
    }
  }

  lines.push(...section("Recommendations"));
  lines.push("- Confirm follow-up tasks are tracked and owned.");
  lines.push("- Validate guardrails/policy coverage for this incident type.");
  lines.push("- Link this review in your team retrospective notes.");
  lines.push("");

  return lines.join("\n");
}
