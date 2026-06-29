import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appLabel, appMeta, appOverline } from "@/lib/app-typography";
import {
  buildPeakWeekStaffingDigestPack,
  getPeakWeekStaffingDigestOrgSettings,
  listPeakWeekStaffingDigestDeliveries,
} from "@/lib/compliance/committee-peak-week-staffing-digest";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
  deliverPeakWeekStaffingDigestAction,
  updatePeakWeekStaffingDigestSettingsAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Peak-week staffing digest",
  description:
    "Email or Slack when capacity shortfall and load imbalance coincide in the forecast peak week.",
};

export const dynamic = "force-dynamic";

export default async function PeakWeekStaffingDigestPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    delivered?: string;
    emails?: string;
    slack?: string;
    webhook?: string;
    saved?: string;
  }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Peak-week staffing digest"
        description="Sign in to configure peak-week staffing alerts."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/peak-week-staffing-digest");
  }

  const sp = await searchParams;
  const orgContext = await getOrgContextForUser(user.id);
  const canEdit = orgContext.role ? canManageMembers(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildPeakWeekStaffingDigestPack(user.id, {
        orgId: orgContext.orgId,
        orgName: orgContext.orgName ?? undefined,
        supabase,
      })
    : null;

  const settings = orgContext.orgId
    ? await getPeakWeekStaffingDigestOrgSettings(orgContext.orgId, supabase)
    : null;

  const deliveries = orgContext.orgId
    ? await listPeakWeekStaffingDigestDeliveries(orgContext.orgId, { supabase })
    : [];

  const err = typeof sp.error === "string" ? sp.error : undefined;
  const c = pack?.coincidence;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Committee peak-week staffing digest"
        description="Fires when forecast peak-week capacity shortfall and owner load imbalance coincide — email, Slack, and optional HTTPS webhook to owners and admins."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />

      {typeof sp.delivered === "string" ? (
        <p className={`mb-4 ${appMeta} text-emerald-300`}>
          Digest delivered — {sp.emails ?? "0"} email(s)
          {sp.slack === "1" ? ", Slack sent" : ""}
          {sp.webhook === "1" ? ", webhook sent" : ""}.
        </p>
      ) : null}
      {typeof sp.saved === "string" ? (
        <p className={`mb-4 ${appMeta} text-emerald-300`}>Settings saved.</p>
      ) : null}
      {err ? <p className={`mb-4 ${appMeta} text-danger`}>{decodeURIComponent(err)}</p> : null}

      {!orgContext.orgId || !pack || !c ? (
        <ConsoleEmptyState
          title="Staffing digest unavailable"
          description="Join an organization with forecast obligations, capacity budget, and ownership data."
          ctas={[
            { href: "/governance/compliance/committee-capacity-budget", label: "Capacity budget" },
            { href: "/governance/compliance/obligation-load-balancing", label: "Load balancing" },
          ]}
        />
      ) : (
        <>
          <div
            className={`mb-6 rounded-xl border px-4 py-3 ${c.shouldAlert ? "border-danger/40 bg-danger/10" : "border-emerald-500/30 bg-emerald-500/5"}`}
          >
            <p className={appOverline}>Coincidence status</p>
            <p
              className={`mt-1 font-semibold ${c.shouldAlert ? "text-danger" : "text-emerald-300"} ${appBody}`}
            >
              {c.shouldAlert ? "Alert — send digest" : "No alert"}
            </p>
            <p className={`mt-2 ${appMeta} text-muted`}>{c.alertReason}</p>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Shortfall</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {c.capacityShortfallHours}h
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Imbalance</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {c.imbalanceScore}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Suggestions</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {c.suggestionCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Last delivery</p>
              <p className={`mt-1 text-sm font-semibold text-foreground ${appBody}`}>
                {pack.lastDeliveryAt?.slice(0, 10) ?? "Never"}
              </p>
            </div>
          </div>

          {canEdit ? (
            <ConsolePanel title="Delivery settings">
              <form action={updatePeakWeekStaffingDigestSettingsAction} className={`space-y-4 ${appBody}`}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="digest_enabled"
                    defaultChecked={settings?.digestEnabled}
                    className="rounded border-border"
                  />
                  <span>Enable staffing digest evaluation</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="email_enabled"
                    defaultChecked={settings?.emailEnabled}
                    className="rounded border-border"
                  />
                  <span>Email owners and admins</span>
                </label>
                <div>
                  <label className={appLabel} htmlFor="webhook_url">
                    HTTPS webhook URL (optional)
                  </label>
                  <input
                    id="webhook_url"
                    name="webhook_url"
                    type="url"
                    defaultValue={settings?.webhookUrl ?? ""}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm"
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
                <form action={deliverPeakWeekStaffingDigestAction}>
                  <button
                    type="submit"
                    disabled={!c.shouldAlert}
                    className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent hover:bg-accent/20 disabled:opacity-40"
                  >
                    Send digest now
                  </button>
                </form>
                {c.shouldAlert ? (
                  <form action={deliverPeakWeekStaffingDigestAction}>
                    <input type="hidden" name="force" value="1" />
                    <button
                      type="submit"
                      className="rounded-full border border-white/[0.14] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide hover:border-accent/35"
                    >
                      Force resend
                    </button>
                  </form>
                ) : null}
              </div>
              <p className={`mt-3 ${appMeta} text-muted`}>
                Slack: <code className="text-foreground/80">ZENTRO_SLACK_NOTIFY_PEAK_WEEK_STAFFING</code>
                {" · "}
                Cron: <code className="text-foreground/80">ZENTRO_PEAK_WEEK_STAFFING_DIGEST_CRON_SECRET</code>
              </p>
            </ConsolePanel>
          ) : null}

          <div className="mt-6">
            <ConsolePanel title="Digest preview">
              <pre className={`max-h-64 overflow-auto whitespace-pre-wrap text-xs ${appMeta}`}>
                {pack.digestPreviewMarkdown}
              </pre>
            </ConsolePanel>
          </div>

          {deliveries.length > 0 ? (
            <div className="mt-6">
              <ConsolePanel title="Delivery log">
                <ul className={`space-y-2 ${appMeta}`}>
                  {deliveries.map((row) => (
                    <li key={row.id} className="rounded-lg border border-white/[0.06] px-3 py-2">
                      <span className="font-mono text-xs text-muted">{row.createdAt.slice(0, 19)}</span>
                      {" · "}
                      {row.peakWeekKey} · shortfall {row.shortfallHours}h · imbalance {row.imbalanceScore}
                    </li>
                  ))}
                </ul>
              </ConsolePanel>
            </div>
          ) : null}

          <p className={`mt-6 ${appMeta}`}>
            <Link
              href="/governance/compliance/committee-capacity-budget"
              className="text-accent hover:underline"
            >
              Capacity budget
            </Link>
            {" · "}
            <Link
              href="/governance/compliance/obligation-load-balancing"
              className="text-accent hover:underline"
            >
              Load balancing
            </Link>
          </p>
        </>
      )}
    </>
  );
}
