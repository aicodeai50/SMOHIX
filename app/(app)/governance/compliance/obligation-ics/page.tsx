import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildComplianceObligationIcs } from "@/lib/compliance/compliance-obligation-ics";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { getSiteUrl } from "@/lib/site";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Compliance obligation ICS",
  description: "Subscribe to attestation, vendor review, and bundle deadlines in calendar apps.",
};

export const dynamic = "force-dynamic";

export default async function ObligationIcsPage() {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Compliance obligation ICS"
        description="Sign in to export GRC obligations for your calendar."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/obligation-ics");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildComplianceObligationIcs(user.id, {
        orgId: orgContext.orgId,
        horizonDays: 365,
        supabase,
      })
    : null;

  const downloadUrl = "/api/governance/compliance/obligation-ics?horizonDays=365";
  const assessorApiUrl = `${getSiteUrl()}/api/governance/compliance/assessor/obligation-ics?horizonDays=365`;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Compliance obligation ICS export"
        description="Download a standards-based iCalendar (.ics) feed of live attestation due dates, vendor reviews, evidence bundle cadence, framework checkpoints, testing schedules, and open assessor evidence requests."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="ICS export unavailable"
          description="Join an organization with compliance data to generate the obligation calendar."
          ctas={[
            { href: "/governance/compliance/calendar", label: "GRC calendar" },
            { href: "/governance/compliance/attestations", label: "Attestations" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
              <p className={appOverline}>Events in feed</p>
              <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>{pack.eventCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Horizon</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.horizonDays} days
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Calendar name</p>
              <p className={`mt-1 text-sm font-medium text-foreground ${appBody}`}>{pack.calendarName}</p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href={downloadUrl}
              className="rounded-full border border-accent/40 bg-accent/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent hover:bg-accent/25"
            >
              Download .ics
            </a>
            <Link
              href="/governance/compliance/calendar"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              GRC calendar
            </Link>
            <Link
              href="/governance/compliance/assessor-api"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Assessor API
            </Link>
          </div>

          <ConsolePanel title="Subscribe in your calendar app">
            <ol className={`list-decimal space-y-3 pl-5 ${appBody}`}>
              <li>
                Download the <strong>.ics</strong> file using the button above (includes obligations for the
                next {pack.horizonDays} days).
              </li>
              <li>
                <strong>Google Calendar:</strong> Settings → Import &amp; export → Import → select the file.
              </li>
              <li>
                <strong>Outlook:</strong> File → Open &amp; export → Import/Export → Import an iCalendar (.ics).
              </li>
              <li>
                <strong>Apple Calendar:</strong> File → Import → select the file.
              </li>
              <li>
                Re-import weekly (or after major GRC changes) to refresh deadlines from live org data.
              </li>
            </ol>
            <p className={`mt-4 ${appMeta} text-muted`}>{pack.subscriptionHint}</p>
            <p className={`mt-2 ${appMeta} text-muted`}>
              Assessor automation endpoint (Bearer <code className="text-foreground/80">zentro_ca_*</code>
              ):{" "}
              <span className="break-all text-foreground/70">{assessorApiUrl}</span>
            </p>
          </ConsolePanel>
        </>
      )}
    </>
  );
}
