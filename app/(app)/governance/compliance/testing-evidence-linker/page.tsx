import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildControlTestingEvidenceLinkerPack } from "@/lib/compliance/control-testing-evidence-linker";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { materializeTestingLinksAction } from "./actions";

export const metadata: Metadata = {
  title: "Testing evidence linker",
  description: "Link automation dry-run outputs to control evidence bundles for assessor export.",
};

export const dynamic = "force-dynamic";

export default async function TestingEvidenceLinkerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; linked?: string }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Testing evidence linker"
        description="Sign in to link control test runs to evidence bundles."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/testing-evidence-linker");
  }

  const sp = await searchParams;
  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;
  const canMaterialize = orgContext.role ? canManageMembers(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildControlTestingEvidenceLinkerPack(user.id, {
        orgId: orgContext.orgId,
        periodDays: 30,
        supabase,
      })
    : null;

  const err = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Control testing evidence linker"
        description="Maps automation dry-run outputs (playbook tests) to catalog controls via accepted policy guardrails, then aligns each run with tamper-evident evidence bundles in the same window — included in the assessor workbook ZIP."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Linker unavailable"
          description="Join an organization with automation dry-runs and evidence bundles to compute test-to-bundle links."
          ctas={[
            { href: "/governance/compliance/testing-schedules", label: "Testing schedules" },
            { href: "/governance/compliance/bundles", label: "Evidence bundles" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/testing-evidence-linker?periodDays=30&format=csv"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/testing-evidence-linker?periodDays=30&format=json"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
            {canMaterialize ? (
              <form action={materializeTestingLinksAction}>
                <button
                  type="submit"
                  className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent hover:border-accent/60"
                >
                  Record for assessor export
                </button>
              </form>
            ) : null}
            <Link
              href="/governance/compliance/workbook"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Assessor workbook
            </Link>
          </div>

          {err ? (
            <p className={`mb-4 ${appMeta} text-danger`}>{decodeURIComponent(err)}</p>
          ) : null}
          {sp.linked === "1" ? (
            <p className={`mb-4 ${appMeta} text-emerald-300`}>
              Links recorded in org audit log for assessor export ({pack.linkCount} control link(s)).
            </p>
          ) : null}

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
              <p className={appOverline}>Dry runs</p>
              <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>{pack.dryRunCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Control links</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{pack.linkCount}</p>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
              <p className={appOverline}>In bundle window</p>
              <p className={`mt-1 text-2xl font-semibold text-emerald-300 ${appBody}`}>
                {pack.linkedToBundleCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Schedule coverage</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.scheduleCoveragePercent}%
              </p>
            </div>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <PlaceholderCard title="Recent links">
              {pack.links.length === 0 ? (
                <p className={appMeta}>No automation dry-runs in the last {pack.periodDays} days.</p>
              ) : (
                <ul className={`space-y-2 ${appBody}`}>
                  {pack.links.slice(0, 14).map((l) => (
                    <li key={l.linkId}>
                      <span className={l.ok ? "text-emerald-300" : "text-danger"}>
                        {l.ok ? "pass" : "fail"}
                      </span>{" "}
                      · {l.playbookName} → {l.frameworkLabel} {l.controlRef}
                      <span className={appMeta}>
                        {" "}
                        · {l.linkStatus}
                        {l.bundleWindowLabel ? ` · bundle ${l.bundleWindowLabel}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </PlaceholderCard>

            <PlaceholderCard title="Schedule coverage">
              {pack.scheduleCoverage.length === 0 ? (
                <p className={appMeta}>No scheduled control tests in horizon.</p>
              ) : (
                <ul className={`space-y-2 ${appBody}`}>
                  {pack.scheduleCoverage.slice(0, 10).map((s) => (
                    <li key={s.scheduleId}>
                      <Link href={s.href} className="text-accent hover:underline">
                        {s.title}
                      </Link>
                      <span className={appMeta}>
                        {" "}
                        — {s.linkedControlCount}/{s.controlCount} linked ({s.coveragePercent}%)
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </PlaceholderCard>
          </div>

          {pack.unlinkedRunCount > 0 ? (
            <p className={appMeta}>
              {pack.unlinkedRunCount} dry-run(s) have controls not covered by an evidence bundle window —
              create a bundle or widen the collection window.
            </p>
          ) : null}
        </>
      )}
    </>
  );
}
