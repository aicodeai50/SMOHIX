import { hashApiKeyPlaintext } from "@/lib/api-keys/token";
import { isRunbookSlugValid } from "@/lib/runbooks/catalog";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import type { IncidentSeverity } from "@/lib/incidents/types";

const SEVERITIES = new Set<IncidentSeverity>(["low", "medium", "high", "critical"]);

const STATUSES = new Set([
  "investigating",
  "mitigated",
  "resolved",
  "monitoring",
]);

export type AlertIngestPayload = {
  title?: unknown;
  severity?: unknown;
  status?: unknown;
  summary?: unknown;
  service_id?: unknown;
  service_name?: unknown;
  dedupe_key?: unknown;
  owner_hint?: unknown;
  runbook_slug?: unknown;
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function vendorSeverityToShynvo(value: string): IncidentSeverity {
  const v = value.trim().toLowerCase();
  if (v === "critical" || v === "error" || v === "fatal" || v === "p1" || v === "sev1") {
    return "critical";
  }
  if (v === "high" || v === "warn" || v === "warning" || v === "p2" || v === "sev2") {
    return "high";
  }
  if (v === "info" || v === "informational" || v === "notice" || v === "p3" || v === "sev3") {
    return "medium";
  }
  if (v === "low" || v === "debug" || v === "p4" || v === "sev4") {
    return "low";
  }
  return "medium";
}

function statusFromDatadogPayload(payload: Record<string, unknown>): string {
  const alertType =
    typeof payload.alert_type === "string" ? payload.alert_type.trim().toLowerCase() : "";
  if (alertType === "success" || alertType === "info" || alertType === "ok") {
    return "resolved";
  }
  return "investigating";
}

function parseDatadogTagsForNormalized(tags: unknown): {
  serviceName: string | null;
  ownerHint: string | null;
  runbookSlug: string | null;
} {
  const tagList = Array.isArray(tags)
    ? tags.filter((v): v is string => typeof v === "string")
    : [];
  let serviceName: string | null = null;
  let ownerHint: string | null = null;
  let runbookSlug: string | null = null;

  for (const tag of tagList) {
    const [kRaw, ...rest] = tag.split(":");
    if (!kRaw || rest.length === 0) continue;
    const key = kRaw.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (!value) continue;
    if (!serviceName && (key === "service" || key === "svc")) {
      serviceName = value.slice(0, 200);
      continue;
    }
    if (!ownerHint && (key === "owner" || key === "team")) {
      ownerHint = value.slice(0, 200);
      continue;
    }
    if (!runbookSlug && (key === "runbook" || key === "runbook_slug")) {
      runbookSlug = isRunbookSlugValid(value) ? value : null;
      continue;
    }
  }

  return { serviceName, ownerHint, runbookSlug };
}

function firstLabel(
  labels: Record<string, unknown>,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = labels[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function normalizePrometheusSeverity(value: string | null): IncidentSeverity {
  if (!value) return "medium";
  const v = value.trim().toLowerCase();
  if (v === "critical" || v === "page" || v === "p1" || v === "sev1") return "critical";
  if (v === "high" || v === "warning" || v === "warn" || v === "p2" || v === "sev2") return "high";
  if (v === "low" || v === "info" || v === "p3" || v === "p4" || v === "sev3" || v === "sev4") return "low";
  return "medium";
}

function normalizePrometheusPayload(obj: Record<string, unknown>): AlertIngestPayload {
  const alerts = Array.isArray(obj.alerts)
    ? obj.alerts.filter((a): a is Record<string, unknown> => Boolean(asObject(a)))
    : [];
  const first = alerts.length > 0 ? alerts[0] : null;
  const labels = first ? asObject(first.labels) ?? {} : {};
  const annotations = first ? asObject(first.annotations) ?? {} : {};

  const statusRaw = typeof obj.status === "string" ? obj.status.trim().toLowerCase() : "";
  const status = statusRaw === "resolved" ? "resolved" : "investigating";

  const alertName = firstLabel(labels, ["alertname", "rule", "name"]) ?? "Prometheus alert";
  const summary =
    firstLabel(annotations, ["summary", "description", "message"]) ??
    (typeof first?.startsAt === "string" ? `Started: ${first.startsAt}` : "");
  const serviceName = firstLabel(labels, ["service", "job", "app", "component"]);
  const ownerHint = firstLabel(labels, ["owner", "team"]);
  const runbookSlugRaw = firstLabel(labels, ["runbook", "runbook_slug"]);
  const runbookSlug = runbookSlugRaw && isRunbookSlugValid(runbookSlugRaw) ? runbookSlugRaw : null;
  const severity = normalizePrometheusSeverity(firstLabel(labels, ["severity", "priority"]));

  const fingerprint =
    first && typeof first.fingerprint === "string" && first.fingerprint.trim()
      ? first.fingerprint.trim()
      : null;
  const dedupe = fingerprint ? `prometheus:${fingerprint}` : null;

  return {
    title: alertName,
    severity,
    status,
    summary: summary.slice(0, 12000),
    service_name: serviceName,
    owner_hint: ownerHint,
    runbook_slug: runbookSlug,
    dedupe_key: dedupe ?? undefined,
  };
}

function normalizePagerDutySeverity(value: string | null, urgency: string | null): IncidentSeverity {
  const sev = (value ?? "").trim().toLowerCase();
  const urg = (urgency ?? "").trim().toLowerCase();
  if (sev === "critical" || urg === "high") return "critical";
  if (sev === "error" || sev === "high") return "high";
  if (sev === "warning" || sev === "warn") return "medium";
  if (sev === "info" || sev === "low") return "low";
  return "medium";
}

function normalizePagerDutyPayload(obj: Record<string, unknown>): AlertIngestPayload {
  const payload = asObject(obj.payload) ?? {};
  const customDetails = asObject(payload.custom_details) ?? {};

  const summary =
    typeof payload.summary === "string" && payload.summary.trim()
      ? payload.summary.trim()
      : typeof obj.summary === "string" && obj.summary.trim()
        ? obj.summary.trim()
        : "PagerDuty event";

  const source =
    typeof payload.source === "string" && payload.source.trim() ? payload.source.trim() : null;
  const component =
    typeof payload.component === "string" && payload.component.trim() ? payload.component.trim() : null;
  const group = typeof payload.group === "string" && payload.group.trim() ? payload.group.trim() : null;
  const className =
    typeof payload.class === "string" && payload.class.trim() ? payload.class.trim() : null;

  const serviceName =
    (typeof customDetails.service_name === "string" ? customDetails.service_name.trim() : "") ||
    component ||
    source ||
    null;
  const ownerHint =
    (typeof customDetails.owner_hint === "string" ? customDetails.owner_hint.trim() : "") ||
    (typeof customDetails.team === "string" ? customDetails.team.trim() : "") ||
    null;
  const runbookRaw =
    typeof customDetails.runbook_slug === "string" ? customDetails.runbook_slug.trim() : "";
  const runbookSlug = runbookRaw && isRunbookSlugValid(runbookRaw) ? runbookRaw : null;

  const dedupeKey =
    (typeof obj.dedup_key === "string" && obj.dedup_key.trim()
      ? obj.dedup_key.trim()
      : typeof customDetails.dedupe_key === "string" && customDetails.dedupe_key.trim()
        ? customDetails.dedupe_key.trim()
        : "") || null;

  const eventAction =
    typeof obj.event_action === "string" ? obj.event_action.trim().toLowerCase() : "";
  const status =
    eventAction === "resolve" || eventAction === "resolved" ? "resolved" : "investigating";

  const severityRaw =
    typeof payload.severity === "string" ? payload.severity : null;
  const urgencyRaw =
    typeof payload.urgency === "string" ? payload.urgency : null;

  const extraSummary = [source ? `source: ${source}` : null, group ? `group: ${group}` : null, className ? `class: ${className}` : null]
    .filter(Boolean)
    .join("\n");

  return {
    title: summary.slice(0, 500),
    severity: normalizePagerDutySeverity(severityRaw, urgencyRaw),
    status,
    summary: [summary, extraSummary].filter(Boolean).join("\n").slice(0, 12000),
    service_name: serviceName ? serviceName.slice(0, 200) : undefined,
    owner_hint: ownerHint ? ownerHint.slice(0, 200) : undefined,
    runbook_slug: runbookSlug,
    dedupe_key: dedupeKey ? `pagerduty:${dedupeKey.slice(0, 480)}` : undefined,
  };
}

function normalizeNewRelicSeverity(value: string | null): IncidentSeverity {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "critical") return "critical";
  if (v === "high" || v === "major" || v === "error") return "high";
  if (v === "warning" || v === "medium") return "medium";
  if (v === "low" || v === "info") return "low";
  return "medium";
}

function normalizeNewRelicPayload(obj: Record<string, unknown>): AlertIngestPayload {
  const details = asObject(obj.details) ?? {};
  const labels = asObject(obj.labels) ?? {};
  const targets = Array.isArray(obj.targets)
    ? obj.targets.filter((t): t is Record<string, unknown> => Boolean(asObject(t)))
    : [];
  const firstTarget = targets.length > 0 ? targets[0] : null;

  const title =
    (typeof obj.condition_name === "string" && obj.condition_name.trim()) ||
    (typeof obj.title === "string" && obj.title.trim()) ||
    (typeof obj.policy_name === "string" && `${obj.policy_name}`.trim()) ||
    "New Relic alert";

  const currentState =
    typeof obj.current_state === "string" ? obj.current_state.trim().toLowerCase() : "";
  const status =
    currentState === "closed" || currentState === "resolved" ? "resolved" : "investigating";

  const summaryParts = [
    typeof obj.description === "string" ? obj.description.trim() : null,
    typeof details.incident_url === "string" ? `incident_url: ${details.incident_url}` : null,
    typeof obj.policy_name === "string" ? `policy: ${obj.policy_name}` : null,
    typeof obj.condition_name === "string" ? `condition: ${obj.condition_name}` : null,
  ].filter(Boolean);

  const serviceName =
    (typeof labels.service === "string" ? labels.service.trim() : "") ||
    (firstTarget && typeof firstTarget.label === "string" ? firstTarget.label.trim() : "") ||
    (firstTarget && typeof firstTarget.name === "string" ? firstTarget.name.trim() : "") ||
    null;

  const ownerHint =
    (typeof labels.team === "string" ? labels.team.trim() : "") ||
    (typeof obj.owner_hint === "string" ? obj.owner_hint.trim() : "") ||
    null;

  const runbookRaw =
    (typeof details.runbook_slug === "string" ? details.runbook_slug.trim() : "") ||
    (typeof labels.runbook === "string" ? labels.runbook.trim() : "");
  const runbookSlug = runbookRaw && isRunbookSlugValid(runbookRaw) ? runbookRaw : null;

  const dedupeBase =
    (typeof obj.incident_id === "number" || typeof obj.incident_id === "string"
      ? String(obj.incident_id)
      : "") ||
    (typeof details.violation_id === "number" || typeof details.violation_id === "string"
      ? String(details.violation_id)
      : "") ||
    null;

  const severityRaw =
    typeof obj.severity === "string"
      ? obj.severity
      : typeof obj.priority === "string"
        ? obj.priority
        : typeof details.priority === "string"
          ? details.priority
          : null;

  return {
    title: title.slice(0, 500),
    severity: normalizeNewRelicSeverity(severityRaw),
    status,
    summary: summaryParts.join("\n").slice(0, 12000),
    service_name: serviceName ? serviceName.slice(0, 200) : undefined,
    owner_hint: ownerHint ? ownerHint.slice(0, 200) : undefined,
    runbook_slug: runbookSlug,
    dedupe_key: dedupeBase ? `newrelic:${dedupeBase.slice(0, 480)}` : undefined,
  };
}

export function normalizeAlertIngestPayload(
  raw: unknown,
  sourceHint?: string | null,
): AlertIngestPayload {
  const obj = asObject(raw);
  if (!obj) {
    return raw as AlertIngestPayload;
  }

  const source = (sourceHint ?? "").toLowerCase();
  const explicitVendor =
    typeof obj.vendor === "string" ? obj.vendor.trim().toLowerCase() : null;
  const datadogHeader = source.includes("datadog");
  const datadogVendor = explicitVendor === "datadog";
  const datadogShape =
    typeof obj.alert_type === "string" ||
    typeof obj.priority === "string" ||
    Array.isArray(obj.tags);
  const prometheusHeader =
    source.includes("prometheus") || source.includes("grafana") || source.includes("alertmanager");
  const prometheusVendor =
    explicitVendor === "prometheus" ||
    explicitVendor === "grafana" ||
    explicitVendor === "alertmanager";
  const prometheusShape = Array.isArray(obj.alerts) && typeof obj.status === "string";
  const pagerdutyHeader = source.includes("pagerduty");
  const pagerdutyVendor = explicitVendor === "pagerduty";
  const pagerdutyShape =
    typeof obj.event_action === "string" &&
    (typeof obj.dedup_key === "string" || Boolean(asObject(obj.payload)));
  const newRelicHeader = source.includes("newrelic") || source.includes("new relic");
  const newRelicVendor = explicitVendor === "newrelic" || explicitVendor === "new_relic";
  const newRelicShape =
    typeof obj.current_state === "string" &&
    (typeof obj.condition_name === "string" ||
      typeof obj.incident_id === "string" ||
      typeof obj.incident_id === "number");

  if (prometheusHeader || prometheusVendor || prometheusShape) {
    return normalizePrometheusPayload(obj);
  }

  if (pagerdutyHeader || pagerdutyVendor || pagerdutyShape) {
    return normalizePagerDutyPayload(obj);
  }

  if (newRelicHeader || newRelicVendor || newRelicShape) {
    return normalizeNewRelicPayload(obj);
  }

  if (!(datadogHeader || datadogVendor || datadogShape)) {
    return obj as AlertIngestPayload;
  }

  const title =
    typeof obj.title === "string"
      ? obj.title.trim()
      : typeof obj.event_title === "string"
        ? obj.event_title.trim()
        : typeof obj.text === "string"
          ? obj.text.slice(0, 120).trim()
          : "Datadog alert";
  const text = typeof obj.text === "string" ? obj.text.trim() : "";
  const priority = typeof obj.priority === "string" ? obj.priority : "";
  const alertType = typeof obj.alert_type === "string" ? obj.alert_type : "";
  const sourceType = typeof obj.source_type_name === "string" ? obj.source_type_name : "";
  const host = typeof obj.host === "string" ? obj.host : "";
  const eventId = typeof obj.id === "number" || typeof obj.id === "string" ? String(obj.id) : "";

  const tagMapped = parseDatadogTagsForNormalized(obj.tags);
  const summaryParts = [
    text ? text : null,
    sourceType ? `source: ${sourceType}` : null,
    host ? `host: ${host}` : null,
    priority ? `priority: ${priority}` : null,
    alertType ? `alert_type: ${alertType}` : null,
  ].filter(Boolean);

  return {
    title: title.slice(0, 500),
    severity: vendorSeverityToShynvo(alertType || priority),
    status: statusFromDatadogPayload(obj),
    summary: summaryParts.join("\n").slice(0, 12000),
    service_name: tagMapped.serviceName,
    owner_hint: tagMapped.ownerHint,
    runbook_slug: tagMapped.runbookSlug,
    dedupe_key: eventId ? `datadog:${eventId}` : undefined,
  };
}

export async function resolveAlertIngestUserId(bearerPlain: string): Promise<
  | { ok: true; tokenId: string; userId: string }
  | { ok: false; status: number; message: string }
> {
  const admin = createServiceSupabaseClient();
  if (!admin) {
    return { ok: false, status: 503, message: "Alert ingest is not configured." };
  }

  const hash = hashApiKeyPlaintext(bearerPlain);
  const { data, error } = await admin
    .from("alert_ingest_tokens")
    .select("id, user_id")
    .eq("secret_hash", hash)
    .is("revoked_at", null)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, status: 401, message: "Invalid or revoked ingest token." };
  }

  return {
    ok: true,
    tokenId: data.id as string,
    userId: data.user_id as string,
  };
}

export async function ingestAlertCreateIncident(
  userId: string,
  tokenId: string,
  raw: AlertIngestPayload,
): Promise<
  { ok: true; id: string; duplicate: boolean } | { ok: false; status: number; message: string }
> {
  const admin = createServiceSupabaseClient();
  if (!admin) {
    return { ok: false, status: 503, message: "Alert ingest is not configured." };
  }

  const title =
    typeof raw.title === "string" ? raw.title.trim() : String(raw.title ?? "").trim();
  if (!title) {
    return { ok: false, status: 400, message: "Field `title` is required." };
  }

  const sevRaw = typeof raw.severity === "string" ? raw.severity.trim().toLowerCase() : "medium";
  const severity = SEVERITIES.has(sevRaw as IncidentSeverity)
    ? (sevRaw as IncidentSeverity)
    : "medium";

  const stRaw =
    typeof raw.status === "string" ? raw.status.trim().toLowerCase() : "investigating";
  const status = STATUSES.has(stRaw) ? stRaw : "investigating";

  const summary =
    typeof raw.summary === "string" ? raw.summary.trim().slice(0, 12000) : null;

  const dedupe =
    typeof raw.dedupe_key === "string" ? raw.dedupe_key.trim().slice(0, 500) : null;

  const ownerHint =
    typeof raw.owner_hint === "string"
      ? raw.owner_hint.trim().slice(0, 200) || null
      : null;
  const runbookRaw =
    typeof raw.runbook_slug === "string" ? raw.runbook_slug.trim() : "";
  const runbookSlug = runbookRaw && isRunbookSlugValid(runbookRaw) ? runbookRaw : null;

  let serviceId: string | null =
    typeof raw.service_id === "string" && /^[0-9a-f-]{36}$/i.test(raw.service_id)
      ? raw.service_id
      : null;

  if (!serviceId && typeof raw.service_name === "string" && raw.service_name.trim()) {
    const sn = raw.service_name.trim().slice(0, 200);
    const { data: svc } = await admin
      .from("services")
      .select("id")
      .eq("user_id", userId)
      .ilike("name", sn)
      .limit(1)
      .maybeSingle();
    if (svc?.id) {
      serviceId = svc.id as string;
    }
  }

  if (dedupe) {
    const { data: existing } = await admin
      .from("incidents")
      .select("id")
      .eq("user_id", userId)
      .eq("external_ref", dedupe)
      .maybeSingle();
    if (existing?.id) {
      await admin
        .from("alert_ingest_tokens")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", tokenId);
      return { ok: true, id: existing.id as string, duplicate: true };
    }
  }

  const insertRow: Record<string, unknown> = {
    user_id: userId,
    title: title.slice(0, 500),
    severity,
    status,
    postmortem: summary,
  };
  if (serviceId) insertRow.service_id = serviceId;
  if (dedupe) insertRow.external_ref = dedupe;
  if (ownerHint) insertRow.owner_hint = ownerHint;
  if (runbookSlug) insertRow.runbook_slug = runbookSlug;

  const { data: inserted, error: insertError } = await admin
    .from("incidents")
    .insert(insertRow)
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505" && dedupe) {
      const { data: ex2 } = await admin
        .from("incidents")
        .select("id")
        .eq("user_id", userId)
        .eq("external_ref", dedupe)
        .maybeSingle();
      if (ex2?.id) {
        await admin
          .from("alert_ingest_tokens")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", tokenId);
        return { ok: true, id: ex2.id as string, duplicate: true };
      }
    }
    return { ok: false, status: 400, message: insertError.message };
  }

  if (!inserted?.id) {
    return { ok: false, status: 500, message: "Insert returned no incident id." };
  }

  await admin
    .from("alert_ingest_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", tokenId);

  return { ok: true, id: inserted.id as string, duplicate: false };
}
