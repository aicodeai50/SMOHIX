import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { appBody, appLabel, appMeta, appOverline } from "@/lib/app-typography";
import { listEvidenceBundlesForOrg } from "@/lib/compliance/evidence-bundle";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { createEvidenceBundleAction, updateEvidenceWebhookAction } from "./actions";

export const metadata: Metadata = {
  title: "Assessor evidence bundles",
  description: "Tamper-evident compliance packs with optional webhook delivery to secure storage.",
};

export const dynamic = "force-dynamic";

export default async function ComplianceBundlesPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    created?: string;
    webhook_saved?: string;
  }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Assessor evidence bundles"
          description="Sign in to generate persisted compliance packs with SHA-256 manifests."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/bundles");
  }

  const sp = await searchParams;
  const orgContext = await getOrgContextForUser(user.id);
  const canEdit = orgContext.role ? canManageMembers(orgContext.role) : false;

  let webhookUrl = "";
  if (orgContext.orgId) {
    const { data: orgRow } = await supabase
      .from("organizations")
      .select("evidence_bundle_webhook_url")
      .eq("id", orgContext.orgId)
      .maybeSingle();
    webhookUrl = String(orgRow?.evidence_bundle_webhook_url ?? "");
  }

  const bundles = orgContext.orgId
    ? await listEvidenceBundlesForOrg(orgContext.orgId, { supabase })
    : [];

  const err = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Assessor evidence bundles"
        description="Immutable snapshots of compliance evidence with per-file SHA-256 hashes and a signed manifest for assessors."
      />
      <p className={`-mt-4 mb-6 ${appBody}`}>
        <Link href="/governance/compliance" className="text-accent hover:underline">
          Compliance mapping
        </Link>
        {" · "}
        <Link href="/governance/legal-holds" className="text-accent hover:underline">
          Legal holds
        </Link>
        {" · "}
        <Link href="/settings/deployment" className="text-accent hover:underline">
          Retention
        </Link>
      </p>

      {sp.created ? (
        <p className={`mb-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-emerald-200 ${appBody}`}>
          Evidence bundle created. Bundle id:{" "}
          <span className="font-mono text-[11px]">{sp.created}</span>
        </p>
      ) : null}
      {sp.webhook_saved === "1" ? (
        <p className={`mb-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-emerald-200 ${appBody}`}>
          Delivery webhook URL saved.
        </p>
      ) : null}
      {err ? (
        <p className={`mb-4 rounded-xl border border-danger/25 bg-danger-dim/50 px-4 py-3 text-danger ${appBody}`}>
          {err === "rbac"
            ? "Only org owners and admins can manage evidence bundles."
            : err === "webhook_https"
              ? "Webhook URL must use HTTPS."
              : err}
        </p>
      ) : null}

      {!orgContext.orgId ? (
        <ConsoleEmptyState
          title="Organization required"
          description="Create an organization to generate assessor evidence bundles."
          ctas={[{ href: "/settings/members", label: "Members & roles" }]}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <ConsolePanel title={canEdit ? "Generate bundle" : "View only"}>
            {canEdit ? (
              <form action={createEvidenceBundleAction} className="space-y-4">
                <div>
                  <label className={appLabel} htmlFor="window">
                    Evidence window
                  </label>
                  <select
                    id="window"
                    name="window"
                    defaultValue="30d"
                    className={`mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 ${appBody}`}
                  >
                    <option value="30d">Last 30 days</option>
                    <option value="7d">Last 7 days</option>
                    <option value="all">All time</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className={`h-10 rounded-lg bg-accent px-4 font-medium text-background hover:opacity-90 ${appBody}`}
                >
                  Create evidence bundle
                </button>
                <p className={`${appMeta} text-muted`}>
                  Persists JSON + CSV artifacts and a tamper-evident manifest. Optionally POSTs to your
                  webhook when configured below.
                </p>
              </form>
            ) : (
              <p className={`${appMeta} text-muted`}>Ask an org owner or admin to generate bundles.</p>
            )}
          </ConsolePanel>

          <ConsolePanel title="Secure delivery webhook">
            {canEdit ? (
              <form action={updateEvidenceWebhookAction} className="space-y-3">
                <label className={appLabel} htmlFor="evidence_bundle_webhook_url">
                  HTTPS webhook URL (optional)
                </label>
                <input
                  id="evidence_bundle_webhook_url"
                  name="evidence_bundle_webhook_url"
                  type="url"
                  defaultValue={webhookUrl}
                  placeholder="https://storage.example.com/zentro/bundles"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 ${appBody}`}
                />
                <button
                  type="submit"
                  className={`h-10 rounded-lg border border-accent/40 bg-accent/10 px-4 font-medium text-accent ${appBody}`}
                >
                  Save webhook
                </button>
                <p className={`${appMeta} text-muted`}>
                  Scheduled jobs: POST to{" "}
                  <span className="font-mono text-foreground/80">/api/governance/compliance/bundles/scheduled</span>{" "}
                  with <span className="font-mono">Authorization: Bearer &lt;ZENTRO_BUNDLE_CRON_SECRET&gt;</span>
                </p>
              </form>
            ) : (
              <p className={`font-mono text-sm text-muted ${appBody}`}>{webhookUrl || "—"}</p>
            )}
          </ConsolePanel>
        </div>
      )}

      <div className="mt-6">
        <ConsolePanel title="Stored bundles">
          {bundles.length === 0 ? (
            <ConsoleEmptyState
              title="No bundles yet"
              description="Create a bundle to snapshot audit evidence and accepted policies for assessors."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className={`w-full text-left ${appBody}`}>
                <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2">Created</th>
                    <th className="px-3 py-2">Window</th>
                    <th className="px-3 py-2">Manifest SHA-256</th>
                    <th className="px-3 py-2">Delivery</th>
                    <th className="px-3 py-2">Download</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-border ${appMeta}`}>
                  {bundles.map((b) => (
                    <tr key={b.id}>
                      <td className="px-3 py-3 text-muted">
                        {new Date(b.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-3">{b.windowLabel}</td>
                      <td className="px-3 py-3 font-mono text-[10px] text-muted">
                        {b.manifestSha256.slice(0, 16)}…
                      </td>
                      <td className="px-3 py-3 capitalize">{b.deliveryStatus.replace(/_/g, " ")}</td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/api/governance/compliance/bundles/${b.id}/download?format=json`}
                          className="text-accent hover:underline"
                        >
                          JSON
                        </Link>
                        {" · "}
                        <Link
                          href={`/api/governance/compliance/bundles/${b.id}/download?format=csv`}
                          className="text-accent hover:underline"
                        >
                          CSV
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ConsolePanel>
      </div>
    </>
  );
}
