import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { AlertIngestPanel } from "@/components/settings/AlertIngestPanel";
import { appBody, appMeta, appPanelTitle } from "@/lib/app-typography";
import { getConnectorHealthRows } from "@/lib/connectors-health";
import { getSlackNotificationConfig, isSlackWebhookConfigured } from "@/lib/integrations/slack";
import { getSiteUrl } from "@/lib/site";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CopyCommandButton, DownloadPayloadButton } from "./CopyCommandButton";
import { ConfirmSubmitButton } from "./ConfirmSubmitButton";
import {
  acknowledgeUnknownSyntheticIngestAction,
  cleanupSyntheticIngestTestsAction,
  generateTestIngestIncidentAction,
  generateVendorTestEventsAction,
  sendSlackTestMessageAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Connectors",
  description: "Link reasoning and automation services to Smohix.",
};

export const dynamic = "force-dynamic";

const ROADMAP_BLOCKS = [
  { category: "Monitoring", items: ["Datadog", "Prometheus / Grafana Alerting", "New Relic"] },
  { category: "Chat & paging", items: ["Slack", "Microsoft Teams", "PagerDuty (events)"] },
  { category: "Cloud control planes", items: ["AWS", "Azure", "GCP"] },
  { category: "ITSM / tickets", items: ["Jira", "ServiceNow", "Linear (change tasks)"] },
] as const;

const ADAPTERS = [
  {
    vendor: "Datadog",
    sourceHint: "datadog",
    payload: {
      id: 987654321,
      title: "API 5xx spike",
      text: "Error rate above threshold on payments-api",
      alert_type: "error",
      tags: ["service:payments-api", "owner:platform", "runbook:incident-triage"],
    },
  },
  {
    vendor: "Prometheus / Grafana Alertmanager",
    sourceHint: "prometheus",
    payload: {
      status: "firing",
      alerts: [
        {
          status: "firing",
          labels: { alertname: "HighErrorRate", severity: "critical", service: "payments-api" },
          annotations: { summary: "5xx error rate above threshold" },
          fingerprint: "abc123def456",
        },
      ],
    },
  },
  {
    vendor: "PagerDuty",
    sourceHint: "pagerduty",
    payload: {
      event_action: "trigger",
      dedup_key: "payments-api-5xx",
      payload: {
        summary: "payments-api error budget burn",
        source: "payments-api",
        component: "payments-api",
        severity: "critical",
        custom_details: { owner_hint: "platform-oncall", runbook_slug: "incident-triage" },
      },
    },
  },
  {
    vendor: "New Relic",
    sourceHint: "newrelic",
    payload: {
      current_state: "open",
      incident_id: 123456789,
      condition_name: "High CPU",
      policy_name: "Production infrastructure",
      severity: "critical",
      labels: { service: "payments-api", team: "platform" },
    },
  },
] as const;

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

function relativeAgeLabel(iso: string): string {
  const diffMs = Date.now() - new Date(iso).valueOf();
  if (!Number.isFinite(diffMs) || diffMs < 0) return "just now";
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mon = Math.floor(day / 30);
  return `${mon}mo ago`;
}

function ageBadgeClass(createdAt: string, status: string): string {
  const ageMs = Date.now() - new Date(createdAt).valueOf();
  const s = status.trim().toLowerCase();
  const unresolved = s !== "resolved";
  const olderThanDay = ageMs > 24 * 60 * 60 * 1000;
  const olderThanWeek = ageMs > 7 * 24 * 60 * 60 * 1000;
  if (unresolved && olderThanWeek) {
    return "border-danger/40 bg-danger-dim/30 text-danger";
  }
  if (unresolved && olderThanDay) {
    return "border-amber-400/40 bg-amber-400/10 text-amber-300";
  }
  return "border-white/[0.12] bg-white/[0.03] text-foreground/75";
}

function severityBadgeClass(severity: string): string {
  const s = severity.trim().toLowerCase();
  if (s === "critical") return "border-danger/40 bg-danger-dim/30 text-danger";
  if (s === "high") return "border-amber-400/40 bg-amber-400/10 text-amber-300";
  if (s === "low") return "border-emerald-400/40 bg-emerald-400/10 text-emerald-300";
  return "border-white/[0.12] bg-white/[0.03] text-foreground/85";
}

function statusBadgeClass(status: string): string {
  const s = status.trim().toLowerCase();
  if (s === "resolved") return "border-emerald-400/40 bg-emerald-400/10 text-emerald-300";
  if (s === "monitoring") return "border-sky-400/40 bg-sky-400/10 text-sky-300";
  if (s === "mitigated") return "border-amber-400/40 bg-amber-400/10 text-amber-300";
  if (s === "investigating") return "border-danger/40 bg-danger-dim/30 text-danger";
  return "border-white/[0.12] bg-white/[0.03] text-foreground/85";
}

function connectorOriginLabel(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    const parts = u.hostname.split(".");
    const maskedHost =
      parts.length >= 2
        ? `${parts[0]?.slice(0, 2) || "xx"}***.${parts.slice(1).join(".")}`
        : `${u.hostname.slice(0, 2) || "xx"}***`;
    const port = u.port ? `:${u.port}` : "";
    return `${u.protocol}//${maskedHost}${port}`;
  } catch {
    return rawUrl;
  }
}

function connectorOriginUrl(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

export default async function ConnectorsPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string;
    setup_step?: string;
    vendor?: string;
    window?: string;
    sort?: string;
    limit?: string;
    status?: string;
    q?: string;
    auto?: string;
    ok?: string;
    batch_ok?: string;
    clean_ok?: string;
    ack_ok?: string;
    slack_ok?: string;
    error?: string;
  }>;
}) {
  const connectors = await getConnectorHealthRows();
  const noneConfigured = connectors.every((c) => !c.baseUrl);
  const configuredConnectorsCount = connectors.filter((c) => Boolean(c.baseUrl)).length;
  const siteUrl = getSiteUrl();
  const exampleToken = "zentro_ingest_xxx";
  const exampleSecret = "replace-with-signing-secret";
  const signatureModeEnabled = Boolean(
    (process.env.SMOHIX_ALERT_WEBHOOK_SIGNING_SECRET ?? process.env.ZENTRO_ALERT_WEBHOOK_SIGNING_SECRET)?.trim(),
  );
  const slackWebhookConfigured = isSlackWebhookConfigured();
  const slackNotificationConfig = getSlackNotificationConfig();
  const slackModeLabel =
    slackNotificationConfig.approvals && slackNotificationConfig.executions
      ? "Approvals + executions"
      : slackNotificationConfig.approvals
        ? "Approvals only"
        : slackNotificationConfig.executions
          ? "Executions only"
          : "Disabled";
  let recentIngest: {
    id: string;
    title: string;
    status: string;
    severity: string;
    externalRef: string | null;
    createdAt: string;
    vendor: "Datadog" | "Prometheus/Grafana" | "PagerDuty" | "New Relic" | "Unknown";
  }[] = [];
  let ingestTokenStats: {
    activeCount: number;
    lastUsedAt: string | null;
    lastCreatedAt: string | null;
  } = { activeCount: 0, lastUsedAt: null, lastCreatedAt: null };

  if (hasSupabaseAuth()) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        const { data: tokenRows } = await supabase
          .from("alert_ingest_tokens")
          .select("last_used_at, created_at, revoked_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);
        const active = (tokenRows ?? []).filter((r) => !r.revoked_at);
        let lastUsedAt: string | null = null;
        for (const row of active) {
          if (typeof row.last_used_at === "string" && row.last_used_at) {
            lastUsedAt = row.last_used_at;
            break;
          }
        }
        ingestTokenStats = {
          activeCount: active.length,
          lastUsedAt,
          lastCreatedAt:
            active.length > 0 && typeof active[0]?.created_at === "string"
              ? active[0].created_at
              : null,
        };

        const { data } = await supabase
          .from("incidents")
          .select("id, title, status, severity, external_ref, created_at")
          .eq("user_id", user.id)
          .or(
            "external_ref.like.datadog:%,external_ref.like.prometheus:%,external_ref.like.pagerduty:%,external_ref.like.newrelic:%",
          )
          .order("created_at", { ascending: false })
          .limit(25);
        recentIngest = (data ?? []).map((row) => {
          const externalRef = (row.external_ref as string | null) ?? null;
          const vendorPrefix = externalRef?.split(":")[0]?.toLowerCase() ?? "";
          const vendor =
            vendorPrefix === "datadog"
              ? "Datadog"
              : vendorPrefix === "prometheus"
                ? "Prometheus/Grafana"
                : vendorPrefix === "pagerduty"
                  ? "PagerDuty"
                  : vendorPrefix === "newrelic"
                    ? "New Relic"
                    : "Unknown";
          return {
            id: row.id as string,
            title: row.title as string,
            status: row.status as string,
            severity: row.severity as string,
            externalRef,
            createdAt: row.created_at as string,
            vendor,
          };
        });
      }
    } catch {
      recentIngest = [];
    }
  }

  const sp = await searchParams;
  const returnHref =
    typeof sp.next === "string" && sp.next.startsWith("/")
      ? sp.next
      : null;
  const setupStep = typeof sp.setup_step === "string" ? sp.setup_step.trim().toLowerCase() : "";
  const vendorFilterRaw = typeof sp.vendor === "string" ? sp.vendor.trim().toLowerCase() : "";
  const windowFilterRaw = typeof sp.window === "string" ? sp.window.trim().toLowerCase() : "";
  const sortFilterRaw = typeof sp.sort === "string" ? sp.sort.trim().toLowerCase() : "";
  const limitRaw = typeof sp.limit === "string" ? sp.limit.trim().toLowerCase() : "";
  const statusRaw = typeof sp.status === "string" ? sp.status.trim().toLowerCase() : "";
  const queryRaw = typeof sp.q === "string" ? sp.q.trim() : "";
  const autoRefreshRaw = typeof sp.auto === "string" ? sp.auto.trim().toLowerCase() : "";
  const successIncidentId = typeof sp.ok === "string" ? sp.ok.trim() : "";
  const successBatchCount = typeof sp.batch_ok === "string" ? sp.batch_ok.trim() : "";
  const successCleanCount = typeof sp.clean_ok === "string" ? sp.clean_ok.trim() : "";
  const successAcknowledgeCount = typeof sp.ack_ok === "string" ? sp.ack_ok.trim() : "";
  const successSlackTest = typeof sp.slack_ok === "string" ? sp.slack_ok.trim() : "";
  const actionError = typeof sp.error === "string" ? sp.error.trim() : "";
  const allowedFilters = new Set(["", "datadog", "prometheus", "pagerduty", "newrelic", "unknown"]);
  const vendorFilter = allowedFilters.has(vendorFilterRaw) ? vendorFilterRaw : "";
  const allowedWindows = new Set(["24h", "7d", "30d", "all"]);
  const windowFilter = allowedWindows.has(windowFilterRaw) ? windowFilterRaw : "all";
  const sortFilter = sortFilterRaw === "oldest" ? "oldest" : "newest";
  const allowedLimits = new Set(["5", "10", "25"]);
  const rowLimit = allowedLimits.has(limitRaw) ? Number(limitRaw) : 5;
  const allowedStatus = new Set([
    "all",
    "unresolved",
    "investigating",
    "mitigated",
    "monitoring",
    "resolved",
  ]);
  const statusFilter = allowedStatus.has(statusRaw) ? statusRaw : "all";
  const queryFilter = queryRaw.slice(0, 80);
  const autoRefreshEnabled = autoRefreshRaw === "1";
  const setupStepComplete =
    setupStep === "ingest-token"
      ? ingestTokenStats.activeCount > 0
      : setupStep === "connectors"
        ? configuredConnectorsCount > 0
        : false;
  const setupStepLabel =
    setupStep === "ingest-token"
      ? "Ingest token"
      : setupStep === "connectors"
        ? "Connector configuration"
        : "Setup step";
  const setupStepPosition =
    setupStep === "ingest-token" ? 3 : setupStep === "connectors" ? 4 : null;
  const inSetupFlow = Boolean(returnHref && setupStepPosition);
  const now = new Date().valueOf();
  const windowMs =
    windowFilter === "24h"
      ? 24 * 60 * 60 * 1000
      : windowFilter === "7d"
        ? 7 * 24 * 60 * 60 * 1000
        : windowFilter === "30d"
          ? 30 * 24 * 60 * 60 * 1000
          : null;
  const windowedIngest =
    windowMs == null
      ? recentIngest
      : recentIngest.filter((row) => now - new Date(row.createdAt).valueOf() <= windowMs);
  const filteredIngestBase = vendorFilter
    ? windowedIngest.filter((row) => {
        const key =
          row.vendor === "Datadog"
            ? "datadog"
            : row.vendor === "Prometheus/Grafana"
              ? "prometheus"
              : row.vendor === "PagerDuty"
                ? "pagerduty"
                : row.vendor === "New Relic"
                  ? "newrelic"
                  : "unknown";
        return key === vendorFilter;
      })
    : windowedIngest;
  const statusFilteredIngest =
    statusFilter === "all"
      ? filteredIngestBase
      : statusFilter === "unresolved"
        ? filteredIngestBase.filter((row) => row.status.toLowerCase() !== "resolved")
      : filteredIngestBase.filter((row) => row.status.toLowerCase() === statusFilter);
  const queriedIngest = queryFilter
    ? statusFilteredIngest.filter((row) => {
        const q = queryFilter.toLowerCase();
        return (
          row.title.toLowerCase().includes(q) ||
          (row.externalRef ?? "").toLowerCase().includes(q) ||
          row.vendor.toLowerCase().includes(q)
        );
      })
    : statusFilteredIngest;
  const filteredIngest = [...queriedIngest].sort((a, b) => {
    const av = new Date(a.createdAt).valueOf();
    const bv = new Date(b.createdAt).valueOf();
    return sortFilter === "oldest" ? av - bv : bv - av;
  }).slice(0, rowLimit);
  const vendorCounts = windowedIngest.reduce(
    (acc, row) => {
      if (row.vendor === "Datadog") acc.datadog += 1;
      else if (row.vendor === "Prometheus/Grafana") acc.prometheus += 1;
      else if (row.vendor === "PagerDuty") acc.pagerduty += 1;
      else if (row.vendor === "New Relic") acc.newrelic += 1;
      else acc.unknown += 1;
      return acc;
    },
    { all: windowedIngest.length, datadog: 0, prometheus: 0, pagerduty: 0, newrelic: 0, unknown: 0 },
  );
  const unknownUnresolvedCount = windowedIngest.filter((row) => {
    const isUnknown = row.vendor === "Unknown";
    const isUnresolved = row.status.trim().toLowerCase() !== "resolved";
    return isUnknown && isUnresolved;
  }).length;
  const activeFlowStep =
    unknownUnresolvedCount > 0 ? 3 : vendorCounts.all > 0 ? 2 : 1;
  const activeFlowHint =
    activeFlowStep === 1
      ? "Generate a single smoke test incident."
      : activeFlowStep === 2
        ? "Run vendor coverage checks."
        : "Acknowledge unknown unresolved synthetic tests.";
  const activeStepHref = `#workflow-step-${activeFlowStep}`;
  const step1Done = vendorCounts.all > 0;
  const step2Done = unknownUnresolvedCount > 0;
  const csvRows = [
    ["vendor", "incident_id", "title", "status", "severity", "created_at", "external_ref"],
    ...filteredIngest.map((row) => [
      row.vendor,
      row.id,
      row.title,
      row.status,
      row.severity,
      row.createdAt,
      row.externalRef ?? "",
    ]),
  ];
  const csvContent = csvRows.map((r) => r.map((cell) => csvEscape(String(cell))).join(",")).join("\n");
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
  const csvFilename = `smohix-ingest-events-${windowFilter}-${vendorFilter || "all"}.csv`;
  const markdownReport = [
    `## Smohix Ingest Diagnostics`,
    ``,
    `- Window: \`${windowFilter}\``,
    `- Vendor: \`${vendorFilter || "all"}\``,
    `- Sort: \`${sortFilter}\``,
    `- Limit: \`${rowLimit}\``,
    queryFilter ? `- Query: \`${queryFilter}\`` : null,
    `- Events shown: **${filteredIngest.length}**`,
    ``,
    ...filteredIngest.map(
      (row) =>
        `- **${row.vendor}** · \`${row.status}\` · \`${row.severity}\` · ${new Date(
          row.createdAt,
        ).toLocaleString()} · [Incident ${row.id}](${siteUrl}/incidents/${row.id})${
          row.externalRef ? ` · \`${row.externalRef}\`` : ""
        }`,
    ),
  ]
    .filter(Boolean)
    .join("\n");
  const markdownHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(markdownReport)}`;
  const markdownFilename = `smohix-ingest-events-${windowFilter}-${vendorFilter || "all"}.md`;
  const jsonReport = JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      filters: {
        window: windowFilter,
        vendor: vendorFilter || "all",
        sort: sortFilter,
        limit: rowLimit,
        query: queryFilter || null,
        auto_refresh: autoRefreshEnabled,
      },
      count: filteredIngest.length,
      events: filteredIngest.map((row) => ({
        vendor: row.vendor,
        incident_id: row.id,
        title: row.title,
        status: row.status,
        severity: row.severity,
        created_at: row.createdAt,
        external_ref: row.externalRef,
        incident_url: `${siteUrl}/incidents/${row.id}`,
      })),
    },
    null,
    2,
  );
  const jsonHref = `data:application/json;charset=utf-8,${encodeURIComponent(jsonReport)}`;
  const jsonFilename = `smohix-ingest-events-${windowFilter}-${vendorFilter || "all"}.json`;
  const wizardContextQuery = [
    returnHref ? `next=${encodeURIComponent(returnHref)}` : null,
    setupStep ? `setup_step=${encodeURIComponent(setupStep)}` : null,
  ]
    .filter(Boolean)
    .join("&");
  const wizardContextSuffix = wizardContextQuery ? `&${wizardContextQuery}` : "";
  const wizardContextPrefix = wizardContextQuery ? `?${wizardContextQuery}` : "";
  const filteredShareUrl = `${siteUrl}/settings/connectors?window=${windowFilter}${
    vendorFilter ? `&vendor=${vendorFilter}` : ""
  }&sort=${sortFilter}&limit=${rowLimit}&status=${statusFilter}${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}`;
  const defaultScopeHref = `/settings/connectors${
    autoRefreshEnabled ? `?auto=1${wizardContextSuffix}` : wizardContextPrefix
  }`;
  const defaultScopeAnchorHref = (anchor: string) => `${defaultScopeHref}#${anchor}`;
  const refreshedAt = new Date();
  const refreshHref = `/settings/connectors?window=${windowFilter}${vendorFilter ? `&vendor=${vendorFilter}` : ""}&sort=${sortFilter}&limit=${rowLimit}&status=${statusFilter}${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}`;
  const autoToggleHref = `/settings/connectors?window=${windowFilter}${vendorFilter ? `&vendor=${vendorFilter}` : ""}&sort=${sortFilter}&limit=${rowLimit}&status=${statusFilter}${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "" : "&auto=1"}${wizardContextSuffix}`;
  const hasNonDefaultFilters =
    vendorFilter !== "" ||
    windowFilter !== "all" ||
    sortFilter !== "newest" ||
    rowLimit !== 5 ||
    statusFilter !== "all" ||
    queryFilter !== "";
  const activeFilterCount =
    (vendorFilter ? 1 : 0) +
    (windowFilter !== "all" ? 1 : 0) +
    (sortFilter !== "newest" ? 1 : 0) +
    (rowLimit !== 5 ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (queryFilter ? 1 : 0);
  const activeFilterPillClass =
    activeFilterCount >= 4
      ? "border-amber-400/35 bg-amber-400/10 text-amber-300 hover:border-amber-300/55 hover:text-amber-200"
      : activeFilterCount >= 2
        ? "border-sky-400/35 bg-sky-400/10 text-sky-300 hover:border-sky-300/55 hover:text-sky-200"
        : "border-white/[0.14] text-foreground/70 hover:border-accent/35 hover:text-foreground";
  const activeFilterDetails = [
    windowFilter !== "all" ? `window=${windowFilter}` : null,
    statusFilter !== "all" ? `status=${statusFilter}` : null,
    vendorFilter ? `vendor=${vendorFilter}` : null,
    sortFilter !== "newest" ? `sort=${sortFilter}` : null,
    rowLimit !== 5 ? `limit=${rowLimit}` : null,
    queryFilter ? `query=${queryFilter}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
  const activePresetKey =
    windowFilter === "24h" &&
    statusFilter === "investigating" &&
    vendorFilter === "" &&
    sortFilter === "newest" &&
    rowLimit === 10 &&
    !queryFilter
      ? "active-now"
      : windowFilter === "7d" &&
          statusFilter === "resolved" &&
          vendorFilter === "" &&
          sortFilter === "newest" &&
          rowLimit === 25 &&
          !queryFilter
        ? "resolved-week"
        : windowFilter === "24h" &&
            vendorFilter === "datadog" &&
            statusFilter === "all" &&
            sortFilter === "newest" &&
            rowLimit === 10 &&
            !queryFilter
          ? "datadog-24h"
          : windowFilter === "7d" &&
              vendorFilter === "pagerduty" &&
              statusFilter === "investigating" &&
              sortFilter === "newest" &&
              rowLimit === 10 &&
              !queryFilter
            ? "pagerduty-active"
            : null;
  const skipLinks = [
    { href: "#connectors-health", label: "Skip to connector health" },
    { href: "#ingest-token-setup", label: "Skip to ingest token setup" },
    { href: "#recent-ingest-events", label: "Skip to recent ingest events" },
    { href: "#ingest-diagnostics", label: "Skip to ingest diagnostics" },
    { href: "#connectors-action-workflow", label: "Skip to actions workflow" },
    { href: "#connectors-inbound-quickstart", label: "Skip to inbound quickstart" },
    { href: "#connectors-troubleshooting-matrix", label: "Skip to troubleshooting matrix" },
  ] as const;
  const skipLinkTopStartPx = 12;
  const skipLinkVerticalGapPx = 44;
  const skipLinkFocusClass =
    "sr-only focus:not-sr-only focus:fixed focus:left-3 focus:z-50 focus:rounded-lg focus:border focus:border-accent/45 focus:bg-background focus:px-3 focus:py-2 focus:text-foreground";

  return (
    <>
      {skipLinks.map((link, index) => (
        <a
          key={link.href}
          href={link.href}
          style={{ top: `${skipLinkTopStartPx + index * skipLinkVerticalGapPx}px` }}
          className={skipLinkFocusClass}
        >
          {link.label}
        </a>
      ))}
      <PageHeader
        title="Connectors"
        description="URLs are read from server environment variables. Health checks run on the server when you open this page."
      />
      {returnHref ? (
        <p className={`mb-3 ${appBody}`}>
          <Link href={returnHref} className="font-medium text-accent hover:underline">
            ← Return to setup wizard
          </Link>
        </p>
      ) : null}
      {inSetupFlow ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 ${appMeta} ${
              setupStepComplete
                ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-300"
                : "border-accent/35 bg-accent/10 text-accent"
            }`}
          >
            Guided setup: step {setupStepPosition} of 4
          </span>
          <span className={`rounded-full border border-white/[0.12] px-2.5 py-1 text-foreground/75 ${appMeta}`}>
            {setupStepLabel}
          </span>
          <span
            className={`rounded-full border px-2.5 py-1 ${appMeta} ${
              setupStepComplete
                ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-300"
                : "border-amber-400/35 bg-amber-400/10 text-amber-300"
            }`}
          >
            {setupStepComplete ? "Complete" : "Pending"}
          </span>
        </div>
      ) : null}
      {returnHref && setupStepComplete ? (
        <p className={`mb-3 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-emerald-100 ${appBody}`}>
          {setupStepLabel} step complete.{" "}
          <Link href={returnHref} className="font-semibold text-emerald-200 underline-offset-2 hover:underline">
            Continue setup wizard →
          </Link>
        </p>
      ) : null}
      <div id="connectors-top" className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className={appMeta}>
          Last refreshed: {refreshedAt.toLocaleString()}
          {autoRefreshEnabled ? " · auto-refresh every 8s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={autoToggleHref}
            className={`rounded-lg border px-3 py-1.5 font-medium transition-colors ${
              autoRefreshEnabled
                ? "border-accent/60 bg-accent/10 text-accent hover:border-accent/80"
                : "border-border text-foreground/85 hover:border-accent/35 hover:text-foreground"
            } ${appBody}`}
          >
            {autoRefreshEnabled ? "Disable auto-refresh" : "Enable auto-refresh"}
          </Link>
          <Link
            href={refreshHref}
            className={`rounded-lg border border-border px-3 py-1.5 font-medium text-foreground/85 transition-colors hover:border-accent/35 hover:text-foreground ${appBody}`}
          >
            Refresh diagnostics
          </Link>
        </div>
      </div>
      <div className="sticky top-2 z-20 mb-4 rounded-xl border border-white/[0.08] bg-background/80 backdrop-blur">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 rounded-l-xl bg-gradient-to-r from-background/90 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 rounded-r-xl bg-gradient-to-l from-background/90 to-transparent" />
        <div
          role="navigation"
          aria-label="Connectors quick navigation"
          aria-describedby="connectors-quick-nav-help"
          tabIndex={0}
          className="group/nav flex snap-x snap-mandatory flex-nowrap items-center gap-2 overflow-x-auto px-3 py-2 [scrollbar-width:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 [&::-webkit-scrollbar]:hidden"
        >
          <span id="connectors-quick-nav-help" className="sr-only">
            Horizontal quick navigation. Use left and right arrow keys or swipe to scroll.
          </span>
          <span className={`shrink-0 text-foreground/55 ${appMeta}`}>Navigate:</span>
          <span className={`shrink-0 text-foreground/45 sm:hidden ${appMeta}`}>Scroll for more -&gt;</span>
          <span className={`shrink-0 text-foreground/40 opacity-0 transition-opacity group-focus-within/nav:opacity-100 ${appMeta}`}>
            Use Left/Right arrows to scroll
          </span>
          {hasNonDefaultFilters ? (
            <Link
              href={defaultScopeHref}
              className={`shrink-0 rounded-full border border-amber-400/35 bg-amber-400/10 px-2.5 py-1 text-amber-300 transition-colors hover:border-amber-300/55 hover:text-amber-200 ${appMeta}`}
            >
              Reset view
            </Link>
          ) : null}
          {hasNonDefaultFilters ? (
            <Link
              href="#recent-ingest-events"
              title={`Jump to recent ingest events with current filters.${activeFilterDetails ? ` Active filters: ${activeFilterDetails}` : ""}`}
              className={`shrink-0 rounded-full border px-2.5 py-1 transition-colors ${activeFilterPillClass} ${appMeta}`}
            >
              Active ({activeFilterCount}): w={windowFilter} · s={statusFilter} · v={vendorFilter || "all"} · l={rowLimit}
              {queryFilter ? " · q" : ""}
            </Link>
          ) : null}
          {hasNonDefaultFilters ? (
            <CopyCommandButton
              content={filteredShareUrl}
              idleLabel="Copy active filters"
              copiedLabel="Active filters copied"
            />
          ) : null}
          {queryFilter ? (
            <Link
              href={`/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=${rowLimit}&status=${statusFilter}${vendorFilter ? `&vendor=${vendorFilter}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}`}
              className={`shrink-0 rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
            >
              Clear search
            </Link>
          ) : null}
          {statusFilter !== "all" ? (
            <Link
              href={`/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=${rowLimit}${vendorFilter ? `&vendor=${vendorFilter}` : ""}${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}`}
              className={`shrink-0 rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
            >
              Clear status
            </Link>
          ) : null}
          {vendorFilter ? (
            <Link
              href={`/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=${rowLimit}&status=${statusFilter}${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}`}
              className={`shrink-0 rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
            >
              Clear vendor
            </Link>
          ) : null}
          {windowFilter !== "all" ? (
            <Link
              href={`/settings/connectors?window=all&sort=${sortFilter}&limit=${rowLimit}&status=${statusFilter}${vendorFilter ? `&vendor=${vendorFilter}` : ""}${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}`}
              className={`shrink-0 rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
            >
              Clear window
            </Link>
          ) : null}
          {sortFilter !== "newest" ? (
            <Link
              href={`/settings/connectors?window=${windowFilter}&sort=newest&limit=${rowLimit}&status=${statusFilter}${vendorFilter ? `&vendor=${vendorFilter}` : ""}${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}`}
              className={`shrink-0 rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
            >
              Reset sort
            </Link>
          ) : null}
          {rowLimit !== 5 ? (
            <Link
              href={`/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=5&status=${statusFilter}${vendorFilter ? `&vendor=${vendorFilter}` : ""}${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}`}
              className={`shrink-0 rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
            >
              Reset rows
            </Link>
          ) : null}
          {autoRefreshEnabled ? (
            <Link
              href={`/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=${rowLimit}&status=${statusFilter}${vendorFilter ? `&vendor=${vendorFilter}` : ""}${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${wizardContextSuffix}`}
              className={`shrink-0 rounded-full border border-danger/35 bg-danger-dim/15 px-2.5 py-1 text-danger transition-colors hover:border-danger/55 hover:bg-danger-dim/25 ${appMeta}`}
            >
              Disable auto-refresh
            </Link>
          ) : (
            <Link
              href={`/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=${rowLimit}&status=${statusFilter}${vendorFilter ? `&vendor=${vendorFilter}` : ""}${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}&auto=1${wizardContextSuffix}`}
              className={`shrink-0 rounded-full border border-emerald-400/35 bg-emerald-400/10 px-2.5 py-1 text-emerald-300 transition-colors hover:border-emerald-300/55 hover:bg-emerald-400/15 ${appMeta}`}
            >
              Enable auto-refresh
            </Link>
          )}
          <CopyCommandButton
            content={filteredShareUrl}
            idleLabel="Copy current view"
            copiedLabel="Current view copied"
          />
          <div className="flex shrink-0 snap-start items-center gap-2">
          <Link
            href="#connectors-health"
            title="Connector reachability and endpoint configuration status."
            className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
          >
            Connector health
          </Link>
          <CopyCommandButton
            content={`${filteredShareUrl}#connectors-health`}
            idleLabel="Copy link"
            copiedLabel="Link copied"
          />
          </div>
          <div className="flex shrink-0 snap-start items-center gap-2">
          <Link
            href="#ingest-token-setup"
            title="Create or revoke alert ingest tokens."
            className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
          >
            Token setup
          </Link>
          <CopyCommandButton
            content={`${filteredShareUrl}#ingest-token-setup`}
            idleLabel="Copy link"
            copiedLabel="Link copied"
          />
          </div>
          <div className="flex shrink-0 snap-start items-center gap-2">
          <Link
            href="#ingest-diagnostics"
            title={
              ingestTokenStats.activeCount > 0
                ? "Diagnostics healthy: active ingest tokens available."
                : "Diagnostics attention: no active ingest tokens."
            }
            className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
          >
            <span
              aria-hidden="true"
              className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                ingestTokenStats.activeCount > 0 ? "bg-emerald-300" : "bg-amber-300"
              }`}
            />
            Diagnostics{" "}
            <span className="text-foreground/55">
              ({ingestTokenStats.activeCount} token{ingestTokenStats.activeCount === 1 ? "" : "s"} ·{" "}
              {signatureModeEnabled ? "signed" : "unsigned"})
            </span>
          </Link>
          <CopyCommandButton
            content={`${filteredShareUrl}#ingest-diagnostics`}
            idleLabel="Copy link"
            copiedLabel="Link copied"
          />
          </div>
          <div className="flex shrink-0 snap-start items-center gap-2">
          <Link
            href="#connectors-action-workflow"
            title={`Actions in progress: step ${activeFlowStep}.`}
            className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
          >
            <span
              aria-hidden="true"
              className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                activeFlowStep === 1
                  ? "bg-emerald-300"
                  : activeFlowStep === 2
                    ? "bg-sky-300"
                    : "bg-amber-300"
              }`}
            />
            Actions <span className="text-foreground/55">(step {activeFlowStep})</span>
          </Link>
          <CopyCommandButton
            content={`${filteredShareUrl}#connectors-action-workflow`}
            idleLabel="Copy link"
            copiedLabel="Link copied"
          />
          </div>
          <div className="flex shrink-0 snap-start items-center gap-2">
          <Link
            href="#recent-ingest-events"
            title={
              unknownUnresolvedCount > 0
                ? `Triage required: ${unknownUnresolvedCount} unknown unresolved event(s).`
                : vendorCounts.all > 0
                  ? `Recent events active: ${vendorCounts.all} event(s) in current window.`
                  : "No recent ingest events in current window."
            }
            className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
          >
            <span
              aria-hidden="true"
              className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                unknownUnresolvedCount > 0
                  ? "bg-danger"
                  : vendorCounts.all > 0
                    ? "bg-sky-300"
                    : "bg-white/45"
              }`}
            />
            Recent events{" "}
            <span className="text-foreground/55">({vendorCounts.all})</span>
          </Link>
          {unknownUnresolvedCount > 0 ? (
            <span className="rounded-full border border-danger/40 bg-danger-dim/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-danger">
              unknown unresolved: {unknownUnresolvedCount}
            </span>
          ) : null}
          <CopyCommandButton
            content={`${filteredShareUrl}#recent-ingest-events`}
            idleLabel="Copy link"
            copiedLabel="Link copied"
          />
          </div>
          <div className="flex shrink-0 snap-start items-center gap-2">
          <Link
            href="#connectors-inbound-quickstart"
            title="Inbound adapter templates and copy-paste cURL quickstarts."
            className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
          >
            Quickstart
          </Link>
          <CopyCommandButton
            content={`${filteredShareUrl}#connectors-inbound-quickstart`}
            idleLabel="Copy link"
            copiedLabel="Link copied"
          />
          </div>
          <div className="flex shrink-0 snap-start items-center gap-2">
          <Link
            href="#connectors-troubleshooting-matrix"
            title="Common HTTP errors and what to do next."
            className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
          >
            Troubleshooting
          </Link>
          <CopyCommandButton
            content={`${filteredShareUrl}#connectors-troubleshooting-matrix`}
            idleLabel="Copy link"
            copiedLabel="Link copied"
          />
          </div>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className={`text-foreground/55 ${appMeta}`}>Dot legend:</span>
        <span className={`inline-flex items-center gap-1.5 text-foreground/65 ${appMeta}`}>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
          healthy / ready
        </span>
        <span className={`inline-flex items-center gap-1.5 text-foreground/65 ${appMeta}`}>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-300" />
          active / in progress
        </span>
        <span className={`inline-flex items-center gap-1.5 text-foreground/65 ${appMeta}`}>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-300" />
          attention needed
        </span>
        <span className={`inline-flex items-center gap-1.5 text-foreground/65 ${appMeta}`}>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-danger" />
          triage required
        </span>
      </div>
      {autoRefreshEnabled ? (
        <Script
          id="connectors-auto-refresh"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `setTimeout(function(){ window.location.href = ${JSON.stringify(refreshHref)}; }, 8000);`,
          }}
        />
      ) : null}
      {successIncidentId ? (
        <p className={`mb-4 rounded-xl border border-success/25 bg-success-dim/50 px-4 py-3 text-success ${appBody}`}>
          Test ingest incident created successfully.{" "}
          <Link href={`/incidents/${successIncidentId}`} className="font-medium text-success underline-offset-2 hover:underline">
            Open incident →
          </Link>
        </p>
      ) : null}
      {successBatchCount ? (
        <p className={`mb-4 rounded-xl border border-success/25 bg-success-dim/50 px-4 py-3 text-success ${appBody}`}>
          Vendor test batch completed: created {successBatchCount} synthetic ingest incident(s).
        </p>
      ) : null}
      {successCleanCount ? (
        <p className={`mb-4 rounded-xl border border-success/25 bg-success-dim/50 px-4 py-3 text-success ${appBody}`}>
          Cleanup completed: removed {successCleanCount} synthetic test incident(s).
        </p>
      ) : null}
      {successAcknowledgeCount ? (
        <p className={`mb-4 rounded-xl border border-success/25 bg-success-dim/50 px-4 py-3 text-success ${appBody}`}>
          Acknowledged {successAcknowledgeCount} unknown unresolved synthetic incident(s).
        </p>
      ) : null}
      {successSlackTest ? (
        <p className={`mb-4 rounded-xl border border-success/25 bg-success-dim/50 px-4 py-3 text-success ${appBody}`}>
          Slack test sent successfully.
        </p>
      ) : null}
      {actionError ? (
        <p className={`mb-4 rounded-xl border border-danger/25 bg-danger-dim/50 px-4 py-3 text-danger ${appBody}`}>
          {actionError}
        </p>
      ) : null}
      <section className="mb-6 rounded-xl border border-border bg-surface/70 p-4">
        <h2 className={appPanelTitle}>Slack approvals and execution receipts</h2>
        <p className={`mt-1 text-muted ${appBody}`}>
          Send key governance events to Slack with an incoming webhook.
        </p>
        <p className={`mt-2 ${appBody}`}>
          {slackWebhookConfigured ? (
            <span className="text-emerald-300">Configured · notifications enabled</span>
          ) : (
            <span className="text-amber-300">
              Not configured · set <span className="font-mono text-foreground/90">SMOHIX_SLACK_WEBHOOK_URL</span>{" "}
              in Railway variables to enable
            </span>
          )}
        </p>
        <p className={`mt-1 text-foreground/70 ${appMeta}`}>
          Notification mode: <span className="text-foreground/85">{slackModeLabel}</span>
        </p>
        <form action={sendSlackTestMessageAction} className="mt-3">
          {returnHref ? <input type="hidden" name="next" value={returnHref} /> : null}
          {setupStep ? <input type="hidden" name="setup_step" value={setupStep} /> : null}
          <button
            type="submit"
            className={`rounded-lg border border-accent/45 bg-accent/10 px-3 py-1.5 font-medium text-accent transition-colors hover:border-accent/70 hover:bg-accent/15 disabled:cursor-not-allowed disabled:border-white/[0.12] disabled:bg-transparent disabled:text-foreground/40 ${appBody}`}
            disabled={!slackWebhookConfigured}
            title={
              slackWebhookConfigured
                ? "Send a test message to your configured Slack channel."
                : "Set SMOHIX_SLACK_WEBHOOK_URL to enable Slack test messages."
            }
          >
            Send Slack test message
          </button>
        </form>
      </section>
      {noneConfigured ? (
        <div className="mb-6">
          <ConsoleEmptyState
            title="No connectors configured"
            description="Point Smohix at your reasoning and automation backends so Copilot, dry-runs, and guarded execution can reach your stack. Set the env vars on your deployment, redeploy, then refresh this page."
            ctas={[
              { href: "/docs/api", label: "API reference", variant: "secondary" },
              { href: "/docs", label: "Platform docs", variant: "secondary" },
            ]}
            footnote={
              <p>
                Set <span className="font-mono text-foreground/80">REACT_APP_SH_BACKEND_API</span>{" "}
                and <span className="font-mono text-foreground/80">REACT_APP_ROBOT_BACKEND</span> to
                HTTPS base URLs (no trailing slash required).
              </p>
            }
          />
        </div>
      ) : null}
      <div id="connectors-health" className="space-y-4">
        {connectors.map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-4 rounded-xl border border-border bg-surface/80 p-5 sm:flex-row sm:items-start sm:justify-between"
          >
            {(() => {
              const originUrl = c.baseUrl ? connectorOriginUrl(c.baseUrl) : null;
              return (
                <>
            <div className="min-w-0 flex-1">
              <h2 className={appPanelTitle}>{c.name}</h2>
              <p className={`mt-1 text-muted ${appBody}`}>{c.role}</p>
              {c.baseUrl ? (
                <p className={`mt-2 truncate font-mono ${appMeta}`} title={connectorOriginLabel(c.baseUrl)}>
                  {connectorOriginLabel(c.baseUrl)}
                </p>
              ) : null}
              <p className={`mt-2 font-mono ${appMeta}`}>{c.detail}</p>
              <p className={`mt-2 ${appBody}`}>
                {c.ok === null && (
                  <span className="text-amber-400/90">Not configured</span>
                )}
                {c.ok === true && (
                  <span className="text-emerald-400/90">
                    Reachable{c.ms != null ? ` · ${c.ms}ms` : ""}
                  </span>
                )}
                {c.ok === false && (
                  <span className="text-red-400/90">Unreachable or error</span>
                )}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              {originUrl && c.ok ? (
                <a
                  href={originUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded-lg border border-border px-4 py-2 text-foreground transition-colors hover:border-accent/40 ${appBody}`}
                >
                  Open service
                </a>
              ) : null}
              {c.id === "robot" && originUrl && c.ok ? (
                <a
                  href={`${originUrl}${c.docsPath ?? "/docs"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${appMeta} hover:text-accent`}
                >
                  API docs →
                </a>
              ) : null}
            </div>
                </>
              );
            })()}
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 md:p-6">
        <h2 className={appPanelTitle}>Vendor integrations roadmap</h2>
        <p className={`mt-1 text-muted ${appBody}`}>
          These vendors are roadmap targets for first-party connectors or supported webhook adapters.
          They are not enabled by default in this deployment until shipped.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {ROADMAP_BLOCKS.map((block) => (
            <div key={block.category} className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
              <p className="text-sm font-semibold text-foreground/90">{block.category}</p>
              <ul className={`mt-2 space-y-1 ${appBody}`}>
                {block.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-muted">
                    <span className="rounded-full border border-white/[0.12] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      Planned
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className={`mt-4 ${appMeta}`}>
          When shipped, users connect these from the same settings area via OAuth or webhook/API keys
          and can map vendor signals to incidents, changes, and audit trails.
        </p>
        <Link href="/integrations" className={`mt-3 inline-block font-medium text-accent hover:underline ${appBody}`}>
          Full integrations page →
        </Link>
      </section>

      <section
        id="ingest-diagnostics"
        className="mt-8 scroll-mt-24 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 md:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={appPanelTitle}>Ingest diagnostics</h2>
          <div className="flex flex-wrap items-center gap-2">
            {hasNonDefaultFilters ? (
              <span className={`rounded-full border border-amber-400/35 bg-amber-400/10 px-2.5 py-1 text-amber-300 ${appMeta}`}>
                Filtered view
              </span>
            ) : null}
            {hasNonDefaultFilters ? (
              <Link
                href={defaultScopeAnchorHref("ingest-diagnostics")}
                className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
              >
                Reset to default scope
              </Link>
            ) : null}
            <Link
              href="#connectors-top"
              className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
            >
              Back to top
            </Link>
            <CopyCommandButton
              content={`${filteredShareUrl}#ingest-diagnostics`}
              idleLabel="Copy section link"
              copiedLabel="Section link copied"
            />
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3">
            <p className={appMeta}>Active ingest tokens</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{ingestTokenStats.activeCount}</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3">
            <p className={appMeta}>Signature mode</p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {signatureModeEnabled ? "Enabled" : "Disabled"}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3">
            <p className={appMeta}>Last token use</p>
            <p className="mt-1 text-sm font-medium text-foreground/90">
              {ingestTokenStats.lastUsedAt
                ? new Date(ingestTokenStats.lastUsedAt).toLocaleString()
                : "No usage yet"}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3">
            <p className={appMeta}>Newest token created</p>
            <p className="mt-1 text-sm font-medium text-foreground/90">
              {ingestTokenStats.lastCreatedAt
                ? new Date(ingestTokenStats.lastCreatedAt).toLocaleString()
                : "None"}
            </p>
          </div>
        </div>
        <p className={`mt-4 ${appMeta}`}>
          If active tokens are zero, create one below. If signature mode is enabled, include valid{" "}
          <span className="font-mono text-foreground/80">X-Zentro-Signature</span> headers.
        </p>
        <div id="ingest-token-setup" className="mt-4 rounded-xl border border-white/[0.08] bg-black/20 p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className={`font-medium text-foreground/90 ${appBody}`}>Ingest token setup</p>
            <CopyCommandButton
              content={`${filteredShareUrl}#ingest-token-setup`}
              idleLabel="Copy section link"
              copiedLabel="Section link copied"
            />
          </div>
          <AlertIngestPanel
            serviceRoleConfigured={Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())}
            setupStep={setupStep}
            returnHref={returnHref}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`text-foreground/55 ${appMeta}`}>Quick jump:</span>
          <Link
            href="#connectors-action-workflow"
            className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
          >
            Actions workflow
          </Link>
          <Link
            href="#connectors-troubleshooting-matrix"
            className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
          >
            Troubleshooting
          </Link>
          <Link
            href="#connectors-inbound-quickstart"
            className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
          >
            Quickstart
          </Link>
          <Link
            href="#recent-ingest-events"
            className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
          >
            Recent ingest events
          </Link>
        </div>
        <div
          id="connectors-troubleshooting-matrix"
          className="mt-5 scroll-mt-24 rounded-xl border border-white/[0.08] bg-black/25 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground/90">Troubleshooting matrix</p>
            <div className="flex flex-wrap items-center gap-2">
              {hasNonDefaultFilters ? (
                <span className={`rounded-full border border-amber-400/35 bg-amber-400/10 px-2.5 py-1 text-amber-300 ${appMeta}`}>
                  Filtered view
                </span>
              ) : null}
              {hasNonDefaultFilters ? (
                <Link
                  href={defaultScopeAnchorHref("connectors-troubleshooting-matrix")}
                  className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
                >
                  Reset to default scope
                </Link>
              ) : null}
              <Link
                href="#connectors-inbound-quickstart"
                className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
              >
                Quickstart
              </Link>
              <Link
                href="#connectors-action-workflow"
                className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
              >
                Actions
              </Link>
              <Link
                href="#recent-ingest-events"
                className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
              >
                Recent events
              </Link>
              <Link
                href="#connectors-top"
                className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
              >
                Back to top
              </Link>
              <CopyCommandButton
                content={`${filteredShareUrl}#connectors-troubleshooting-matrix`}
                idleLabel="Copy section link"
                copiedLabel="Section link copied"
              />
            </div>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className={`border-b border-white/[0.08] ${appMeta}`}>
                  <th className="py-2 pr-3 font-medium text-foreground/80">HTTP status</th>
                  <th className="py-2 pr-3 font-medium text-foreground/80">Meaning</th>
                  <th className="py-2 font-medium text-foreground/80">What to do next</th>
                </tr>
              </thead>
              <tbody className={appBody}>
                <tr className="border-b border-white/[0.05] align-top">
                  <td className="py-2 pr-3 font-mono text-foreground/85">401</td>
                  <td className="py-2 pr-3 text-foreground/80">Invalid token or signature mismatch</td>
                  <td className="py-2 text-foreground/75">
                    Confirm Bearer ingest token is active and re-generate HMAC with the exact raw
                    body when signature mode is enabled.
                  </td>
                </tr>
                <tr className="border-b border-white/[0.05] align-top">
                  <td className="py-2 pr-3 font-mono text-foreground/85">400</td>
                  <td className="py-2 pr-3 text-foreground/80">Payload parse/validation or insert error</td>
                  <td className="py-2 text-foreground/75">
                    Use one of the adapter templates above, verify JSON shape, and check required
                    fields like title/service mapping.
                  </td>
                </tr>
                <tr className="border-b border-white/[0.05] align-top">
                  <td className="py-2 pr-3 font-mono text-foreground/85">429</td>
                  <td className="py-2 pr-3 text-foreground/80">Rate limit exceeded</td>
                  <td className="py-2 text-foreground/75">
                    Back off and retry after the response retry interval; reduce burst size from
                    test senders.
                  </td>
                </tr>
                <tr className="align-top">
                  <td className="py-2 pr-3 font-mono text-foreground/85">503</td>
                  <td className="py-2 pr-3 text-foreground/80">Server-side ingest dependencies missing</td>
                  <td className="py-2 text-foreground/75">
                    Check Supabase env and service-role configuration in deployment variables, then
                    redeploy.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div
          id="connectors-action-workflow"
          className="mt-4 scroll-mt-24 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3"
        >
          <p className={`text-foreground/85 ${appBody}`}>
            Validate end-to-end ingest quickly with a synthetic incident event.
          </p>
          <div className="mb-2 flex w-full flex-wrap items-center justify-between gap-2">
            <p className={`text-foreground/60 ${appMeta}`}>
              Recommended flow: <span className="font-semibold text-foreground/80">1 -&gt; 2 -&gt; 3</span>
              {" · "}In progress:{" "}
              <span className="font-semibold text-foreground/80">step {activeFlowStep}</span>{" "}
              <span className="text-foreground/55">({activeFlowHint})</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {hasNonDefaultFilters ? (
                <span className={`rounded-full border border-amber-400/35 bg-amber-400/10 px-2.5 py-1 text-amber-300 ${appMeta}`}>
                  Filtered view
                </span>
              ) : null}
              {hasNonDefaultFilters ? (
                <Link
                  href={defaultScopeAnchorHref("connectors-action-workflow")}
                  className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
                >
                  Reset to default scope
                </Link>
              ) : null}
              <Link
                href="#ingest-diagnostics"
                className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
              >
                Back to diagnostics
              </Link>
              <Link
                href={activeStepHref}
                className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
              >
                Jump to active step
              </Link>
              <Link
                href="#recent-ingest-events"
                className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
              >
                Jump to recent ingest events
              </Link>
              <CopyCommandButton
                content={`${filteredShareUrl}#connectors-action-workflow`}
                idleLabel="Copy section link"
                copiedLabel="Section link copied"
              />
            </div>
          </div>
          <div className="mb-2 flex w-full flex-wrap items-center gap-2">
            {[
              {
                step: 1,
                label: "Step 1",
                state: step1Done ? "Done" : activeFlowStep === 1 ? "Active" : "Pending",
              },
              {
                step: 2,
                label: "Step 2",
                state: step2Done ? "Done" : activeFlowStep === 2 ? "Active" : "Pending",
              },
              {
                step: 3,
                label: "Step 3",
                state: activeFlowStep === 3 ? "Active" : "Pending",
              },
            ].map((s) => (
              <Link
                key={s.step}
                href={`#workflow-step-${s.step}`}
                aria-current={activeFlowStep === s.step ? "step" : undefined}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                  s.state === "Done"
                    ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-300"
                    : s.state === "Active"
                      ? "border-accent/45 bg-accent/10 text-accent"
                      : "border-white/[0.12] text-foreground/65 hover:border-accent/35 hover:text-foreground"
                }`}
              >
                {s.label}: {s.state}
              </Link>
            ))}
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-2">
            <div
              id="workflow-step-1"
              data-active-step={activeFlowStep === 1 ? "true" : undefined}
              className={`scroll-mt-24 rounded-lg p-2 transition-colors target:ring-1 target:ring-accent/45 ${
                activeFlowStep === 1 ? "ring-1 ring-emerald-400/35 bg-emerald-400/5" : ""
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-400/35 bg-emerald-400/10 text-[10px] font-bold text-emerald-300">
                  1
                </span>
                <span className="rounded-full border border-emerald-400/35 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                  Recommended
                </span>
                <span className={`text-foreground/55 ${appMeta}`}>fast check</span>
              </div>
              <form action={generateTestIngestIncidentAction}>
                {returnHref ? <input type="hidden" name="next" value={returnHref} /> : null}
                {setupStep ? <input type="hidden" name="setup_step" value={setupStep} /> : null}
                <button
                  type="submit"
                  title="Create one synthetic incident to quickly verify ingest is healthy."
                  className={`w-full rounded-lg border border-accent/45 bg-accent/10 px-3 py-1.5 font-medium text-accent transition-colors hover:border-accent/70 hover:bg-accent/15 ${appBody}`}
                >
                  Generate test incident now
                </button>
              </form>
              <p className={`mt-1 text-foreground/60 ${appMeta}`}>Single smoke test for ingest health.</p>
            </div>
            <div
              id="workflow-step-2"
              data-active-step={activeFlowStep === 2 ? "true" : undefined}
              className={`scroll-mt-24 rounded-lg p-2 transition-colors target:ring-1 target:ring-accent/45 ${
                activeFlowStep === 2 ? "ring-1 ring-sky-400/35 bg-sky-400/5" : ""
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-sky-400/35 bg-sky-400/10 text-[10px] font-bold text-sky-300">
                  2
                </span>
                <span className="rounded-full border border-sky-400/35 bg-sky-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-300">
                  Safe
                </span>
                <span className={`text-foreground/55 ${appMeta}`}>coverage run</span>
              </div>
              <form action={generateVendorTestEventsAction}>
                {returnHref ? <input type="hidden" name="next" value={returnHref} /> : null}
                {setupStep ? <input type="hidden" name="setup_step" value={setupStep} /> : null}
                <button
                  type="submit"
                  title="Create one synthetic event per vendor adapter for coverage checks."
                  className={`w-full rounded-lg border border-border px-3 py-1.5 font-medium text-foreground/85 transition-colors hover:border-accent/35 hover:text-foreground ${appBody}`}
                >
                  Generate vendor test events
                </button>
              </form>
              <p className={`mt-1 text-foreground/60 ${appMeta}`}>Covers Datadog, Prometheus, PagerDuty, and New Relic.</p>
            </div>
            <div
              id="workflow-step-3"
              data-active-step={activeFlowStep === 3 ? "true" : undefined}
              className={`scroll-mt-24 rounded-lg p-2 transition-colors target:ring-1 target:ring-accent/45 ${
                activeFlowStep === 3 ? "ring-1 ring-amber-400/35 bg-amber-400/5" : ""
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-amber-400/35 bg-amber-400/10 text-[10px] font-bold text-amber-300">
                  3
                </span>
                <span className="rounded-full border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                  Safe
                </span>
                <span className={`text-foreground/55 ${appMeta}`}>state update only</span>
              </div>
              <form action={acknowledgeUnknownSyntheticIngestAction}>
                {returnHref ? <input type="hidden" name="next" value={returnHref} /> : null}
                {setupStep ? <input type="hidden" name="setup_step" value={setupStep} /> : null}
                <ConfirmSubmitButton
                  label="Acknowledge unknown unresolved tests"
                  confirmMessage="Mark unknown unresolved synthetic incidents as mitigated?"
                  title="Mark synthetic unknown unresolved incidents as mitigated without deleting records."
                  className={`w-full rounded-lg border border-amber-400/35 px-3 py-1.5 font-medium text-amber-300 transition-colors hover:border-amber-300/55 hover:bg-amber-400/10 ${appBody}`}
                />
              </form>
              <p className={`mt-1 text-foreground/60 ${appMeta}`}>Keeps records, reduces active synthetic noise.</p>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full border border-danger/40 bg-danger-dim/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-danger">
                  Destructive
                </span>
                <span className={`text-foreground/55 ${appMeta}`}>deletes data</span>
              </div>
              <form action={cleanupSyntheticIngestTestsAction}>
                {returnHref ? <input type="hidden" name="next" value={returnHref} /> : null}
                {setupStep ? <input type="hidden" name="setup_step" value={setupStep} /> : null}
                <ConfirmSubmitButton
                  label="Cleanup synthetic tests"
                  confirmMessage="Delete synthetic test incidents created from connectors diagnostics?"
                  title="Delete synthetic connector test incidents after verification is complete."
                  className={`w-full rounded-lg border border-danger/35 px-3 py-1.5 font-medium text-danger transition-colors hover:border-danger/55 hover:bg-danger-dim/20 ${appBody}`}
                />
              </form>
              <p className={`mt-1 text-foreground/60 ${appMeta}`}>Destructive: permanently removes synthetic incidents.</p>
            </div>
          </div>
          <div className="w-full">
            <Link
              href="#connectors-top"
              className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
            >
              Back to top
            </Link>
          </div>
          <Script
            id="connectors-active-step-focus"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `setTimeout(function(){try{if(window.innerWidth>=640)return;var active=document.querySelector('[data-active-step="true"]');if(active&&active instanceof HTMLElement){active.scrollIntoView({behavior:'smooth',block:'center'});}}catch(e){}},120);`,
            }}
          />
          <details className="w-full rounded-lg border border-white/[0.08] bg-black/20 p-3">
            <summary className={`cursor-pointer text-foreground/80 ${appBody}`}>
              Actions runbook
            </summary>
            <ul className={`mt-2 list-inside list-disc space-y-1 text-foreground/75 ${appBody}`}>
              <li>
                <span className="font-semibold text-foreground/85">Generate test incident now:</span>{" "}
                quick single-event smoke test after token or env changes.
              </li>
              <li>
                <span className="font-semibold text-foreground/85">Generate vendor test events:</span>{" "}
                adapter coverage check across Datadog, Prometheus, PagerDuty, and New Relic.
              </li>
              <li>
                <span className="font-semibold text-foreground/85">
                  Acknowledge unknown unresolved tests:
                </span>{" "}
                marks synthetic unknown backlog as mitigated without deleting records.
              </li>
              <li>
                <span className="font-semibold text-foreground/85">Cleanup synthetic tests:</span>{" "}
                destructive cleanup after verification is complete.
              </li>
            </ul>
          </details>
        </div>
      </section>

      <section
        id="connectors-inbound-quickstart"
        className="mt-8 scroll-mt-24 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 md:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={appPanelTitle}>Inbound adapters quickstart</h2>
          <div className="flex flex-wrap items-center gap-2">
            {hasNonDefaultFilters ? (
              <span className={`rounded-full border border-amber-400/35 bg-amber-400/10 px-2.5 py-1 text-amber-300 ${appMeta}`}>
                Filtered view
              </span>
            ) : null}
            {hasNonDefaultFilters ? (
              <Link
                href={defaultScopeAnchorHref("connectors-inbound-quickstart")}
                className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
              >
                Reset to default scope
              </Link>
            ) : null}
            <Link
              href="#connectors-action-workflow"
              className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
            >
              Actions
            </Link>
            <Link
              href="#connectors-troubleshooting-matrix"
              className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
            >
              Troubleshooting
            </Link>
            <Link
              href="#recent-ingest-events"
              className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
            >
              Recent events
            </Link>
            <Link
              href="#connectors-top"
              className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
            >
              Back to top
            </Link>
            <CopyCommandButton
              content={`${filteredShareUrl}#connectors-inbound-quickstart`}
              idleLabel="Copy section link"
              copiedLabel="Section link copied"
            />
          </div>
        </div>
        <p className={`mt-1 text-muted ${appBody}`}>
          Use these copy-paste payloads to validate vendor adapters against your deployment.
          Replace the token and (if enabled) signature header.
        </p>
        <div className="mt-4 rounded-xl border border-white/[0.08] bg-black/25 p-4">
          <p className="text-sm font-semibold text-foreground/90">Recommended order</p>
          <ol className={`mt-2 list-inside list-decimal space-y-1 text-muted ${appBody}`}>
            <li>
              Create an alert ingest token in{" "}
              <Link href="/settings/api-keys" className="font-medium text-accent hover:underline">
                API keys
              </Link>{" "}
              and keep the plaintext value.
            </li>
            <li>
              Pick a vendor adapter below and copy/download its sample payload (reference:{" "}
              <Link href="/docs/api" className="font-medium text-accent hover:underline">
                API docs
              </Link>
              ).
            </li>
            <li>
              If signature mode is enabled, generate a valid HMAC using{" "}
              <span className="font-mono text-foreground/80">gen:alert-signature</span>.
            </li>
            <li>Send the request to <span className="font-mono text-foreground/80">/api/integrations/alerts</span>.</li>
            <li>
              Verify incident creation/dedupe in{" "}
              <Link href="/incidents" className="font-medium text-accent hover:underline">
                Incidents
              </Link>{" "}
              and corresponding entries in{" "}
              <Link href="/audit" className="font-medium text-accent hover:underline">
                Audit
              </Link>
              .
            </li>
          </ol>
        </div>
        <div className="mt-4 space-y-4">
          {ADAPTERS.map((a) => {
            const payload = JSON.stringify(a.payload, null, 2);
            const vendorSlug = a.vendor.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            const cmd = `curl -X POST "${siteUrl}/api/integrations/alerts" \\
  -H "Authorization: Bearer ${exampleToken}" \\
  -H "Content-Type: application/json" \\
  -H "X-Zentro-Alert-Source: ${a.sourceHint}" \\
  -d '${payload}'`;
            const signedCmd = `# 1) Save payload and generate signature
cat > payload.json <<'JSON'
${payload}
JSON

npm run gen:alert-signature -- --secret "${exampleSecret}" --body-file payload.json --timestamp 1715000000

# 2) Use generated signature values below
curl -X POST "${siteUrl}/api/integrations/alerts" \\
  -H "Authorization: Bearer ${exampleToken}" \\
  -H "Content-Type: application/json" \\
  -H "X-Zentro-Alert-Source: ${a.sourceHint}" \\
  -H "X-Zentro-Signature-Timestamp: 1715000000" \\
  -H "X-Zentro-Signature: sha256=<replace_with_generated_hmac>" \\
  -d @payload.json`;
            return (
              <div key={a.vendor} className="rounded-xl border border-white/[0.08] bg-black/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground/90">{a.vendor}</p>
                  <div className="flex items-center gap-2">
                    <DownloadPayloadButton
                      filename={`${vendorSlug}-payload.json`}
                      content={payload}
                    />
                    <CopyCommandButton content={payload} idleLabel="Copy payload" copiedLabel="Payload copied" />
                    <CopyCommandButton content={cmd} idleLabel="Copy command" copiedLabel="Command copied" />
                    <CopyCommandButton
                      content={signedCmd}
                      idleLabel="Copy signed cURL"
                      copiedLabel="Signed cURL copied"
                    />
                  </div>
                </div>
                <pre className="mt-2 overflow-x-auto rounded-lg border border-white/[0.08] bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-foreground/85">
                  {cmd}
                </pre>
                <details className="mt-3 rounded-lg border border-white/[0.08] bg-black/30 p-3">
                  <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-foreground/75">
                    Expand signed example
                  </summary>
                  <pre className="mt-3 overflow-x-auto rounded-lg border border-white/[0.08] bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-foreground/85">
                    {signedCmd}
                  </pre>
                </details>
              </div>
            );
          })}
        </div>
        <p className={`mt-4 ${appMeta}`}>
          Signature mode (optional): set{" "}
          <span className="font-mono text-foreground/80">SMOHIX_ALERT_WEBHOOK_SIGNING_SECRET</span>,
          then send{" "}
          <span className="font-mono text-foreground/80">
            X-Zentro-Signature: sha256=&lt;hmac_hex&gt;
          </span>{" "}
          where HMAC is SHA-256 over raw body (or <span className="font-mono">timestamp.rawBody</span>{" "}
          with <span className="font-mono">X-Zentro-Signature-Timestamp</span>).
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-white/[0.08] bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-foreground/85">{`npm run gen:alert-signature -- --secret "${exampleSecret}" --body-file payload.json --timestamp 1715000000`}</pre>
      </section>

      <section
        id="recent-ingest-events"
        className="mt-8 scroll-mt-24 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 md:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={appPanelTitle}>Recent ingest events</h2>
          <div className="flex flex-wrap items-center gap-2">
            {hasNonDefaultFilters ? (
              <span className={`rounded-full border border-amber-400/35 bg-amber-400/10 px-2.5 py-1 text-amber-300 ${appMeta}`}>
                Filtered view
              </span>
            ) : null}
            {hasNonDefaultFilters ? (
              <Link
                href={defaultScopeAnchorHref("recent-ingest-events")}
                className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
              >
                Reset to default scope
              </Link>
            ) : null}
            <Link
              href="#ingest-diagnostics"
              className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
            >
              Back to diagnostics
            </Link>
            <Link
              href="#connectors-inbound-quickstart"
              className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
            >
              Quickstart
            </Link>
            <Link
              href="#connectors-troubleshooting-matrix"
              className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
            >
              Troubleshooting
            </Link>
            <Link
              href="#connectors-action-workflow"
              className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
            >
              Back to action workflow
            </Link>
            <Link
              href="#connectors-top"
              className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
            >
              Back to top
            </Link>
            <CopyCommandButton
              content={`${filteredShareUrl}#recent-ingest-events`}
              idleLabel="Copy section link"
              copiedLabel="Section link copied"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {[
            {
              key: "active-now",
              label: "Active now",
              href: `/settings/connectors?window=24h&status=investigating&sort=newest&limit=10${
                autoRefreshEnabled ? "&auto=1" : ""
              }${wizardContextSuffix}`,
            },
            {
              key: "resolved-week",
              label: "Resolved this week",
              href: `/settings/connectors?window=7d&status=resolved&sort=newest&limit=25${
                autoRefreshEnabled ? "&auto=1" : ""
              }${wizardContextSuffix}`,
            },
            {
              key: "datadog-24h",
              label: "Datadog last 24h",
              href: `/settings/connectors?window=24h&vendor=datadog&sort=newest&limit=10${
                autoRefreshEnabled ? "&auto=1" : ""
              }${wizardContextSuffix}`,
            },
            {
              key: "pagerduty-active",
              label: "PagerDuty active",
              href: `/settings/connectors?window=7d&vendor=pagerduty&status=investigating&sort=newest&limit=10${
                autoRefreshEnabled ? "&auto=1" : ""
              }${wizardContextSuffix}`,
            },
          ].map((preset) => {
            const active = activePresetKey === preset.key;
            return (
              <Link
                key={preset.href}
                href={preset.href}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${appBody} ${
                  active
                    ? "border-accent/60 bg-accent/10 text-accent"
                    : "border-white/[0.12] text-foreground/75 hover:border-accent/35 hover:text-foreground"
                }`}
              >
                {preset.label}
              </Link>
            );
          })}
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              activePresetKey
                ? "border-accent/60 bg-accent/10 text-accent"
                : "border-white/[0.12] text-foreground/65"
            }`}
          >
            {activePresetKey ? "Preset view" : "Custom view"}
          </span>
          <CopyCommandButton
            content={filteredShareUrl}
            idleLabel="Copy view link"
            copiedLabel="View link copied"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3">
          <p className={`text-foreground/85 ${appBody}`}>
            Showing <span className="font-semibold text-foreground">{filteredIngest.length}</span>{" "}
            event(s) · window <span className="font-mono text-foreground/80">{windowFilter}</span>{" "}
            · vendor{" "}
            <span className="font-mono text-foreground/80">{vendorFilter || "all"}</span>
            {" · "}sort <span className="font-mono text-foreground/80">{sortFilter}</span>
            {" · "}limit <span className="font-mono text-foreground/80">{rowLimit}</span>
            {queryFilter ? (
              <>
                {" · "}query <span className="font-mono text-foreground/80">{queryFilter}</span>
              </>
            ) : null}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=${rowLimit}&status=unresolved&vendor=unknown${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}`}
              className={`rounded-lg border px-3 py-1.5 font-medium transition-colors ${
                vendorFilter === "unknown" && statusFilter === "unresolved"
                  ? "border-danger/45 bg-danger-dim/25 text-danger"
                  : unknownUnresolvedCount > 0
                    ? "border-danger/35 bg-danger-dim/15 text-danger hover:border-danger/55"
                    : "border-white/[0.12] text-foreground/70 hover:border-accent/35 hover:text-foreground"
              } ${appBody}`}
            >
              Unknown unresolved: {unknownUnresolvedCount}
            </Link>
            {hasNonDefaultFilters ? (
              <Link
                href={defaultScopeHref}
                className={`rounded-lg border border-border px-3 py-1.5 font-medium text-foreground/85 transition-colors hover:border-accent/35 hover:text-foreground ${appBody}`}
              >
                Reset filters
              </Link>
            ) : null}
            {filteredIngest[0] ? (
              <CopyCommandButton
                content={filteredIngest[0].id}
                idleLabel="Copy latest incident ID"
                copiedLabel="Incident ID copied"
              />
            ) : null}
            {filteredIngest[0] ? (
              <Link
                href={`/incidents/${filteredIngest[0].id}`}
                className={`rounded-lg border border-border px-3 py-1.5 font-medium text-foreground/85 transition-colors hover:border-accent/35 hover:text-foreground ${appBody}`}
              >
                Open latest incident
              </Link>
            ) : null}
          </div>
        </div>
        <form method="GET" className="mt-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="window" value={windowFilter} />
          <input type="hidden" name="sort" value={sortFilter} />
          <input type="hidden" name="limit" value={String(rowLimit)} />
          <input type="hidden" name="status" value={statusFilter} />
          {vendorFilter ? <input type="hidden" name="vendor" value={vendorFilter} /> : null}
          {autoRefreshEnabled ? <input type="hidden" name="auto" value="1" /> : null}
          {returnHref ? <input type="hidden" name="next" value={returnHref} /> : null}
          {setupStep ? <input type="hidden" name="setup_step" value={setupStep} /> : null}
          <input
            type="text"
            name="q"
            defaultValue={queryFilter}
            placeholder="Search title, vendor, external ref…"
            className={`h-9 min-w-[220px] rounded-lg border border-border bg-black/25 px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
          />
          <button
            type="submit"
            className={`rounded-lg border border-border px-3 py-1.5 font-medium text-foreground/85 transition-colors hover:border-accent/35 hover:text-foreground ${appBody}`}
          >
            Apply search
          </button>
          {queryFilter ? (
            <Link
              href={`/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=${rowLimit}${vendorFilter ? `&vendor=${vendorFilter}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}`}
              className={`rounded-lg border border-border px-3 py-1.5 font-medium text-foreground/85 transition-colors hover:border-accent/35 hover:text-foreground ${appBody}`}
            >
              Clear search
            </Link>
          ) : null}
        </form>
        {vendorFilter === "unknown" ? (
          <div className="mt-3 rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 py-3">
            <p className={`text-amber-300 ${appBody}`}>
              Unknown vendor events usually mean the payload did not match a known adapter shape or
              the source hint header was missing.
            </p>
            <ul className={`mt-2 list-inside list-disc space-y-1 text-foreground/80 ${appBody}`}>
              <li>
                Set <span className="font-mono">X-Zentro-Alert-Source</span> to{" "}
                <span className="font-mono">datadog</span>,{" "}
                <span className="font-mono">prometheus</span>,{" "}
                <span className="font-mono">pagerduty</span>, or{" "}
                <span className="font-mono">newrelic</span>.
              </li>
              <li>Use one of the inbound adapter templates below as a payload baseline.</li>
              <li>
                Compare the event&apos;s external ref and copied JSON row snapshot with adapter docs.
              </li>
            </ul>
            <div className="mt-3">
              <Link
                href={`/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=${rowLimit}&status=unresolved&vendor=unknown${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}`}
                className={`inline-flex rounded-lg border border-amber-400/35 bg-amber-400/10 px-3 py-1.5 font-medium text-amber-300 transition-colors hover:border-amber-300/45 hover:text-amber-200 ${appBody}`}
              >
                Show unresolved unknown only
              </Link>
            </div>
          </div>
        ) : null}
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              label: "All",
              count: vendorCounts.all,
              href: `/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=${rowLimit}&status=${statusFilter}${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}`,
              active: vendorFilter === "",
            },
            {
              label: "Datadog",
              count: vendorCounts.datadog,
              href: `/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=${rowLimit}&status=${statusFilter}&vendor=datadog${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}`,
              active: vendorFilter === "datadog",
            },
            {
              label: "Prometheus/Grafana",
              count: vendorCounts.prometheus,
              href: `/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=${rowLimit}&status=${statusFilter}&vendor=prometheus${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}`,
              active: vendorFilter === "prometheus",
            },
            {
              label: "PagerDuty",
              count: vendorCounts.pagerduty,
              href: `/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=${rowLimit}&status=${statusFilter}&vendor=pagerduty${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}`,
              active: vendorFilter === "pagerduty",
            },
            {
              label: "New Relic",
              count: vendorCounts.newrelic,
              href: `/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=${rowLimit}&status=${statusFilter}&vendor=newrelic${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}`,
              active: vendorFilter === "newrelic",
            },
            {
              label: "Unknown",
              count: vendorCounts.unknown,
              href: `/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=${rowLimit}&status=${statusFilter}&vendor=unknown${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}`,
              active: vendorFilter === "unknown",
            },
          ].map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className={`rounded-xl border px-3 py-2 transition-colors ${
                card.active
                  ? "border-accent/60 bg-accent/10"
                  : "border-white/[0.08] bg-black/25 hover:border-accent/35"
              }`}
            >
              <p className={appMeta}>{card.label}</p>
              <p className="text-base font-semibold text-foreground">{card.count}</p>
            </Link>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { key: "24h", label: "24h", href: "/settings/connectors?window=24h" },
            { key: "7d", label: "7d", href: "/settings/connectors?window=7d" },
            { key: "30d", label: "30d", href: "/settings/connectors?window=30d" },
            { key: "all", label: "All time", href: "/settings/connectors?window=all" },
          ].map((w) => {
            const active = windowFilter === w.key;
            return (
              <Link
                key={w.href}
                href={`${w.href}&sort=${sortFilter}&limit=${rowLimit}&status=${statusFilter}${vendorFilter ? `&vendor=${vendorFilter}` : ""}${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}`}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-accent/60 bg-accent/10 text-accent"
                    : "border-white/[0.12] text-foreground/75 hover:border-accent/35 hover:text-foreground"
                }`}
              >
                {w.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { key: "newest", label: "Newest first", href: `/settings/connectors?window=${windowFilter}${vendorFilter ? `&vendor=${vendorFilter}` : ""}&sort=newest${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}` },
            { key: "oldest", label: "Oldest first", href: `/settings/connectors?window=${windowFilter}${vendorFilter ? `&vendor=${vendorFilter}` : ""}&sort=oldest${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}` },
          ].map((s) => {
            const active = sortFilter === s.key;
            return (
              <Link
                key={s.href}
                href={`${s.href}&limit=${rowLimit}&status=${statusFilter}${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}`}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-accent/60 bg-accent/10 text-accent"
                    : "border-white/[0.12] text-foreground/75 hover:border-accent/35 hover:text-foreground"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { key: 5, label: "5 rows" },
            { key: 10, label: "10 rows" },
            { key: 25, label: "25 rows" },
          ].map((l) => {
            const active = rowLimit === l.key;
            return (
              <Link
                key={l.key}
                href={`/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=${l.key}&status=${statusFilter}${vendorFilter ? `&vendor=${vendorFilter}` : ""}${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}`}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-accent/60 bg-accent/10 text-accent"
                    : "border-white/[0.12] text-foreground/75 hover:border-accent/35 hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { key: "all", label: "All status" },
            { key: "unresolved", label: "Unresolved" },
            { key: "investigating", label: "Investigating" },
            { key: "mitigated", label: "Mitigated" },
            { key: "monitoring", label: "Monitoring" },
            { key: "resolved", label: "Resolved" },
          ].map((s) => {
            const active = statusFilter === s.key;
            return (
              <Link
                key={s.key}
                href={`/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=${rowLimit}&status=${s.key}${vendorFilter ? `&vendor=${vendorFilter}` : ""}${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}`}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-accent/60 bg-accent/10 text-accent"
                    : "border-white/[0.12] text-foreground/75 hover:border-accent/35 hover:text-foreground"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { key: "", label: "All", href: `/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=${rowLimit}&status=${statusFilter}${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}` },
            { key: "datadog", label: "Datadog", href: `/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=${rowLimit}&status=${statusFilter}&vendor=datadog${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}` },
            { key: "prometheus", label: "Prometheus/Grafana", href: `/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=${rowLimit}&status=${statusFilter}&vendor=prometheus${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}` },
            { key: "pagerduty", label: "PagerDuty", href: `/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=${rowLimit}&status=${statusFilter}&vendor=pagerduty${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}` },
            { key: "newrelic", label: "New Relic", href: `/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=${rowLimit}&status=${statusFilter}&vendor=newrelic${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}` },
            { key: "unknown", label: "Unknown", href: `/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=${rowLimit}&status=${statusFilter}&vendor=unknown${queryFilter ? `&q=${encodeURIComponent(queryFilter)}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}` },
          ].map((f) => {
            const active = vendorFilter === f.key;
            return (
              <Link
                key={f.href}
                href={f.href}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-accent/60 bg-accent/10 text-accent"
                    : "border-white/[0.12] text-foreground/75 hover:border-accent/35 hover:text-foreground"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={appMeta}>Legend:</span>
          <span className="rounded-full border border-danger/40 bg-danger-dim/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-danger">
            urgent
          </span>
          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
            warning
          </span>
          <span className="rounded-full border border-sky-400/40 bg-sky-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-300">
            monitoring
          </span>
          <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
            healthy / resolved
          </span>
        </div>
        {filteredIngest.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <div className="mb-3 flex justify-end">
              <details className="rounded-lg border border-white/[0.12] bg-black/25">
                <summary
                  className={`cursor-pointer list-none px-3 py-1.5 font-medium text-foreground/85 transition-colors hover:text-foreground ${appBody}`}
                >
                  Export & share
                </summary>
                <div className="grid gap-2 border-t border-white/[0.1] p-2 sm:grid-cols-2">
                  <a
                    href={markdownHref}
                    download={markdownFilename}
                    className={`rounded-lg border border-border px-3 py-1.5 font-medium text-foreground/85 transition-colors hover:border-accent/35 hover:text-foreground ${appBody}`}
                  >
                    Download Markdown
                  </a>
                  <a
                    href={jsonHref}
                    download={jsonFilename}
                    className={`rounded-lg border border-border px-3 py-1.5 font-medium text-foreground/85 transition-colors hover:border-accent/35 hover:text-foreground ${appBody}`}
                  >
                    Download JSON
                  </a>
                  <a
                    href={csvHref}
                    download={csvFilename}
                    className={`rounded-lg border border-border px-3 py-1.5 font-medium text-foreground/85 transition-colors hover:border-accent/35 hover:text-foreground ${appBody}`}
                  >
                    Export CSV
                  </a>
                  <CopyCommandButton
                    content={filteredShareUrl}
                    idleLabel="Copy filtered link"
                    copiedLabel="Link copied"
                  />
                  <CopyCommandButton
                    content={jsonReport}
                    idleLabel="Copy JSON report"
                    copiedLabel="JSON report copied"
                  />
                  <CopyCommandButton
                    content={markdownReport}
                    idleLabel="Copy MD report"
                    copiedLabel="MD report copied"
                  />
                </div>
              </details>
            </div>
            <table className="w-full min-w-[680px] border-collapse text-left">
              <thead>
                <tr className={`border-b border-white/[0.08] ${appMeta}`}>
                  <th className="sticky top-0 z-10 bg-black/95 py-2 pr-3 font-medium text-foreground/80">Vendor</th>
                  <th className="sticky top-0 z-10 bg-black/95 py-2 pr-3 font-medium text-foreground/80">Incident</th>
                  <th className="sticky top-0 z-10 bg-black/95 py-2 pr-3 font-medium text-foreground/80">Status</th>
                  <th className="sticky top-0 z-10 bg-black/95 py-2 pr-3 font-medium text-foreground/80">Severity</th>
                  <th className="sticky top-0 z-10 bg-black/95 py-2 pr-3 font-medium text-foreground/80">Age</th>
                  <th className="sticky top-0 z-10 bg-black/95 py-2 pr-3 font-medium text-foreground/80">Created</th>
                  <th className="sticky top-0 z-10 bg-black/95 py-2 pr-3 font-medium text-foreground/80">Reference</th>
                  <th className="sticky top-0 z-10 bg-black/95 py-2 pr-3 font-medium text-foreground/80">Snapshot</th>
                  <th className="sticky top-0 z-10 bg-black/95 py-2 pr-3 font-medium text-foreground/80">Markdown</th>
                  <th className="sticky top-0 z-10 bg-black/95 py-2 font-medium text-foreground/80">Open</th>
                </tr>
              </thead>
              <tbody>
                {filteredIngest.map((row) => (
                  <tr key={row.id} className={`border-b border-white/[0.05] align-top ${appBody}`}>
                    <td className="py-2 pr-3">
                      <span className="rounded-full border border-white/[0.12] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/80">
                        {row.vendor}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <p className="font-medium text-foreground/90">{row.title}</p>
                      {row.externalRef ? (
                        <p className={`mt-1 font-mono ${appMeta}`}>{row.externalRef}</p>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBadgeClass(
                          row.status,
                        )}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${severityBadgeClass(
                          row.severity,
                        )}`}
                      >
                        {row.severity}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${ageBadgeClass(
                          row.createdAt,
                          row.status,
                        )}`}
                      >
                        {relativeAgeLabel(row.createdAt)}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-foreground/75">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 pr-3">
                      {row.externalRef ? (
                        <CopyCommandButton
                          content={row.externalRef}
                          idleLabel="Copy ref"
                          copiedLabel="Ref copied"
                        />
                      ) : (
                        <span className={appMeta}>n/a</span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <CopyCommandButton
                        content={JSON.stringify(
                          {
                            vendor: row.vendor,
                            incident_id: row.id,
                            title: row.title,
                            status: row.status,
                            severity: row.severity,
                            created_at: row.createdAt,
                            external_ref: row.externalRef,
                          },
                          null,
                          2,
                        )}
                        idleLabel="Copy JSON"
                        copiedLabel="JSON copied"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <CopyCommandButton
                        content={`- **${row.vendor}** · \`${row.status}\` · \`${row.severity}\` · ${new Date(
                          row.createdAt,
                        ).toLocaleString()} · [Incident ${row.id}](${siteUrl}/incidents/${row.id})${
                          row.externalRef ? ` · \`${row.externalRef}\`` : ""
                        }`}
                        idleLabel="Copy MD"
                        copiedLabel="MD copied"
                      />
                    </td>
                    <td className="py-2">
                      <Link href={`/incidents/${row.id}`} className="font-medium text-accent hover:underline">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3">
            <p className={`text-muted ${appBody}`}>
              No ingest events match the current filters.
            </p>
            <p className={`mt-1 ${appMeta}`}>
              window={windowFilter} · vendor={vendorFilter || "all"} · sort={sortFilter} ·
              limit={rowLimit}
              {queryFilter ? ` · q=${queryFilter}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {queryFilter ? (
                <Link
                  href={`/settings/connectors?window=${windowFilter}&sort=${sortFilter}&limit=${rowLimit}${vendorFilter ? `&vendor=${vendorFilter}` : ""}${autoRefreshEnabled ? "&auto=1" : ""}${wizardContextSuffix}`}
                  className={`rounded-lg border border-border px-3 py-1.5 font-medium text-foreground/85 transition-colors hover:border-accent/35 hover:text-foreground ${appBody}`}
                >
                  Clear search
                </Link>
              ) : null}
              <Link
                href={defaultScopeHref}
                className={`rounded-lg border border-border px-3 py-1.5 font-medium text-foreground/85 transition-colors hover:border-accent/35 hover:text-foreground ${appBody}`}
              >
                Reset all filters
              </Link>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
