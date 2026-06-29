import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceControlTags } from "@/components/compliance/ComplianceControlTags";
import {
  createThirdPartyVendorAction,
  updateThirdPartyVendorAction,
} from "./actions";
import { appBody, appLabel, appMeta, appOverline } from "@/lib/app-typography";
import { attestationStatusLabel } from "@/lib/third-party-risk/evidence";
import { listThirdPartyVendors } from "@/lib/third-party-risk/data";
import type { VendorRiskTier } from "@/lib/third-party-risk/types";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers, isReadOnlyAuditorRole } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Third-party risk register",
  description: "Vendor inventory with inherited controls and reused audit evidence across frameworks.",
};

export const dynamic = "force-dynamic";

const TIER_STYLE: Record<VendorRiskTier, string> = {
  critical: "border-danger/40 bg-danger-dim/40 text-danger",
  high: "border-amber-400/35 bg-amber-400/10 text-amber-100",
  medium: "border-border bg-surface/40 text-foreground",
  low: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
};

export default async function ThirdPartyRiskPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; updated?: string }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Third-party risk"
          description="Sign in to manage your vendor inventory and inherited controls."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/third-party-risk");
  }

  const sp = await searchParams;
  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = isReadOnlyAuditorRole(orgContext.role ?? "viewer");
  const canAdmin = orgContext.role ? canManageMembers(orgContext.role) : false;

  if (!orgContext.orgId) {
    return (
      <>
        <PageHeader title="Third-party risk register" description="Vendor inventory and control inheritance." />
        <ConsoleEmptyState
          title="Organization required"
          description="Create or join an organization to track vendors and inherit compliance controls."
          ctas={[{ href: "/settings/members", label: "Members & roles" }]}
        />
      </>
    );
  }

  const vendors = await listThirdPartyVendors(user.id, orgContext.orgId, supabase);
  const critical = vendors.filter((v) => v.riskTier === "critical").length;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Third-party risk register"
        description="Vendor inventory with control inheritance from risk tier and category — evidence and attestation status reused from your compliance program."
      />
      <p className={`-mt-4 mb-6 ${appBody}`}>
        <Link href="/governance/compliance" className="text-accent hover:underline">
          Compliance mapping
        </Link>
        {" · "}
        <Link href="/governance/compliance/attestations" className="text-accent hover:underline">
          Control attestations
        </Link>
        {" · "}
        <Link href="/audit" className="text-accent hover:underline">
          Audit log
        </Link>
        {readOnly ? (
          <>
            {" · "}
            <span className="text-indigo-200">Auditor read-only</span>
          </>
        ) : null}
      </p>

      {sp.created ? (
        <p className={`mb-4 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.08] px-4 py-3 text-emerald-100/90 ${appBody}`}>
          Vendor added with inherited controls.
        </p>
      ) : null}
      {sp.updated === "1" ? (
        <p className={`mb-4 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.08] px-4 py-3 text-emerald-100/90 ${appBody}`}>
          Vendor updated; inherited controls re-synced.
        </p>
      ) : null}
      {sp.error ? (
        <p className={`mb-4 rounded-xl border border-danger/25 bg-danger-dim/50 px-4 py-3 text-danger ${appBody}`}>
          {decodeURIComponent(String(sp.error).replace(/\+/g, " "))}
        </p>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Vendors</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{vendors.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Critical tier</p>
          <p className={`mt-1 text-2xl font-semibold text-danger ${appBody}`}>{critical}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Inherited controls</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
            {vendors.reduce((s, v) => s + v.controlCount, 0)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Reused audit events</p>
          <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>
            {vendors.reduce((s, v) => s + v.reusedEvidenceCount, 0)}
          </p>
        </div>
      </div>

      {canAdmin && !readOnly ? (
        <ConsolePanel title="Add vendor">
          <form action={createThirdPartyVendorAction} className="flex flex-wrap items-end gap-3">
            <div>
              <label className={appLabel} htmlFor="vendor-name">
                Name
              </label>
              <input
                id="vendor-name"
                name="name"
                required
                className="mt-1 h-9 min-w-[14rem] rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
              />
            </div>
            <div>
              <label className={appLabel} htmlFor="vendor-category">
                Category
              </label>
              <select
                id="vendor-category"
                name="category"
                defaultValue="saas"
                className="mt-1 h-9 rounded-lg border border-border bg-surface px-2 text-sm text-foreground"
              >
                <option value="saas">SaaS</option>
                <option value="cloud">Cloud</option>
                <option value="security">Security</option>
                <option value="data_processor">Data processor</option>
                <option value="healthcare_baa">Healthcare BAA</option>
                <option value="consulting">Consulting</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={appLabel} htmlFor="vendor-tier">
                Risk tier
              </label>
              <select
                id="vendor-tier"
                name="riskTier"
                defaultValue="medium"
                className="mt-1 h-9 rounded-lg border border-border bg-surface px-2 text-sm text-foreground"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className={appLabel} htmlFor="vendor-status">
                Status
              </label>
              <select
                id="vendor-status"
                name="status"
                defaultValue="active"
                className="mt-1 h-9 rounded-lg border border-border bg-surface px-2 text-sm text-foreground"
              >
                <option value="active">Active</option>
                <option value="review">In review</option>
                <option value="offboarding">Offboarding</option>
              </select>
            </div>
            <button
              type="submit"
              className={`h-9 rounded-lg border border-accent/40 bg-accent/10 px-4 text-sm font-medium text-accent hover:bg-accent/15 ${appBody}`}
            >
              Add vendor
            </button>
          </form>
        </ConsolePanel>
      ) : null}

      <div className="mt-6">
        <ConsolePanel title="Vendor inventory">
          {vendors.length === 0 ? (
            <ConsoleEmptyState
              title="No vendors yet"
              description="Add a vendor to inherit SOC 2 and ISO 27001 controls and reuse org-wide audit evidence."
            />
          ) : (
            <div className="space-y-6">
              {vendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="rounded-xl border border-white/[0.08] bg-surface/20 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className={`text-lg font-semibold text-foreground ${appBody}`}>{vendor.name}</p>
                      <p className={`${appMeta} text-muted capitalize`}>
                        {vendor.category.replace("_", " ")} · {vendor.status}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TIER_STYLE[vendor.riskTier]}`}
                    >
                      {vendor.riskTier}
                    </span>
                  </div>

                  <dl className={`mt-3 grid gap-2 sm:grid-cols-4 ${appMeta} text-muted`}>
                    <div>
                      <dt className={appOverline}>Inherited controls</dt>
                      <dd className="text-foreground">{vendor.controlCount}</dd>
                    </div>
                    <div>
                      <dt className={appOverline}>Attested</dt>
                      <dd className="text-foreground">{vendor.attestedControlCount}</dd>
                    </div>
                    <div>
                      <dt className={appOverline}>Evidence reuse</dt>
                      <dd className="text-accent">{vendor.reusedEvidenceCount} audit events</dd>
                    </div>
                    <div>
                      <dt className={appOverline}>Readiness</dt>
                      <dd className="text-foreground">{vendor.readinessPercent}%</dd>
                    </div>
                  </dl>

                  {canAdmin && !readOnly ? (
                    <form
                      action={updateThirdPartyVendorAction}
                      className="mt-3 flex flex-wrap items-end gap-2"
                    >
                      <input type="hidden" name="vendorId" value={vendor.id} />
                      <select
                        name="category"
                        defaultValue={vendor.category}
                        className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-foreground"
                      >
                        <option value="saas">SaaS</option>
                        <option value="cloud">Cloud</option>
                        <option value="security">Security</option>
                        <option value="data_processor">Data processor</option>
                        <option value="healthcare_baa">Healthcare BAA</option>
                        <option value="consulting">Consulting</option>
                        <option value="other">Other</option>
                      </select>
                      <select
                        name="riskTier"
                        defaultValue={vendor.riskTier}
                        className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-foreground"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                      <select
                        name="status"
                        defaultValue={vendor.status}
                        className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-foreground"
                      >
                        <option value="active">Active</option>
                        <option value="review">Review</option>
                        <option value="offboarding">Offboarding</option>
                      </select>
                      <button
                        type="submit"
                        className="h-8 rounded-lg border border-white/[0.12] px-2 text-xs text-muted hover:text-foreground"
                      >
                        Re-sync controls
                      </button>
                    </form>
                  ) : null}

                  <details className="mt-4">
                    <summary className={`cursor-pointer ${appMeta} text-accent`}>
                      Inherited controls & evidence ({vendor.controls.length})
                    </summary>
                    <div className="mt-3 overflow-x-auto">
                      <table className={`w-full text-left ${appBody}`}>
                        <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                          <tr>
                            <th className="px-2 py-2">Control</th>
                            <th className="px-2 py-2">Source</th>
                            <th className="px-2 py-2">Attestation</th>
                            <th className="px-2 py-2">Audit evidence</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y divide-border ${appMeta}`}>
                          {vendor.controls.map((c) => (
                            <tr key={c.controlId}>
                              <td className="px-2 py-2">
                                <ComplianceControlTags
                                  controls={[
                                    {
                                      id: c.control.id,
                                      framework: c.control.framework,
                                      ref: c.control.ref,
                                    },
                                  ]}
                                  max={1}
                                />
                              </td>
                              <td className="px-2 py-2 capitalize text-muted">{c.source}</td>
                              <td className="px-2 py-2 capitalize">
                                {attestationStatusLabel(c.attestationStatus)}
                              </td>
                              <td className="px-2 py-2">
                                <Link href={c.auditEvidenceHref} className="text-accent hover:underline">
                                  {c.linkedAuditEvidenceCount}
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}
        </ConsolePanel>
      </div>
    </>
  );
}
