import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { ASSESSOR_WORKBOOK_VERSION, buildAssessorWorkbookFiles } from "@/lib/compliance/assessor-workbook";
import { getOrgContextForUser } from "@/lib/org/context";
import { isReadOnlyAuditorRole } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Assessor workbook",
  description: "ZIP export bundling evidence packs, framework assessments, and crosswalk matrices.",
};

export const dynamic = "force-dynamic";

const WORKBOOK_SECTIONS = [
  { folder: "evidence/", label: "Compliance evidence pack", files: ["evidence-pack.json", "evidence-pack.csv"] },
  {
    folder: "crosswalk/",
    label: "SOC 2 / ISO 27001 crosswalk",
    files: ["soc2-iso-crosswalk.json", "soc2-iso-crosswalk.csv"],
  },
  {
    folder: "assessments/",
    label: "Framework assessments",
    files: [
      "soc2-type-ii.json",
      "iso27001.json",
      "pci-dss.json",
      "hipaa.json",
      "nist-csf.json",
      "cis-v8.json",
      "cmmc-l2.json",
      "gdpr-art32.json",
      "program-dashboard.json",
    ],
  },
  { folder: "(root)", label: "Workbook manifest", files: ["README.txt", "manifest.json"] },
];

export default async function AssessorWorkbookPage() {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Assessor workbook"
          description="Sign in to download the unified assessor workbook ZIP."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/workbook");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const built = await buildAssessorWorkbookFiles(user.id, {
    periodDays: 30,
    orgId: orgContext.orgId,
    supabase,
  });

  if (!orgContext.orgId || !built) {
    return (
      <>
        <PageHeader title="Unified assessor workbook" description="External audit delivery bundle." />
        <ConsoleEmptyState
          title="Workbook unavailable"
          description="Join or create an organization with compliance features enabled to generate the assessor workbook."
          ctas={[{ href: "/governance/compliance", label: "Compliance mapping" }]}
        />
      </>
    );
  }

  const readOnly = isReadOnlyAuditorRole(orgContext.role ?? "viewer");

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Unified assessor workbook"
        description={`Single ZIP (${ASSESSOR_WORKBOOK_VERSION}) bundling evidence exports, SOC 2 / ISO crosswalk, and framework assessment JSON for ${built.periodDays}-day monitoring.`}
      />
      <p className={`-mt-4 mb-6 ${appBody}`}>
        <Link href="/governance/compliance/program" className="text-accent hover:underline">
          Program dashboard
        </Link>
        {" · "}
        <Link href="/governance/compliance/bundles" className="text-accent hover:underline">
          Evidence bundles
        </Link>
        {" · "}
        <Link href="/governance/compliance/crosswalk" className="text-accent hover:underline">
          SOC 2 / ISO crosswalk
        </Link>
        {readOnly ? (
          <>
            {" · "}
            <span className="text-indigo-200">Auditor read-only workspace</span>
          </>
        ) : null}
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <a
          href="/api/governance/compliance/workbook?periodDays=30"
          className="inline-flex h-10 items-center rounded-lg border border-accent/40 bg-accent/10 px-4 font-medium text-accent hover:bg-accent/15"
        >
          Download workbook ZIP (30d)
        </a>
        <a
          href="/api/governance/compliance/workbook?periodDays=90"
          className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35 ${appBody}`}
        >
          90-day window
        </a>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-3">
          <p className={appOverline}>Artifacts in bundle</p>
          <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>{built.files.length + 2}</p>
          <p className={`${appMeta} text-muted`}>Includes README and manifest</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Monitoring window</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{built.periodDays}d</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Manifest version</p>
          <p className={`mt-1 text-sm font-mono text-foreground ${appBody}`}>{ASSESSOR_WORKBOOK_VERSION}</p>
        </div>
      </div>

      <PlaceholderCard title="ZIP contents">
        <ul className={`space-y-4 ${appBody}`}>
          {WORKBOOK_SECTIONS.map((section) => (
            <li key={section.folder} className="rounded-lg border border-white/[0.08] px-4 py-3">
              <p className="font-medium text-foreground">
                {section.folder} — {section.label}
              </p>
              <p className={`mt-1 font-mono text-[12px] text-muted`}>{section.files.join(", ")}</p>
            </li>
          ))}
        </ul>
        <p className={`mt-4 ${appMeta} text-muted`}>
          manifest.json lists SHA-256 hashes for every file. Verify before sending to auditors or customers.
        </p>
      </PlaceholderCard>
    </>
  );
}
