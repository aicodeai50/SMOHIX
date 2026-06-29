import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildScopeBoundaryMapperPack } from "@/lib/compliance/scope-boundary-mapper";
import type { ScopeBoundaryZone } from "@/lib/compliance/scope-boundary-mapper";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Scope boundary mapper",
  description: "Map in-scope systems and data flows to framework control packs.",
};

export const dynamic = "force-dynamic";

const ZONE_LABEL: Record<ScopeBoundaryZone, string> = {
  cardholder: "Cardholder / CDE",
  production: "Production",
  staging: "Staging",
  development: "Development",
  external: "External / vendor",
  unmapped_asset: "Unmapped asset",
};

export default async function ScopeBoundaryPage() {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Scope boundary mapper"
        description="Sign in to map systems and data flows to compliance controls."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/scope-boundary");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildScopeBoundaryMapperPack(user.id, { orgId: orgContext.orgId, supabase })
    : null;

  const inScopeSystems = pack?.systems.filter((s) => s.inScope) ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Compliance scope boundary mapper"
        description="Documents audit boundary inclusion from live services, dependency data flows, vulnerability assets, and third-party vendors — mapped to control packs for assessor-ready boundary narratives."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Boundary map unavailable"
          description="Join an organization and register services or vendors to build a scope boundary map."
          ctas={[
            { href: "/services", label: "Services" },
            { href: "/governance/third-party-risk", label: "Vendor register" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/scope-boundary?format=csv"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/scope-boundary?format=json"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
            <Link
              href="/api/services/dependency-graph"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Dependency graph API
            </Link>
          </div>

          <p className={`mb-6 ${appMeta} text-muted`}>{pack.orgBoundary.narrative}</p>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
              <p className={appOverline}>In scope</p>
              <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>
                {pack.inScopeSystemCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Out of scope</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.outOfScopeSystemCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>In-scope data flows</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.dataFlowCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Vendors</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.vendorCount}
              </p>
            </div>
          </div>

          <ConsolePanel title="Framework coverage (in-scope systems)">
            {pack.frameworkCoverage.length === 0 ? (
              <p className={`${appMeta} text-muted`}>No framework mappings yet.</p>
            ) : (
              <ul className={`space-y-2 ${appBody}`}>
                {pack.frameworkCoverage.map((row) => (
                  <li
                    key={row.framework}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.08] px-3 py-2"
                  >
                    <span className="font-medium text-foreground">{row.label}</span>
                    <span className={`${appMeta} text-muted`}>
                      {row.inScopeSystemCount} systems · {row.mappedControlCount} controls
                    </span>
                    <Link
                      href={row.consolePath}
                      className="text-[11px] font-semibold uppercase tracking-wide text-accent hover:underline"
                    >
                      Framework
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </ConsolePanel>

          <div className="mt-6">
            <ConsolePanel title="In-scope systems">
              <ul className={`space-y-3 ${appBody}`}>
                {inScopeSystems.slice(0, 40).map((s) => (
                  <li
                    key={s.id}
                    className="rounded-lg border border-white/[0.08] px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                          {s.kind.replace(/_/g, " ")} · {ZONE_LABEL[s.zone]}
                        </p>
                        <p className="font-medium text-foreground">{s.name}</p>
                      </div>
                      {s.openFindingCount > 0 ? (
                        <span className="text-xs text-danger">{s.openFindingCount} open findings</span>
                      ) : null}
                    </div>
                    <p className={`mt-1 font-mono text-xs text-foreground/80`}>
                      {s.controlIds.slice(0, 6).join(", ")}
                      {s.controlIds.length > 6 ? "…" : ""}
                    </p>
                    <p className={`mt-1 ${appMeta} text-muted`}>{s.detail}</p>
                    <Link
                      href={s.href}
                      className="mt-2 inline-block text-[11px] font-semibold uppercase tracking-wide text-accent hover:underline"
                    >
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            </ConsolePanel>
          </div>

          {pack.dataFlows.length > 0 ? (
            <div className="mt-6">
              <ConsolePanel title="Data flows (dependency graph)">
                <ul className={`space-y-2 ${appBody}`}>
                  {pack.dataFlows
                    .filter((f) => f.inScope)
                    .slice(0, 25)
                    .map((f) => (
                      <li
                        key={f.id}
                        className="rounded-lg border border-white/[0.08] px-3 py-2 font-mono text-sm"
                      >
                        {f.fromName} → {f.toName}{" "}
                        <span className={`${appMeta} text-muted`}>
                          ({f.label})
                        </span>
                      </li>
                    ))}
                </ul>
              </ConsolePanel>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
