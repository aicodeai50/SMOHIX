import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsoleAmbientBanner } from "@/components/console/ConsoleAmbientBanner";
import { ComplianceControlTags } from "@/components/compliance/ComplianceControlTags";
import { AuditIntentTags } from "@/components/guardrails/AuditIntentTags";
import { listAuditEntriesForUser } from "@/lib/audit/data";
import { auditRoleFilterLabel, canExportOrgAuditLog } from "@/lib/audit/role-filter";
import { auditSinceIsoFromWindow, auditWindowToSinceIso } from "@/lib/audit/export-window";
import { loadConsoleAmbientSnapshot } from "@/lib/console/load-ambient-status";
import { getOrgContextForUser } from "@/lib/org/context";
import type { OrgRole } from "@/lib/org/roles";
import { roleLabel } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { appBody, appMeta } from "@/lib/app-typography";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Audit log",
  description: "Immutable record of actions and approvals.",
};

export const dynamic = "force-dynamic";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; window?: string }>;
}) {
  const sp = await searchParams;
  const scopeRaw = typeof sp.scope === "string" ? sp.scope.trim().toLowerCase() : "";
  const windowRaw = typeof sp.window === "string" ? sp.window.trim().toLowerCase() : "";
  const scope = scopeRaw === "slack" ? "slack" : "all";
  const slackOnly = scope === "slack";
  const windowValue = auditWindowToSinceIso(windowRaw);
  const sinceIso = auditSinceIsoFromWindow(windowValue);
  let userId: string | null = null;
  let orgId: string | null = null;
  let orgName: string | null = null;
  let orgRole: OrgRole | null = null;
  if (hasSupabaseAuth()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const nextParams = new URLSearchParams();
      if (slackOnly) nextParams.set("scope", "slack");
      if (windowValue !== "all") nextParams.set("window", windowValue);
      const nextAudit = nextParams.toString() ? `/audit?${nextParams}` : "/audit";
      redirect(`/auth/sign-in?next=${encodeURIComponent(nextAudit)}`);
    }
    userId = user.id;
    const orgContext = await getOrgContextForUser(user.id);
    orgId = orgContext.orgId;
    orgName = orgContext.orgName;
    orgRole = orgContext.role;
  }

  const { source, rows } = await listAuditEntriesForUser(userId, {
    eventPrefix: slackOnly ? "slack." : null,
    sinceIso,
    orgId,
    orgRole,
  });
  const roleFilterNote = auditRoleFilterLabel(orgRole);
  const canExport = canExportOrgAuditLog(orgRole);
  const slackSentCount = rows.filter((r) => r.action === "slack.sent").length;
  const slackSkippedCount = rows.filter((r) => r.action === "slack.skipped").length;
  const slackFailedCount = rows.filter((r) => r.action === "slack.failed").length;
  const allHref = windowValue === "all" ? "/audit" : `/audit?window=${encodeURIComponent(windowValue)}`;
  const slackHref =
    windowValue === "all" ? "/audit?scope=slack" : `/audit?scope=slack&window=${encodeURIComponent(windowValue)}`;
  const allWindowHref = (w: "24h" | "7d" | "30d" | "all") =>
    w === "all" ? "/audit" : `/audit?window=${w}`;
  const slackWindowHref = (w: "24h" | "7d" | "30d" | "all") =>
    w === "all" ? "/audit?scope=slack" : `/audit?scope=slack&window=${w}`;
  const slackExportHref =
    windowValue === "all"
      ? "/api/audit/slack-events/export"
      : `/api/audit/slack-events/export?window=${encodeURIComponent(windowValue)}`;
  const allExportHref =
    windowValue === "all"
      ? "/api/audit/export"
      : `/api/audit/export?window=${encodeURIComponent(windowValue)}`;

  const ambient = await loadConsoleAmbientSnapshot({ context: "audit" });

  return (
    <>
      <PageHeader
        eyebrow="Knowledge & governance"
        title="Audit log"
        description="Append-only log for billing sync, API keys, approvals, and automation events — mapped to SOC 2 / ISO 27001 controls."
      />
      <ConsoleAmbientBanner snapshot={ambient} />
      <p className={`-mt-4 mb-4 ${appMeta}`}>
        <Link href="/governance/compliance" className="text-accent hover:underline">
          Compliance control mapping
        </Link>
        {orgId && orgName ? (
          <>
            {" · "}
            <span className="text-muted">
              Org scope: {orgName}
              {orgRole ? ` (${roleLabel(orgRole)})` : ""}
            </span>
          </>
        ) : null}
      </p>
      {roleFilterNote ? (
        <p className={`mb-4 ${appMeta} text-muted`}>{roleFilterNote}</p>
      ) : null}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href={allHref}
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
            !slackOnly
              ? "border-accent/45 bg-accent/10 text-accent"
              : "border-white/[0.14] text-foreground/75 hover:border-accent/35 hover:text-foreground"
          }`}
          aria-current={!slackOnly ? "page" : undefined}
        >
          All events
        </Link>
        <Link
          href={slackHref}
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
            slackOnly
              ? "border-accent/45 bg-accent/10 text-accent"
              : "border-white/[0.14] text-foreground/75 hover:border-accent/35 hover:text-foreground"
          }`}
          aria-current={slackOnly ? "page" : undefined}
        >
          Slack events
        </Link>
      </div>
      {!slackOnly ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(["24h", "7d", "30d", "all"] as const).map((w) => (
            <Link
              key={w}
              href={allWindowHref(w)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                windowValue === w
                  ? "border-accent/45 bg-accent/10 text-accent"
                  : "border-white/[0.14] text-foreground/75 hover:border-accent/35 hover:text-foreground"
              }`}
              aria-current={windowValue === w ? "page" : undefined}
            >
              {w}
            </Link>
          ))}
          {source === "database" && canExport ? (
            <a
              href={allExportHref}
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground"
            >
              Export CSV
            </a>
          ) : null}
        </div>
      ) : null}
      {slackOnly ? (
        <div className="mb-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {(["24h", "7d", "30d", "all"] as const).map((w) => (
              <Link
                key={w}
                href={slackWindowHref(w)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                  windowValue === w
                    ? "border-accent/45 bg-accent/10 text-accent"
                    : "border-white/[0.14] text-foreground/75 hover:border-accent/35 hover:text-foreground"
                }`}
                aria-current={windowValue === w ? "page" : undefined}
              >
                {w}
              </Link>
            ))}
            {source === "database" && canExport ? (
              <a
                href={slackExportHref}
                className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground`}
              >
                Export CSV
              </a>
            ) : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-400/35 bg-emerald-400/10 px-3 py-2">
              <p className={`text-emerald-300 ${appMeta}`}>Sent</p>
              <p className={`font-semibold text-emerald-200 ${appBody}`}>{slackSentCount}</p>
            </div>
            <div className="rounded-xl border border-amber-400/35 bg-amber-400/10 px-3 py-2">
              <p className={`text-amber-300 ${appMeta}`}>Skipped</p>
              <p className={`font-semibold text-amber-200 ${appBody}`}>{slackSkippedCount}</p>
            </div>
            <div className="rounded-xl border border-danger/35 bg-danger-dim/30 px-3 py-2">
              <p className={`text-danger ${appMeta}`}>Failed</p>
              <p className={`font-semibold text-danger ${appBody}`}>{slackFailedCount}</p>
            </div>
          </div>
        </div>
      ) : null}
      {source === "session" ? (
        <p className={`smohix-glass-subtle mb-4 rounded-xl px-4 py-3 ${appMeta}`}>
          Sign in with Supabase auth to load your <span className="font-mono">audit_log</span>{" "}
          entries. The log records billing sync, API key changes, approvals, and other actions.
        </p>
      ) : hasSupabaseAuth() && userId && rows.length === 0 ? (
        <p className={`smohix-glass-subtle mb-4 rounded-xl px-4 py-3 ${appMeta}`}>
          No events yet. Approvals, API key changes, billing sync, and automation evidence appear here
          as your workspace generates activity.
        </p>
      ) : null}
      {rows.length === 0 ? (
        <ConsoleEmptyState
          title={source === "session" ? "Sign in to see audit history" : "No audit events yet"}
          description={
            source === "session"
              ? "The audit log is stored per account. Sign in to load append-only evidence events."
              : "When operators approve changes, rotate keys, or run automations, those events appear here as durable evidence."
          }
          ctas={
            source === "session"
              ? [{ href: "/auth/sign-in?next=/audit", label: "Sign in" }]
              : [
                  { href: "/approvals", label: "Open approvals", variant: "secondary" },
                  { href: "/automations", label: "Run a dry-run" },
                ]
          }
          footnote={
            source !== "session" ? (
              <span>
                Technical retention and append configuration lives under{" "}
                <a href="/settings/deployment" className="font-medium text-accent hover:underline">
                  Settings → Security &amp; residency
                </a>
                .
              </span>
            ) : undefined
          }
        />
      ) : (
      <div className="smohix-table-wrap">
        <table className={`w-full text-left ${appBody}`}>
          <thead className="border-b border-white/[0.06] bg-white/[0.03] font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
            <tr>
              <th className="px-4 py-3.5">Time (UTC)</th>
              <th className="px-4 py-3.5">Actor</th>
              <th className="px-4 py-3.5">Action</th>
              <th className="px-4 py-3.5">Details</th>
              <th className="px-4 py-3.5">Incident</th>
              <th className="px-4 py-3.5">Intent</th>
              <th className="px-4 py-3.5">Controls</th>
              <th className="px-4 py-3.5">Outcome</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-white/[0.05] font-mono ${appMeta}`}>
            {rows.map((e, i) => (
                <tr
                  key={e.id}
                  className={`transition-colors hover:bg-white/[0.03] ${
                    i === 0
                      ? "smohix-temporal-current"
                      : i < 4
                        ? "smohix-temporal-recent"
                        : "smohix-temporal-past"
                  }`}
                >
                  <td className="px-4 py-3 text-muted">{e.ts}</td>
                  <td className="px-4 py-3 text-foreground">{e.actor}</td>
                  <td className="px-4 py-3 text-accent">{e.action}</td>
                  <td className="max-w-md truncate px-4 py-3 text-muted" title={e.target}>
                    {e.target}
                  </td>
                  <td className="px-4 py-3 font-sans text-[11px]">
                    {e.incidentId ? (
                      <Link
                        href={`/incidents/${encodeURIComponent(e.incidentId)}`}
                        className="text-accent hover:underline"
                      >
                        View incident
                      </Link>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top font-sans text-[11px]">
                    <AuditIntentTags tags={e.tags} />
                  </td>
                  <td className="px-4 py-3 align-top font-sans text-[11px]">
                    <ComplianceControlTags controls={e.complianceControls} />
                  </td>
                  <td className="px-4 py-3 capitalize text-muted">{e.outcome}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      )}
    </>
  );
}
