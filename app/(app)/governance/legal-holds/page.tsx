import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { listLegalHoldsForUser } from "@/lib/legal-hold/list";
import { getOrgContextForUser } from "@/lib/org/context";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Legal holds",
  description: "Incidents and audit rows frozen from retention purge while under investigation.",
};

export const dynamic = "force-dynamic";

export default async function LegalHoldsPage() {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Legal holds"
          description="Sign in to view active legal holds on incidents and related audit evidence."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/legal-holds");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const summary = await listLegalHoldsForUser(user.id, orgContext.orgId);

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Legal holds"
        description="Active holds exclude incidents and linked audit events from tier-based retention purge."
      />
      <p className={`-mt-4 mb-6 ${appBody}`}>
        <Link href="/settings/deployment" className="text-accent hover:underline">
          Retention policies
        </Link>
        {" · "}
        <Link href="/audit" className="text-accent hover:underline">
          Audit log
        </Link>
        {orgContext.orgName ? (
          <>
            {" · "}
            <span className="text-muted">Org: {orgContext.orgName}</span>
          </>
        ) : null}
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-amber-400/35 bg-amber-400/10 px-4 py-3">
          <p className={appOverline}>Incidents on hold</p>
          <p className={`mt-1 text-2xl font-semibold text-amber-100 ${appBody}`}>{summary.incidentCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Audit rows flagged</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{summary.auditHoldCount}</p>
        </div>
      </div>

      <PlaceholderCard title="Active incident holds">
        {summary.incidents.length === 0 ? (
          <ConsoleEmptyState
            title="No legal holds"
            description="Set a hold from an incident detail page when litigation or regulatory review requires preserving evidence."
            ctas={[{ href: "/incidents", label: "Incidents" }]}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className={`w-full text-left ${appBody}`}>
              <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2">Incident</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Reason</th>
                  <th className="px-3 py-2">Set at</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-border ${appMeta}`}>
                {summary.incidents.map((inc) => (
                  <tr key={inc.id}>
                    <td className="px-3 py-3">
                      <Link href={`/incidents/${inc.id}`} className="text-accent hover:underline">
                        {inc.title}
                      </Link>
                      <p className="font-mono text-[10px] text-muted">{inc.id}</p>
                    </td>
                    <td className="px-3 py-3 capitalize">
                      {inc.severity} · {inc.status}
                    </td>
                    <td className="px-3 py-3 text-muted">{inc.legalHoldReason ?? "—"}</td>
                    <td className="px-3 py-3 text-muted">
                      {inc.legalHoldSetAt ? new Date(inc.legalHoldSetAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PlaceholderCard>
    </>
  );
}
