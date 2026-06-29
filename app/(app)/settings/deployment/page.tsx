import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { appBody, appLabel, appMeta, appOverline } from "@/lib/app-typography";
import {
  deploymentTierLabel,
  getDeploymentProfileForOrg,
} from "@/lib/deployment/profile";
import {
  DATA_BOUNDARY_LABELS,
  DEPLOYMENT_TIER_LABELS,
  listRegionsForBoundary,
} from "@/lib/deployment/regions";
import type { DataBoundary, DeploymentTier } from "@/lib/deployment/types";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { getRetentionPolicyForOrg } from "@/lib/retention/org-policy";

import { updateDeploymentProfileAction, updateRetentionPolicyAction } from "./actions";

export const metadata: Metadata = {
  title: "Deployment & residency",
  description: "FedRAMP-oriented region pins and data boundary options for your organization.",
};

export const dynamic = "force-dynamic";

export default async function SettingsDeploymentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; retention_saved?: string }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Deployment & residency"
          description="Sign in to configure organization data region and isolation boundary."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/settings/deployment");
  }

  const sp = await searchParams;
  const err = typeof sp.error === "string" ? sp.error : undefined;
  const orgContext = await getOrgContextForUser(user.id);
  const profile =
    orgContext.orgId && orgContext.orgName
      ? await getDeploymentProfileForOrg(orgContext.orgId, orgContext.orgName)
      : null;
  const retention =
    orgContext.orgId && profile
      ? await getRetentionPolicyForOrg(orgContext.orgId, profile.deploymentTier)
      : null;
  const canEdit = orgContext.role ? canManageMembers(orgContext.role) : false;

  const tierOptions = Object.keys(DEPLOYMENT_TIER_LABELS) as DeploymentTier[];
  const boundaryOptions = Object.keys(DATA_BOUNDARY_LABELS) as DataBoundary[];
  const selectedBoundary = profile?.dataBoundary ?? "shared";
  const regionOptions = listRegionsForBoundary(selectedBoundary);

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Deployment & data boundary"
        description="Pin residency and isolation tier for regulated and FedRAMP-oriented buyers. Applies to the active organization."
      />
      <p className={`-mt-4 mb-6 ${appBody}`}>
        <Link href="/settings" className="text-accent hover:underline">
          Settings hub
        </Link>
        {" · "}
        <Link href="/governance/compliance" className="text-accent hover:underline">
          Compliance mapping
        </Link>
        {" · "}
        <Link href="/governance/legal-holds" className="text-accent hover:underline">
          Legal holds
        </Link>
        {" · "}
        <Link href="/enterprise" className="text-accent hover:underline">
          Enterprise
        </Link>
      </p>

      {sp.saved === "1" ? (
        <p className={`mb-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-emerald-200 ${appBody}`}>
          Deployment profile saved.
        </p>
      ) : null}
      {sp.retention_saved === "1" ? (
        <p className={`mb-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-emerald-200 ${appBody}`}>
          Retention policy saved.
        </p>
      ) : null}
      {err ? (
        <p className={`mb-4 rounded-xl border border-danger/25 bg-danger-dim/50 px-4 py-3 text-danger ${appBody}`}>
          {err === "rbac" ? "Only org owners and admins can edit deployment settings." : err}
        </p>
      ) : null}

      {!orgContext.orgId ? (
        <ConsoleEmptyState
          title="Organization required"
          description="Create an organization under Members & roles before pinning deployment region and data boundary."
          ctas={[{ href: "/settings/members", label: "Members & roles" }]}
        />
      ) : !profile ? (
        <ConsoleEmptyState
          title="Profile unavailable"
          description="Apply migration #21 (FedRAMP deployment profile) on Supabase, then reload."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <ConsolePanel title="Current posture">
            <dl className={`space-y-3 ${appBody}`}>
              <div>
                <dt className={appOverline}>Organization</dt>
                <dd className="text-foreground">{profile.orgName}</dd>
              </div>
              <div>
                <dt className={appOverline}>Deployment tier</dt>
                <dd className="text-foreground">{deploymentTierLabel(profile.deploymentTier)}</dd>
              </div>
              <div>
                <dt className={appOverline}>Data region</dt>
                <dd className="text-foreground">
                  {profile.residencyLabel}{" "}
                  <span className={`font-mono text-muted ${appMeta}`}>({profile.dataRegion})</span>
                </dd>
              </div>
              <div>
                <dt className={appOverline}>Data boundary</dt>
                <dd className="text-foreground">{profile.isolationLabel}</dd>
              </div>
            </dl>
            {profile.complianceHints.length > 0 ? (
              <ul className={`mt-4 list-disc space-y-1 pl-5 ${appMeta} text-muted`}>
                {profile.complianceHints.map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ul>
            ) : null}
          </ConsolePanel>

          <ConsolePanel title={canEdit ? "Update profile" : "View only"}>
            {canEdit ? (
              <form action={updateDeploymentProfileAction} className="space-y-4">
                <div>
                  <label className={appLabel} htmlFor="deployment_tier">
                    Deployment tier
                  </label>
                  <select
                    id="deployment_tier"
                    name="deployment_tier"
                    defaultValue={profile.deploymentTier}
                    className={`mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 ${appBody}`}
                  >
                    {tierOptions.map((tier) => (
                      <option key={tier} value={tier}>
                        {DEPLOYMENT_TIER_LABELS[tier]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={appLabel} htmlFor="data_boundary">
                    Data boundary
                  </label>
                  <select
                    id="data_boundary"
                    name="data_boundary"
                    defaultValue={profile.dataBoundary}
                    className={`mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 ${appBody}`}
                  >
                    {boundaryOptions.map((b) => (
                      <option key={b} value={b}>
                        {DATA_BOUNDARY_LABELS[b]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={appLabel} htmlFor="data_region">
                    Data region
                  </label>
                  <select
                    id="data_region"
                    name="data_region"
                    defaultValue={profile.dataRegion}
                    className={`mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 ${appBody}`}
                  >
                    {regionOptions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <p className={`mt-1 ${appMeta}`}>
                    GovCloud regions appear when boundary is GovCloud or tier is FedRAMP-ready.
                  </p>
                </div>
                <div>
                  <label className={appLabel} htmlFor="boundary_notes">
                    Procurement / assessor notes
                  </label>
                  <textarea
                    id="boundary_notes"
                    name="boundary_notes"
                    rows={3}
                    defaultValue={profile.boundaryNotes ?? ""}
                    className={`mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 ${appBody}`}
                    placeholder="Optional: ATO boundary description, dedicated project ref…"
                  />
                </div>
                <button
                  type="submit"
                  className={`h-10 rounded-lg bg-accent px-4 font-medium text-background hover:opacity-90 ${appBody}`}
                >
                  Save deployment profile
                </button>
              </form>
            ) : (
              <p className={`${appMeta} text-muted`}>
                Ask an org owner or admin to update region and boundary settings.
              </p>
            )}
          </ConsolePanel>
        </div>
      )}

      {orgContext.orgId && profile && retention ? (
        <div className="mt-6">
          <ConsolePanel title="Data retention">
            <p className={`mb-4 ${appMeta} text-muted`}>
              Effective retention for org-scoped audit events and closed incidents. Tier defaults apply when
              overrides are blank. Scheduled purge uses{" "}
              <span className="font-mono text-foreground/80">apply_org_retention_policy(org_id)</span>{" "}
              (migration #23).
            </p>
            <dl className={`mb-6 grid gap-4 sm:grid-cols-2 ${appBody}`}>
              <div>
                <dt className={appOverline}>Audit log (effective)</dt>
                <dd className="text-2xl font-semibold text-foreground">{retention.auditRetentionDays} days</dd>
                <dd className={`${appMeta} text-muted`}>
                  Tier default: {retention.tierDefaultAuditDays} · Max: {retention.maxAuditDays}
                </dd>
              </div>
              <div>
                <dt className={appOverline}>Closed incidents (effective)</dt>
                <dd className="text-2xl font-semibold text-foreground">{retention.incidentRetentionDays} days</dd>
                <dd className={`${appMeta} text-muted`}>
                  Tier default: {retention.tierDefaultIncidentDays} · Max: {retention.maxIncidentDays}
                </dd>
              </div>
            </dl>
            {canEdit ? (
              <form action={updateRetentionPolicyAction} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={appLabel} htmlFor="audit_retention_days">
                    Audit retention override (days)
                  </label>
                  <input
                    id="audit_retention_days"
                    name="audit_retention_days"
                    type="number"
                    min={retention.minDays}
                    max={retention.maxAuditDays}
                    placeholder={`Default (${retention.tierDefaultAuditDays})`}
                    defaultValue={retention.auditOverrideDays ?? ""}
                    className={`mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 ${appBody}`}
                  />
                </div>
                <div>
                  <label className={appLabel} htmlFor="incident_retention_days">
                    Incident retention override (days)
                  </label>
                  <input
                    id="incident_retention_days"
                    name="incident_retention_days"
                    type="number"
                    min={retention.minDays}
                    max={retention.maxIncidentDays}
                    placeholder={`Default (${retention.tierDefaultIncidentDays})`}
                    defaultValue={retention.incidentOverrideDays ?? ""}
                    className={`mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 ${appBody}`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className={`h-10 rounded-lg border border-accent/40 bg-accent/10 px-4 font-medium text-accent hover:bg-accent/15 ${appBody}`}
                  >
                    Save retention policy
                  </button>
                  <p className={`mt-2 ${appMeta} text-muted`}>
                    Leave blank to inherit tier defaults. Minimum {retention.minDays} days.
                  </p>
                </div>
              </form>
            ) : (
              <p className={`${appMeta} text-muted`}>Only org owners and admins can edit retention overrides.</p>
            )}
          </ConsolePanel>
        </div>
      ) : null}
    </>
  );
}
