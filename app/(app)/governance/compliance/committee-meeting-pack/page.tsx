import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import {
  buildCommitteeMeetingPackFiles,
  COMPLIANCE_COMMITTEE_MEETING_PACK_VERSION,
} from "@/lib/compliance/compliance-committee-meeting-pack";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Committee meeting pack",
  description:
    "ZIP bundle with printable committee summary, health scorecard, posture, exceptions, and open gaps.",
};

export const dynamic = "force-dynamic";

const PACK_SECTIONS = [
  {
    folder: "(root)",
    label: "Committee brief",
    files: ["committee-pack-summary.html", "committee-pack-summary.txt", "README.txt", "manifest.json"],
  },
  {
    folder: "scorecard/",
    label: "Control health scorecard",
    files: ["control-health-scorecard.json", "control-health-scorecard.csv"],
  },
  {
    folder: "posture/",
    label: "Unified posture score",
    files: ["posture-score.json", "posture-score.csv"],
  },
  {
    folder: "exceptions/",
    label: "Exception register",
    files: ["exception-register.json", "exception-register.csv"],
  },
  {
    folder: "open-gaps/",
    label: "Open gaps & remediations",
    files: ["open-gaps.json", "open-gaps.csv"],
  },
];

export default async function CommitteeMeetingPackPage() {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Committee meeting pack"
        description="Sign in to download the quarterly compliance committee ZIP."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/committee-meeting-pack");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const built = orgContext.orgId
    ? await buildCommitteeMeetingPackFiles(user.id, {
        periodDays: 30,
        orgId: orgContext.orgId,
        orgName: orgContext.orgName,
        supabase,
      })
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Compliance committee meeting pack"
        description={`Auto-assembled ZIP (${COMPLIANCE_COMMITTEE_MEETING_PACK_VERSION}) for quarterly reviews — printable HTML summary (save as PDF), health scorecard, posture, exception register, and open gap queue.`}
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !built ? (
        <ConsoleEmptyState
          title="Meeting pack unavailable"
          description="Join an organization with compliance assessments to generate the committee meeting pack."
          ctas={[
            { href: "/governance/compliance/control-health-scorecard", label: "Health scorecard" },
            { href: "/governance/compliance/executive-summary", label: "Executive summary" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/committee-meeting-pack?periodDays=30"
              className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent hover:border-accent/60"
            >
              Download ZIP
            </a>
            <Link
              href="/governance/compliance/control-health-scorecard"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Health scorecard
            </Link>
            <Link
              href="/governance/compliance/executive-summary"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Executive summary
            </Link>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
              <p className={appOverline}>Pack files</p>
              <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>{built.files.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Period</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {built.periodDays} days
              </p>
            </div>
          </div>

          <PlaceholderCard title="ZIP contents">
            <ul className={`space-y-4 ${appBody}`}>
              {PACK_SECTIONS.map((section) => (
                <li key={section.folder}>
                  <p className="font-semibold text-foreground">{section.label}</p>
                  <p className={`${appMeta} text-muted`}>
                    {section.folder} {section.files.join(", ")}
                  </p>
                </li>
              ))}
            </ul>
            <p className={`mt-4 ${appMeta} text-muted`}>
              Open <strong>committee-pack-summary.html</strong> from the ZIP in your browser and use Print → Save
              as PDF for board distribution.
            </p>
          </PlaceholderCard>
        </>
      )}
    </>
  );
}
