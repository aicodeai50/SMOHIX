import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import {
  buildSoc2IsoCrosswalkPack,
  SOC2_ISO_CROSSWALK_LINKS,
} from "@/lib/compliance/soc2-iso-crosswalk";
import { getOrgContextForUser } from "@/lib/org/context";
import { isReadOnlyAuditorRole } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "SOC 2 / ISO 27001 crosswalk",
  description: "Control mapping matrix linking SOC 2 criteria to ISO Annex A with org evidence overlay.",
};

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  covered: "text-emerald-300",
  partial: "text-warning",
  none: "text-muted",
};

export default async function Soc2IsoCrosswalkPage() {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="SOC 2 / ISO crosswalk"
          description="Sign in to view the SOC 2 and ISO 27001 control crosswalk."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/crosswalk");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const pack = await buildSoc2IsoCrosswalkPack(user.id, {
    periodDays: 30,
    orgId: orgContext.orgId,
    supabase,
  });

  if (!orgContext.orgId || !pack) {
    return (
      <>
        <PageHeader title="SOC 2 / ISO 27001 crosswalk" description="Unified assessor mapping matrix." />
        <ConsoleEmptyState
          title="Crosswalk unavailable"
          description="Join or create an organization with compliance mapping enabled to generate the crosswalk with evidence overlay."
          ctas={[{ href: "/governance/compliance", label: "Compliance mapping" }]}
        />
      </>
    );
  }

  const readOnly = isReadOnlyAuditorRole(orgContext.role ?? "viewer");
  const unifiedCount = pack.rows.filter((r) => r.unifiedEvidence).length;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="SOC 2 / ISO 27001 crosswalk"
        description="Curated mapping matrix linking SOC 2 Trust Services Criteria to ISO 27001:2022 Annex A controls in the Smohix catalog, with 30-day audit evidence overlay per side."
      />
      <p className={`-mt-4 mb-6 ${appBody}`}>
        <Link href="/governance/compliance/type-ii" className="text-accent hover:underline">
          SOC 2 Type II
        </Link>
        {" · "}
        <Link href="/governance/compliance/iso-assessment" className="text-accent hover:underline">
          ISO 27001
        </Link>
        {" · "}
        <Link href="/governance/compliance/program" className="text-accent hover:underline">
          Program dashboard
        </Link>
        {" · "}
        <Link href="/governance/compliance/workbook" className="text-accent hover:underline">
          Assessor workbook
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
          href="/api/governance/compliance/crosswalk?periodDays=30"
          className="rounded-full border border-indigo-400/40 bg-indigo-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-200 transition-colors hover:bg-indigo-400/15"
        >
          Export CSV (30d evidence)
        </a>
        <a
          href="/api/governance/compliance/crosswalk?periodDays=30&format=json"
          className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground"
        >
          Export JSON
        </a>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-indigo-400/30 bg-indigo-400/10 px-4 py-3">
          <p className={appOverline}>Crosswalk links</p>
          <p className={`mt-1 text-2xl font-semibold text-indigo-200 ${appBody}`}>{pack.linkCount}</p>
          <p className={`${appMeta} text-muted`}>{SOC2_ISO_CROSSWALK_LINKS.length} curated mappings</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>SOC 2 controls</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{pack.soc2ControlCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>ISO Annex A controls</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{pack.isoControlCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Unified evidence</p>
          <p className={`mt-1 text-2xl font-semibold text-emerald-300 ${appBody}`}>{unifiedCount}</p>
          <p className={`${appMeta} text-muted`}>Both sides partial+ in {pack.periodDays}d window</p>
        </div>
      </div>

      <ConsolePanel title="Mapping matrix (with evidence overlay)">
        <div className="overflow-x-auto">
          <table className={`w-full text-left ${appBody}`}>
            <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2">SOC 2</th>
                <th className="px-3 py-2">ISO 27001</th>
                <th className="px-3 py-2">Strength</th>
                <th className="px-3 py-2">SOC evidence</th>
                <th className="px-3 py-2">ISO evidence</th>
                <th className="px-3 py-2">Unified</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-border ${appMeta}`}>
              {pack.rows.map((row) => (
                <tr key={`${row.soc2Ref}-${row.isoRef}`}>
                  <td className="px-3 py-3">
                    <p className="font-mono text-indigo-200">{row.soc2Ref}</p>
                    <p className="text-foreground">{row.soc2Title}</p>
                    <p className="text-muted">{row.soc2Domain}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-mono text-teal-200">{row.isoRef}</p>
                    <p className="text-foreground">{row.isoTitle}</p>
                    <p className="text-muted">{row.isoDomain}</p>
                  </td>
                  <td className="px-3 py-3 capitalize text-foreground">{row.mappingStrength}</td>
                  <td className={`px-3 py-3 capitalize ${STATUS_STYLE[row.soc2EvidenceStatus] ?? ""}`}>
                    {row.soc2EvidenceStatus} ({row.soc2AuditEvents})
                  </td>
                  <td className={`px-3 py-3 capitalize ${STATUS_STYLE[row.isoEvidenceStatus] ?? ""}`}>
                    {row.isoEvidenceStatus} ({row.isoAuditEvents})
                  </td>
                  <td className="px-3 py-3">
                    {row.unifiedEvidence ? (
                      <span className="text-emerald-300">Yes</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={`mt-4 ${appMeta} text-muted`}>
          Mapping notes are included in CSV/JSON exports. Primary links indicate the strongest objective
          alignment; supporting links show related Annex A coverage for the same SOC 2 criterion.
        </p>
      </ConsolePanel>
    </>
  );
}
