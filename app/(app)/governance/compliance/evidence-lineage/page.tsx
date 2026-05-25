import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildEvidenceLineagePack } from "@/lib/compliance/evidence-lineage";
import { FRAMEWORK_CONSOLE_PATHS } from "@/lib/compliance/baseline-comparison";
import type { ComplianceFramework } from "@/lib/compliance/types";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Evidence lineage",
  description: "Trace audit and policy evidence through bundles to assessor exports.",
};

export const dynamic = "force-dynamic";

const STATUS_DOT: Record<string, string> = {
  covered: "bg-emerald-400",
  partial: "bg-amber-400",
  none: "bg-white/25",
};

export default async function EvidenceLineagePage() {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Evidence lineage"
        description="Sign in to trace evidence from audit log through assessor bundles."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/evidence-lineage");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildEvidenceLineagePack(user.id, {
        orgId: orgContext.orgId,
        periodDays: 30,
        supabase,
      })
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Compliance evidence lineage"
        description="End-to-end trace from org audit_log and accepted policies → control mapping → tamper-evident evidence bundles → assessor workbook ZIP."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Lineage unavailable"
          description="Join an organization with audit activity or accepted policies to trace evidence flows."
          ctas={[
            { href: "/audit", label: "Audit log" },
            { href: "/governance/compliance/bundles", label: "Evidence bundles" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/evidence-lineage?periodDays=30&format=csv"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/evidence-lineage?periodDays=30&format=json"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
            <Link
              href="/governance/compliance/workbook"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Assessor workbook
            </Link>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Audit events</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.auditEventsScanned}
              </p>
              <p className={`mt-1 ${appMeta} text-muted`}>{pack.periodDays}d</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Mapped controls</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.mappedControlCount}
              </p>
            </div>
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
              <p className={appOverline}>Evidence bundles</p>
              <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>{pack.bundleCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Workbook export</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.assessorWorkbookExported ? "Yes" : "—"}
              </p>
            </div>
          </div>

          <PlaceholderCard title="Evidence pipeline">
            <ol className={`space-y-3 ${appBody}`}>
              {pack.pipeline.map((stage, idx) => (
                <li
                  key={stage.stage}
                  className="flex flex-wrap items-start gap-3 rounded-lg border border-white/[0.08] px-4 py-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/35 bg-accent/10 text-xs font-semibold text-accent">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-foreground">{stage.label}</p>
                      <span className={`${appMeta} text-muted`}>{stage.count} linked</span>
                    </div>
                    <p className={`mt-1 ${appMeta} text-muted`}>{stage.detail}</p>
                    <Link
                      href={stage.href}
                      className="mt-2 inline-block text-[11px] font-semibold uppercase tracking-wide text-accent hover:underline"
                    >
                      Open
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          </PlaceholderCard>

          {pack.bundles.length > 0 ? (
            <div className="mt-6">
              <PlaceholderCard title="Recent evidence bundles">
                <ul className={`space-y-2 ${appBody}`}>
                  {pack.bundles.slice(0, 6).map((b) => (
                    <li
                      key={b.bundleId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.08] px-3 py-2"
                    >
                      <div>
                        <p className="font-mono text-sm text-foreground">{b.bundleId.slice(0, 8)}…</p>
                        <p className={`${appMeta} text-muted`}>
                          {b.windowLabel} · {b.auditEventCount} audit · {b.acceptedPolicyCount} policies
                        </p>
                      </div>
                      <span className={`${appMeta} text-muted`}>{b.deliveryStatus}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/governance/compliance/bundles"
                  className="mt-3 inline-block text-[11px] font-semibold uppercase tracking-wide text-accent hover:underline"
                >
                  All bundles
                </Link>
              </PlaceholderCard>
            </div>
          ) : null}

          <div className="mt-6">
            <PlaceholderCard title="Control evidence trails">
              {pack.trails.length === 0 ? (
                <p className={`${appMeta} text-muted`}>
                  No mapped controls in this window — add audit events or accept automation policies.
                </p>
              ) : (
                <ul className={`space-y-3 ${appBody}`}>
                  {pack.trails.slice(0, 35).map((trail) => (
                    <li
                      key={trail.controlId}
                      className="rounded-lg border border-white/[0.08] px-4 py-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[trail.status] ?? STATUS_DOT.none}`}
                          />
                          <span className="font-mono text-sm text-foreground">{trail.controlId}</span>
                          <span className={`${appMeta} text-muted`}>{trail.title}</span>
                        </div>
                        <span className={`${appMeta} text-muted`}>depth {trail.lineageDepth}</span>
                      </div>
                      {trail.auditSources.length > 0 ? (
                        <p className={`mt-2 font-mono text-xs text-foreground/80`}>
                          Audit:{" "}
                          {trail.auditSources
                            .slice(0, 3)
                            .map((a) => `${a.eventType} (${a.eventCount})`)
                            .join(" · ")}
                        </p>
                      ) : null}
                      {trail.policySources.length > 0 ? (
                        <p className={`mt-1 font-mono text-xs text-foreground/80`}>
                          Policy: {trail.policySources.map((p) => p.playbookId).join(", ")}
                        </p>
                      ) : null}
                      <p className={`mt-2 ${appMeta} text-muted`}>
                        {trail.inLatestBundle ? "In latest bundle" : "Not in latest bundle"}
                        {trail.inAssessorWorkbook ? " · workbook export" : ""}
                        {trail.bundleIds.length > 0 ? ` · ${trail.bundleIds.length} bundle(s)` : ""}
                      </p>
                      <Link
                        href={
                          FRAMEWORK_CONSOLE_PATHS[trail.framework as ComplianceFramework] ??
                          "/governance/compliance/program"
                        }
                        className="mt-2 inline-block text-[11px] font-semibold uppercase tracking-wide text-accent hover:underline"
                      >
                        Framework view
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </PlaceholderCard>
          </div>
        </>
      )}
    </>
  );
}
