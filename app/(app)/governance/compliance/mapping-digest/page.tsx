import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { appBody, appLabel, appMeta, appOverline } from "@/lib/app-typography";
import {
  buildCurrentMappingSnapshot,
  computeMappingChanges,
  REGULATORY_MAPPING_DIGEST_VERSION,
  listMappingDigestDeliveries,
  getLatestMappingSnapshot,
} from "@/lib/compliance/regulatory-mapping-change-digest";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
  runMappingDigestAction,
  updateMappingDigestSettingsAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Mapping change digest",
  description: "Webhook and email alerts when catalog controls or cross-framework mappings change.",
};

export const dynamic = "force-dynamic";

export default async function MappingDigestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string; saved?: string }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Mapping change digest"
        description="Sign in to configure mapping change notifications."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/mapping-digest");
  }

  const sp = await searchParams;
  const orgContext = await getOrgContextForUser(user.id);
  const canEdit = orgContext.role ? canManageMembers(orgContext.role) : false;

  let webhookUrl = "";
  let emailEnabled = false;
  if (orgContext.orgId) {
    const { data: orgRow } = await supabase
      .from("organizations")
      .select(
        "compliance_mapping_digest_webhook_url, compliance_mapping_digest_email_enabled",
      )
      .eq("id", orgContext.orgId)
      .maybeSingle();
    webhookUrl = String(orgRow?.compliance_mapping_digest_webhook_url ?? "");
    emailEnabled = Boolean(orgRow?.compliance_mapping_digest_email_enabled);
  }

  const current = buildCurrentMappingSnapshot();
  const previous = orgContext.orgId
    ? await getLatestMappingSnapshot(orgContext.orgId, { supabase })
    : null;
  const pending = computeMappingChanges(previous, current);

  const deliveries = orgContext.orgId
    ? await listMappingDigestDeliveries(orgContext.orgId, { supabase })
    : [];

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Regulatory mapping change digest"
        description="Detect changes to the Zentro compliance catalog, SOC 2 ↔ ISO crosswalk, and regulatory scenario catalog — then notify GRC tools via HTTPS webhook or email owners and admins."
      />
      <p className={`-mt-4 mb-6 ${appBody}`}>
        <Link href="/governance/compliance/crosswalk" className="text-accent hover:underline">
          Crosswalk
        </Link>
        {" · "}
        <Link href="/governance/compliance/regulatory-impact" className="text-accent hover:underline">
          Regulatory impact
        </Link>
        {" · "}
        <Link href="/governance/compliance/digest" className="text-accent hover:underline">
          Program digest
        </Link>
      </p>

      {sp.error ? (
        <p className={`mb-4 ${appMeta} text-danger`}>Action failed ({sp.error}).</p>
      ) : null}
      {sp.saved ? <p className={`mb-4 ${appMeta} text-emerald-300`}>Settings saved.</p> : null}
      {sp.sent ? <p className={`mb-4 ${appMeta} text-emerald-300`}>Digest run recorded.</p> : null}

      {!orgContext.orgId ? (
        <ConsoleEmptyState
          title="Organization required"
          description="Join an organization to track mapping fingerprints."
        />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
              <p className={appOverline}>Catalog controls</p>
              <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>
                {current.controlIds.length}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Crosswalk links</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {current.crosswalkKeys.length}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Pending changes</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pending.changeCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Digest version</p>
              <p className={`mt-1 text-sm font-medium text-foreground ${appBody}`}>
                {REGULATORY_MAPPING_DIGEST_VERSION}
              </p>
            </div>
          </div>

          {pending.changes.length > 0 ? (
            <div className="mb-6">
              <PlaceholderCard title="Pending changes vs last snapshot">
                <ul className={`space-y-2 ${appBody}`}>
                  {pending.changes.slice(0, 12).map((c) => (
                    <li key={`${c.kind}-${c.id}`} className="border-b border-white/[0.06] pb-2 last:border-0">
                      <span className="text-accent">{c.kind}</span> — {c.label}
                      <p className={appMeta}>{c.detail}</p>
                    </li>
                  ))}
                </ul>
              </PlaceholderCard>
            </div>
          ) : (
            <p className={`mb-6 ${appMeta} text-muted`}>
              {previous
                ? "No mapping changes since the last stored snapshot."
                : "Run a digest once to record the baseline fingerprint."}
            </p>
          )}

          {canEdit ? (
            <div className="mb-6">
              <PlaceholderCard title="Notification settings">
                <form action={updateMappingDigestSettingsAction} className={`space-y-4 ${appBody}`}>
                  <div>
                    <label className={appLabel} htmlFor="compliance_mapping_digest_webhook_url">
                      HTTPS webhook URL
                    </label>
                    <input
                      id="compliance_mapping_digest_webhook_url"
                      name="compliance_mapping_digest_webhook_url"
                      type="url"
                      defaultValue={webhookUrl}
                      placeholder="https://hooks.example.com/zentro-mapping"
                      className="mt-1 w-full max-w-xl rounded-lg border border-white/[0.12] bg-surface/60 px-3 py-2 text-sm"
                    />
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="compliance_mapping_digest_email_enabled"
                      defaultChecked={emailEnabled}
                      className="rounded border-white/20"
                    />
                    <span className={appMeta}>Email org owners and admins when mappings change</span>
                  </label>
                  <button
                    type="submit"
                    className="rounded-full border border-white/[0.14] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
                  >
                    Save settings
                  </button>
                </form>
              </PlaceholderCard>
            </div>
          ) : null}

          {canEdit ? (
            <form action={runMappingDigestAction} className="mb-6 flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded-full border border-accent/40 bg-accent/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-accent hover:bg-accent/25"
              >
                Run digest now
              </button>
              {pending.changeCount === 0 ? (
                <button
                  type="submit"
                  name="forceNotify"
                  value="1"
                  className="rounded-full border border-white/[0.14] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted hover:border-white/25"
                >
                  Force notify (baseline)
                </button>
              ) : null}
            </form>
          ) : null}

          <a
            href="/api/governance/compliance/mapping-digest"
            className="mb-6 inline-block text-[11px] font-semibold uppercase tracking-wide text-accent hover:underline"
          >
            Preview JSON payload
          </a>

          <PlaceholderCard title="Delivery log">
            {deliveries.length === 0 ? (
              <p className={appMeta}>No digest deliveries yet.</p>
            ) : (
              <ul className={`space-y-2 ${appBody}`}>
                {deliveries.map((d) => (
                  <li key={d.id} className="flex flex-wrap justify-between gap-2 border-b border-white/[0.06] pb-2">
                    <span>
                      {d.deliveryStatus} · {d.changeCount} change(s)
                    </span>
                    <span className={appMeta}>{new Date(d.createdAt).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </PlaceholderCard>
        </>
      )}
    </>
  );
}
