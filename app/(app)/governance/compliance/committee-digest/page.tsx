import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appLabel, appMeta, appOverline } from "@/lib/app-typography";
import {
  buildQuarterlyObligationCommitteeDigestPack,
  COMMITTEE_DIGEST_QUARTERLY_DAYS,
  getCommitteeDigestOrgSettings,
  listCommitteeDigestDeliveries,
} from "@/lib/compliance/quarterly-obligation-committee-digest";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
  deliverCommitteeDigestAction,
  updateCommitteeDigestSettingsAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Committee obligation digest",
  description:
    "Quarterly email digest of forecast peaks, crossover clusters, and evidence request SLA breaches.",
};

export const dynamic = "force-dynamic";

export default async function CommitteeDigestPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    delivered?: string;
    emails?: string;
    webhook?: string;
    saved?: string;
  }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Committee obligation digest"
        description="Sign in to configure and deliver the quarterly obligation committee digest."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/committee-digest");
  }

  const sp = await searchParams;
  const orgContext = await getOrgContextForUser(user.id);
  const canEdit = orgContext.role ? canManageMembers(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildQuarterlyObligationCommitteeDigestPack(user.id, {
        orgId: orgContext.orgId,
        orgName: orgContext.orgName ?? undefined,
        supabase,
      })
    : null;

  const settings = orgContext.orgId
    ? await getCommitteeDigestOrgSettings(orgContext.orgId, supabase)
    : null;

  const deliveries = orgContext.orgId
    ? await listCommitteeDigestDeliveries(orgContext.orgId, { supabase })
    : [];

  const err = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Quarterly obligation committee digest"
        description="Scheduled rollup for committee chairs — forecast peak weeks, multi-framework crossover clusters, and assessor evidence SLA breaches. Delivered to owners and admins by email with optional HTTPS webhook."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />

      {typeof sp.delivered === "string" ? (
        <p className={`mb-4 ${appMeta} text-emerald-300`}>
          Digest delivered — {sp.emails ?? "0"} email(s)
          {sp.webhook === "1" ? ", webhook sent" : ""}.
        </p>
      ) : null}
      {typeof sp.saved === "string" ? (
        <p className={`mb-4 ${appMeta} text-emerald-300`}>Settings saved.</p>
      ) : null}
      {err ? <p className={`mb-4 ${appMeta} text-danger`}>{decodeURIComponent(err)}</p> : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Organization required"
          description="Join an organization with compliance obligations to preview the committee digest."
          ctas={[
            { href: "/governance/compliance/obligation-forecast", label: "Obligation forecast" },
            { href: "/governance/compliance/committee-meeting-pack", label: "Committee pack" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/committee-digest?horizonDays=90&format=json"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
            <Link href="/governance/compliance/obligation-forecast" className={`${appMeta} text-accent hover:underline`}>
              Forecast timeline
            </Link>
            {" · "}
            <Link href="/governance/compliance/obligation-crossover" className={`${appMeta} text-accent hover:underline`}>
              Crossover report
            </Link>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Quarterly due</p>
              <p
                className={`mt-1 text-lg font-semibold ${pack.quarterlyDue ? "text-accent" : "text-emerald-300"} ${appBody}`}
              >
                {pack.quarterlyDue ? "Yes — ready to send" : "Not yet"}
              </p>
              <p className={`mt-1 ${appMeta} text-muted`}>
                {pack.daysSinceLastDelivery != null
                  ? `${pack.daysSinceLastDelivery}d since last · cadence ${COMMITTEE_DIGEST_QUARTERLY_DAYS}d`
                  : "No prior delivery"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Forecast peak</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.forecast?.peakWeekCount ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Crossover clusters</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.crossover?.crossoverClusterCount ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>SLA overdue</p>
              <p className={`mt-1 text-2xl font-semibold text-danger ${appBody}`}>
                {pack.sla?.overdueCount ?? 0}
              </p>
            </div>
          </div>

          {canEdit && settings ? (
            <ConsolePanel title="Delivery settings">
              <form action={updateCommitteeDigestSettingsAction} className={`space-y-4 ${appBody}`}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="digest_email_enabled"
                    defaultChecked={settings.digestEmailEnabled}
                    className="rounded border-border"
                  />
                  <span>Email owners and admins (committee chairs)</span>
                </label>
                <div>
                  <label className={appLabel} htmlFor="digest_webhook_url">
                    Webhook URL (HTTPS JSON)
                  </label>
                  <input
                    id="digest_webhook_url"
                    name="digest_webhook_url"
                    type="url"
                    defaultValue={settings.digestWebhookUrl ?? ""}
                    placeholder="https://..."
                    className="mt-1 w-full max-w-xl rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-full border border-white/[0.14] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide hover:border-accent/35"
                >
                  Save settings
                </button>
              </form>
              <div className="mt-4 flex flex-wrap gap-2">
                <form action={deliverCommitteeDigestAction}>
                  <button
                    type="submit"
                    className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent hover:bg-accent/20"
                  >
                    Deliver digest now
                  </button>
                </form>
                {pack.quarterlyDue ? null : (
                  <form action={deliverCommitteeDigestAction}>
                    <input type="hidden" name="force" value="1" />
                    <button
                      type="submit"
                      className="rounded-full border border-white/[0.14] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
                    >
                      Force deliver (off-cycle)
                    </button>
                  </form>
                )}
              </div>
            </ConsolePanel>
          ) : null}

          <div className="mt-6">
            <ConsolePanel title="Digest preview">
              <pre className={`max-h-[480px] overflow-auto whitespace-pre-wrap ${appMeta} text-foreground/85`}>
                {pack.digestPreviewMarkdown}
              </pre>
            </ConsolePanel>
          </div>

          {deliveries.length > 0 ? (
            <div className="mt-6">
              <ConsolePanel title="Delivery history">
                <ul className={`space-y-2 ${appMeta}`}>
                  {deliveries.map((d) => (
                    <li key={d.id} className="rounded-lg border border-white/[0.06] px-3 py-2">
                      <span className="font-mono text-xs text-muted">{d.createdAt.slice(0, 19)}</span>
                      {" · "}
                      <span className="text-foreground">{d.deliveryStatus}</span>
                      {" · peak "}
                      {d.peakWeekCount}
                      {" · crossover "}
                      {d.crossoverClusterCount}
                      {" · SLA overdue "}
                      {d.slaOverdueCount}
                      {d.deliveryNote ? (
                        <span className="block text-muted">{d.deliveryNote}</span>
                      ) : null}
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
