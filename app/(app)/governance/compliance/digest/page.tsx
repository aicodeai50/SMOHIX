import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { appBody, appLabel, appMeta, appOverline } from "@/lib/app-typography";
import { COMPLIANCE_DIGEST_VERSION, listComplianceDigestDeliveries } from "@/lib/compliance/compliance-digest";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { runComplianceDigestAction, updateComplianceDigestWebhookAction } from "./actions";

export const metadata: Metadata = {
  title: "Compliance digest webhooks",
  description: "Weekly program readiness deltas and overdue attestations delivered to GRC tools.",
};

export const dynamic = "force-dynamic";

export default async function ComplianceDigestPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    sent?: string;
    webhook_saved?: string;
  }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Compliance digest"
          description="Sign in to configure weekly HTTPS digests for your GRC stack."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/digest");
  }

  const sp = await searchParams;
  const orgContext = await getOrgContextForUser(user.id);
  const canEdit = orgContext.role ? canManageMembers(orgContext.role) : false;

  let webhookUrl = "";
  if (orgContext.orgId) {
    const { data: orgRow } = await supabase
      .from("organizations")
      .select("compliance_digest_webhook_url")
      .eq("id", orgContext.orgId)
      .maybeSingle();
    webhookUrl = String(orgRow?.compliance_digest_webhook_url ?? "");
  }

  const deliveries = orgContext.orgId
    ? await listComplianceDigestDeliveries(orgContext.orgId, { supabase })
    : [];

  const err = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Compliance digest webhooks"
        description="Weekly HTTPS payloads with program readiness deltas, SOC 2 trend changes, and newly overdue control attestations for ServiceNow, Archer, or custom GRC sinks."
      />
      <p className={`-mt-4 mb-6 ${appBody}`}>
        <Link href="/governance/compliance/program" className="text-accent hover:underline">
          Program dashboard
        </Link>
        {" · "}
        <Link href="/governance/compliance/attestations" className="text-accent hover:underline">
          Attestations
        </Link>
        {" · "}
        <Link href="/governance/compliance/bundles" className="text-accent hover:underline">
          Evidence bundles
        </Link>
      </p>

      {sp.sent ? (
        <p className={`mb-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-emerald-200 ${appBody}`}>
          Digest generated. Delivery id:{" "}
          <span className="font-mono text-[11px]">{sp.sent}</span>
        </p>
      ) : null}
      {sp.webhook_saved === "1" ? (
        <p className={`mb-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-emerald-200 ${appBody}`}>
          Digest webhook URL saved.
        </p>
      ) : null}
      {err ? (
        <p className={`mb-4 rounded-xl border border-danger/25 bg-danger-dim/50 px-4 py-3 text-danger ${appBody}`}>
          {err === "rbac"
            ? "Only org owners and admins can manage compliance digests."
            : err === "webhook_https"
              ? "Webhook URL must use HTTPS."
              : err}
        </p>
      ) : null}

      {!orgContext.orgId ? (
        <ConsoleEmptyState
          title="Organization required"
          description="Create an organization to enable compliance digest webhooks."
          ctas={[{ href: "/settings/members", label: "Members & roles" }]}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <ConsolePanel title={canEdit ? "Send digest now" : "View only"}>
            {canEdit ? (
              <form action={runComplianceDigestAction} className="space-y-4">
                <p className={`${appMeta} text-muted`}>
                  Builds a 30-day program snapshot, compares against the last delivery, and POSTs{" "}
                  <span className="font-mono text-foreground/80">{COMPLIANCE_DIGEST_VERSION}</span> JSON to your
                  webhook when configured.
                </p>
                <button
                  type="submit"
                  className={`h-10 rounded-lg bg-accent px-4 font-medium text-background hover:opacity-90 ${appBody}`}
                >
                  Generate & deliver digest
                </button>
              </form>
            ) : (
              <p className={`${appMeta} text-muted`}>Ask an org owner or admin to run digests.</p>
            )}
          </ConsolePanel>

          <ConsolePanel title="GRC webhook URL">
            {canEdit ? (
              <form action={updateComplianceDigestWebhookAction} className="space-y-3">
                <label className={appLabel} htmlFor="compliance_digest_webhook_url">
                  HTTPS webhook URL (optional)
                </label>
                <input
                  id="compliance_digest_webhook_url"
                  name="compliance_digest_webhook_url"
                  type="url"
                  defaultValue={webhookUrl}
                  placeholder="https://grc.example.com/hooks/zentro/digest"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 ${appBody}`}
                />
                <button
                  type="submit"
                  className={`h-10 rounded-lg border border-accent/40 bg-accent/10 px-4 font-medium text-accent ${appBody}`}
                >
                  Save webhook
                </button>
                <p className={`${appMeta} text-muted`}>
                  Weekly cron: POST to{" "}
                  <span className="font-mono text-foreground/80">/api/governance/compliance/digest/scheduled</span>{" "}
                  with <span className="font-mono">Authorization: Bearer &lt;ZENTRO_DIGEST_CRON_SECRET&gt;</span>
                </p>
              </form>
            ) : (
              <p className={`font-mono text-sm text-muted ${appBody}`}>{webhookUrl || "—"}</p>
            )}
          </ConsolePanel>
        </div>
      )}

      <div className="mt-6">
        <ConsolePanel title="Delivery history">
          {deliveries.length === 0 ? (
            <ConsoleEmptyState
              title="No digests yet"
              description="Run a digest to establish a baseline snapshot and enable delta tracking on the next run."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className={`w-full text-left ${appBody}`}>
                <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2">Created</th>
                    <th className="px-3 py-2">Window</th>
                    <th className="px-3 py-2">Delivery</th>
                    <th className="px-3 py-2">Note</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-border ${appMeta}`}>
                  {deliveries.map((d) => (
                    <tr key={d.id}>
                      <td className="px-3 py-3 text-muted">{new Date(d.createdAt).toLocaleString()}</td>
                      <td className="px-3 py-3">{d.periodDays}d</td>
                      <td className="px-3 py-3 capitalize">{d.deliveryStatus.replace(/_/g, " ")}</td>
                      <td className="px-3 py-3 text-muted">{d.deliveryNote ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ConsolePanel>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface/40 px-4 py-3">
        <p className={appOverline}>Payload shape</p>
        <p className={`mt-2 ${appMeta} text-muted`}>
          Webhook body type <span className="font-mono text-foreground/80">zentro.compliance_digest.weekly</span>{" "}
          includes <span className="font-mono">summary</span>, <span className="font-mono">deltas</span> (readiness
          changes vs prior snapshot), <span className="font-mono">overdueAttestations</span>, and{" "}
          <span className="font-mono">topGaps</span>.
        </p>
      </div>
    </>
  );
}
