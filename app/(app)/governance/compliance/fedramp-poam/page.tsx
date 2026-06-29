import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import {
  buildFedrampPoamPack,
  CATALOG_NIST_800_53_LINKS,
  FEDRAMP_POAM_SOURCE_FRAMEWORKS,
} from "@/lib/compliance/fedramp-poam";
import { getOrgContextForUser } from "@/lib/org/context";
import { isReadOnlyAuditorRole } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "FedRAMP POA&M export",
  description: "Plan of Action and Milestones CSV from continuous assessment gaps mapped to NIST SP 800-53.",
};

export const dynamic = "force-dynamic";

const RISK_STYLE: Record<string, string> = {
  High: "text-danger",
  Moderate: "text-warning",
  Low: "text-muted",
};

export default async function FedrampPoamPage() {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="FedRAMP POA&M"
          description="Sign in to export a FedRAMP-oriented Plan of Action and Milestones pack."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/fedramp-poam");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isReadOnlyAuditorRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildFedrampPoamPack(user.id, { orgId: orgContext.orgId, periodDays: 30, supabase })
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="FedRAMP POA&M export pack"
        description="Plan of Action and Milestones derived from SOC 2, ISO 27001, and CMMC L2 continuous assessment exceptions, mapped to NIST SP 800-53 Rev 5 controls for FedRAMP-oriented authorization packages."
      />
      <p className={`-mt-4 mb-6 ${appBody}`}>
        <Link href="/settings/deployment" className="text-accent hover:underline">
          Deployment profile
        </Link>
        {" · "}
        <Link href="/governance/compliance/type-ii" className="text-accent hover:underline">
          SOC 2 Type II
        </Link>
        {" · "}
        <Link href="/governance/compliance/cmmc-l2" className="text-accent hover:underline">
          CMMC L2
        </Link>
        {" · "}
        <Link href="/governance/compliance/program" className="text-accent hover:underline">
          Program dashboard
        </Link>
        {readOnly ? (
          <>
            {" · "}
            <span className="text-indigo-200">Auditor read-only workspace</span>
          </>
        ) : null}
      </p>

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Organization required"
          description="Create an organization to generate a FedRAMP POA&M export from continuous assessment gaps."
          ctas={[{ href: "/settings/members", label: "Members & roles" }]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/fedramp-poam?periodDays=30"
              className="inline-flex h-10 items-center rounded-lg border border-accent/40 bg-accent/10 px-4 font-medium text-accent hover:bg-accent/15"
            >
              Download POA&M CSV (30d)
            </a>
            <a
              href="/api/governance/compliance/fedramp-poam?periodDays=30&format=json"
              className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35 ${appBody}`}
            >
              Export JSON
            </a>
            <a
              href="/api/governance/compliance/fedramp-poam?periodDays=90"
              className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35 ${appBody}`}
            >
              90-day window
            </a>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-3">
              <p className={appOverline}>POA&M rows</p>
              <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>{pack.poamRowCount}</p>
              <p className={`${appMeta} text-muted`}>Unique NIST 800-53 controls</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Gap sources</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{pack.gapSourceCount}</p>
              <p className={`${appMeta} text-muted`}>Assessment exceptions</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>NIST mappings</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {CATALOG_NIST_800_53_LINKS.length}
              </p>
              <p className={`${appMeta} text-muted`}>Curated catalog crosswalk</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Deployment tier</p>
              <p className={`mt-1 text-lg font-semibold capitalize text-foreground ${appBody}`}>
                {pack.deploymentTier?.replace(/_/g, " ") ?? "—"}
              </p>
              <p className={`${appMeta} text-muted`}>
                {pack.dataRegion ?? "—"} · {pack.dataBoundary ?? "—"}
              </p>
            </div>
          </div>

          {pack.unmappedGapCount > 0 ? (
            <p className={`mb-4 rounded-xl border border-warning/35 bg-warning/10 px-4 py-3 text-warning ${appBody}`}>
              {pack.unmappedGapCount} gap(s) had no NIST 800-53 mapping in the curated crosswalk and were
              omitted from the POA&M.
            </p>
          ) : null}

          <ConsolePanel title="POA&M preview (open items)">
            {pack.rows.length === 0 ? (
              <p className={`${appMeta} text-emerald-300`}>
                No open POA&M items — continuous assessment found no exceptions in the{" "}
                {pack.periodDays}-day window across{" "}
                {FEDRAMP_POAM_SOURCE_FRAMEWORKS.map((f) => f.replace("_", " ")).join(", ")}.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className={`w-full text-left ${appBody}`}>
                  <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-3 py-2">POA&M ID</th>
                      <th className="px-3 py-2">NIST control</th>
                      <th className="px-3 py-2">Risk</th>
                      <th className="px-3 py-2">Due</th>
                      <th className="px-3 py-2">Sources</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-border ${appMeta}`}>
                    {pack.rows.slice(0, 20).map((row) => (
                      <tr key={row.poamId}>
                        <td className="px-3 py-3 font-mono text-[11px]">{row.poamId}</td>
                        <td className="px-3 py-3">
                          <span className="font-mono text-foreground/90">{row.nistControlId}</span>
                          <span className="block text-muted">{row.nistControlTitle}</span>
                        </td>
                        <td className={`px-3 py-3 font-medium ${RISK_STYLE[row.riskRating] ?? ""}`}>
                          {row.riskRating}
                        </td>
                        <td className="px-3 py-3 text-muted">{row.scheduledCompletionDate}</td>
                        <td className="px-3 py-3 text-muted">{row.sourceControlRefs.join("; ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pack.rows.length > 20 ? (
                  <p className={`mt-3 ${appMeta} text-muted`}>
                    Showing 20 of {pack.rows.length} rows — download CSV for the full POA&M.
                  </p>
                ) : null}
              </div>
            )}
          </ConsolePanel>
        </>
      )}
    </>
  );
}
