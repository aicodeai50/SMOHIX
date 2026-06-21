import { listIncidentCommandEvents } from "@/lib/incidents/command-loop";
import { getIncidentForUser } from "@/lib/incidents/data";
import { getIncidentTimeline } from "@/lib/incidents/timeline";
import { getOrgContextForUser } from "@/lib/org/context";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function buildIncidentCopilotContext(input: {
  incidentId: string;
  userId: string;
}): Promise<string | null> {
  const orgContext = await getOrgContextForUser(input.userId);
  const resolved = await getIncidentForUser(input.userId, input.incidentId, null, orgContext.orgId);
  if (!resolved || resolved.source !== "database") {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const deployQuery = supabase
    .from("change_deploy_events")
    .select("provider, deployment_id, commit_sha, environment, status, summary, occurred_at")
    .or(
      `incident_id.eq.${input.incidentId}${
        resolved.row.serviceId ? `,service_id.eq.${resolved.row.serviceId}` : ""
      }`,
    )
    .order("occurred_at", { ascending: false })
    .limit(6);

  const [timeline, commandEvents, deployEvents] = await Promise.all([
    getIncidentTimeline({
      source: "database",
      userId: input.userId,
      incidentId: input.incidentId,
      devTenantKey: null,
      orgId: orgContext.orgId,
    }),
    listIncidentCommandEvents(supabase, input.incidentId),
    deployQuery.then((res) => (res.error ? [] : res.data ?? [])),
  ]);

  const incident = resolved.row;
  const timelineLines = timeline
    .slice(0, 8)
    .map((entry) => `- ${entry.at} UTC: ${entry.label}`);
  const commandLines = commandEvents
    .slice(0, 6)
    .map((event) => `- ${event.eventType}: ${event.body.slice(0, 500)}`);
  const deployLines = deployEvents.map((event) => {
    const sha = event.commit_sha ? ` ${String(event.commit_sha).slice(0, 8)}` : "";
    const deployId = event.deployment_id ? ` ${event.deployment_id}` : "";
    return `- ${event.occurred_at}: ${event.provider}${deployId}${sha} ${event.status} (${event.environment ?? "env n/a"}) — ${event.summary}`;
  });

  return [
    "Use this incident context when answering. Be concise, cite uncertainty, and keep human approval gates explicit.",
    "",
    `Incident: ${incident.title}`,
    `ID: ${incident.id}`,
    `Severity: ${incident.severity}`,
    `Status: ${incident.status}`,
    `Service: ${incident.serviceName ?? "unlinked"}`,
    `Owner: ${incident.ownerHint ?? "unassigned"}`,
    `Assigned user: ${incident.assignedUserId ?? "unassigned"}`,
    `Runbook: ${incident.runbookTitle ?? incident.runbookSlug ?? "unlinked"}`,
    "",
    "Recent timeline:",
    timelineLines.length > 0 ? timelineLines.join("\n") : "- No audited timeline events yet.",
    "",
    "Responder notes:",
    commandLines.length > 0 ? commandLines.join("\n") : "- No command-loop notes yet.",
    "",
    "Recent deploy/change events:",
    deployLines.length > 0 ? deployLines.join("\n") : "- No deploy or change events linked yet.",
  ].join("\n");
}
