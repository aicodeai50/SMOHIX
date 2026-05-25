import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildControlDependencyGraphPack } from "@/lib/compliance/control-dependency-graph";
import type { ControlGraphEdgeKind } from "@/lib/compliance/control-dependency-graph";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Control dependency graph",
  description: "Cross-framework control links from crosswalks, shared audit evidence, and accepted policies.",
};

export const dynamic = "force-dynamic";

const KIND_STYLE: Record<ControlGraphEdgeKind, string> = {
  crosswalk: "text-accent border-accent/35 bg-accent/10",
  thematic: "text-indigo-200 border-indigo-400/30 bg-indigo-500/10",
  shared_audit: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
  shared_policy: "text-amber-200 border-amber-500/30 bg-amber-500/10",
};

const STATUS_DOT: Record<string, string> = {
  covered: "bg-emerald-400",
  partial: "bg-amber-400",
  none: "bg-white/25",
};

export default async function ControlGraphPage() {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Control dependency graph"
          description="Sign in to explore cross-framework control dependencies from live org evidence."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/control-graph");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildControlDependencyGraphPack(user.id, {
        orgId: orgContext.orgId,
        periodDays: 30,
        supabase,
      })
    : null;

  const hubNodes = pack
    ? pack.hubControlIds
        .map((id) => pack.nodes.find((n) => n.controlId === id))
        .filter((n): n is NonNullable<typeof n> => Boolean(n))
    : [];

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Cross-framework control dependency graph"
        description="Surfaces shared evidence paths across framework packs — SOC 2↔ISO crosswalk links, thematic bridges, co-occurring audit events, and accepted automation policies that map to multiple controls."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Dependency graph unavailable"
          description="Join an organization with audit activity and accepted policies to build cross-framework control edges."
          ctas={[
            { href: "/audit", label: "Audit log" },
            { href: "/governance/compliance/baseline-comparison", label: "All frameworks" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/control-graph?periodDays=30&format=csv"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/control-graph?periodDays=30&format=json"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
            <Link
              href="/governance/compliance/crosswalk"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              SOC 2 ↔ ISO crosswalk
            </Link>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Graph edges</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{pack.edges.length}</p>
              <p className={`mt-1 ${appMeta} text-muted`}>{pack.periodDays}d window</p>
            </div>
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
              <p className={appOverline}>Cross-framework</p>
              <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>
                {pack.crossFrameworkEdgeCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Shared audit / policy</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.sharedAuditEdgeCount} / {pack.sharedPolicyEdgeCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Crosswalk / thematic</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.crosswalkEdgeCount} / {pack.thematicEdgeCount}
              </p>
            </div>
          </div>

          <PlaceholderCard title="Hub controls (highest degree)">
            {hubNodes.length === 0 ? (
              <p className={`${appMeta} text-muted`}>No linked controls in the current graph slice.</p>
            ) : (
              <ul className={`space-y-2 ${appBody}`}>
                {hubNodes.map((n) => (
                  <li
                    key={n.controlId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.08] px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[n.status] ?? STATUS_DOT.none}`}
                        title={n.status}
                      />
                      <span className="font-mono text-sm text-foreground">{n.controlId}</span>
                      <span className={`${appMeta} text-muted`}>{n.title}</span>
                    </div>
                    <span className={`${appMeta} text-muted`}>
                      degree {n.degree} · audit {n.auditEvidenceCount} · policy {n.policyEvidenceCount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </PlaceholderCard>

          <div className="mt-6">
          <PlaceholderCard title="Framework pair density">
            {pack.frameworkPairs.length === 0 ? (
              <p className={`${appMeta} text-muted`}>No cross-framework edges in this period.</p>
            ) : (
              <ul className={`space-y-2 ${appBody}`}>
                {pack.frameworkPairs.slice(0, 12).map((p) => (
                  <li
                    key={`${p.frameworkA}-${p.frameworkB}`}
                    className="flex items-center justify-between rounded-lg border border-white/[0.08] px-3 py-2"
                  >
                    <span className="font-mono text-sm">
                      {p.frameworkA} ↔ {p.frameworkB}
                    </span>
                    <span className={`${appMeta} text-muted`}>{p.edgeCount} edges</span>
                  </li>
                ))}
              </ul>
            )}
          </PlaceholderCard>
          </div>

          <div className="mt-6">
          <PlaceholderCard title="Top dependency edges">
            {pack.edges.length === 0 ? (
              <p className={`${appMeta} text-muted`}>No edges — add audit events or accept policies that map to multiple controls.</p>
            ) : (
              <ul className={`space-y-3 ${appBody}`}>
                {pack.edges.slice(0, 40).map((e) => (
                  <li
                    key={e.id}
                    className={`rounded-lg border px-4 py-3 ${KIND_STYLE[e.kind] ?? ""}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-mono text-sm text-foreground">
                        {e.sourceId} → {e.targetId}
                      </p>
                      <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                        {e.kind.replace(/_/g, " ")} · weight {e.weight}
                        {e.crossFramework ? " · cross-framework" : ""}
                      </span>
                    </div>
                    <p className={`mt-2 ${appMeta} text-muted`}>{e.label}</p>
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
