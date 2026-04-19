import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/app/PageHeader";
import { appBody, appMeta, appPanelTitle } from "@/lib/app-typography";
import {
  getCheckoutUrlForUser,
  getCustomerPortalUrl,
  getTeamCheckoutUrlForUser,
} from "@/lib/billing";
import {
  billingPlanFromSummary,
  getSubscriptionSummary,
  paidProductDisplayName,
  paidProductTierFromSummary,
} from "@/lib/billing/plan";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Billing",
  description: "Plan, subscription status, and upgrade checkout.",
};

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const upgradeHint =
    typeof sp.upgrade === "string" ? sp.upgrade : undefined;

  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Billing"
          description="Connect Supabase to manage accounts and subscription state."
        />
        <p className={`max-w-xl text-muted ${appBody}`}>
          Set <span className="font-mono text-foreground/90">NEXT_PUBLIC_SUPABASE_URL</span> and{" "}
          <span className="font-mono text-foreground/90">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> in
          your environment, then redeploy.
        </p>
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?next=/settings/billing");
  }

  const { summary, error: queryError } = await getSubscriptionSummary(supabase, user.id);
  const plan = billingPlanFromSummary(summary);
  const planDisplayName = paidProductDisplayName(summary, plan);
  const paidTier = paidProductTierFromSummary(summary, plan);
  const checkoutHref = getCheckoutUrlForUser(user.id);
  const teamCheckoutHref = getTeamCheckoutUrlForUser(user.id);
  const portalHref = getCustomerPortalUrl();

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Billing"
        description="Plan and subscription status sync from your billing provider via webhooks. Apply database migrations so this page can read your subscription."
      />

      {upgradeHint === "automations" && plan === "free" && !queryError ? (
        <div className={`mb-6 rounded-xl border border-accent/35 bg-accent/[0.08] px-4 py-3 text-foreground/90 shadow-[0_0_32px_-12px_rgba(94,225,255,0.35)] backdrop-blur-sm ${appBody}`}>
          <p className="font-medium text-foreground">Automations require a paid plan</p>
          <p className={`mt-1 text-muted ${appMeta}`}>
            Subscribe below (or finish billing webhook setup) to unlock the Automations console.
          </p>
        </div>
      ) : null}

      {queryError ? (
        <div className={`mb-6 rounded-xl border border-amber-400/25 bg-amber-500/[0.08] px-4 py-3 text-foreground/90 backdrop-blur-sm ${appBody}`}>
          <p className="font-medium">Could not read subscriptions</p>
          <p className={`mt-1 font-mono ${appMeta}`}>
            {queryError.message}
            {queryError.code ? ` (${queryError.code})` : ""}
          </p>
          <p className={`mt-2 ${appMeta}`}>
            Apply{" "}
            <code className="rounded bg-surface px-1 py-0.5 text-accent">
              supabase/migrations/20260418120000_platform_spine.sql
            </code>{" "}
            in the Supabase SQL Editor, and set{" "}
            <code className="rounded bg-surface px-1 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code> on
            the server for webhooks.
          </p>
        </div>
      ) : null}

      <div className="max-w-xl space-y-6">
        {plan === "free" && !queryError ? (
          <div className="shynvo-glass rounded-2xl border border-accent/20 bg-accent/[0.06] p-5 md:p-6 shadow-[0_0_32px_-14px_rgba(94,225,255,0.25)]">
            <h2 className={`${appPanelTitle} text-foreground/95`}>You&apos;re on the free tier</h2>
            <p className={`mt-2 text-muted ${appBody}`}>
              Core console features stay available while you evaluate. Limits below are the current
              product stance; billing adjusts automatically when you subscribe.
            </p>
            <ul className={`mt-4 space-y-2 text-foreground/85 ${appBody}`}>
              <li className="flex gap-2">
                <span className="text-accent">·</span>
                <span>
                  <span className="font-medium text-foreground/90">Incidents &amp; services</span> —
                  full tracking; export needs Supabase sign-in.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">·</span>
                <span>
                  <span className="font-medium text-foreground/90">Automations</span> — dry-run and
                  review flows; provider execution stays on paid plans.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">·</span>
                <span>
                  <span className="font-medium text-foreground/90">API &amp; connectors</span> —
                  keys and proxies scale with your deployment; alert ingest is paid-gated in
                  production.
                </span>
              </li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className={`inline-flex h-10 items-center justify-center rounded-xl border border-white/[0.14] bg-white/[0.04] px-4 font-medium text-foreground transition-colors hover:border-accent/40 ${appBody}`}
              >
                View pricing
              </Link>
              {checkoutHref || teamCheckoutHref ? (
                <a
                  href={(checkoutHref ?? teamCheckoutHref) as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex h-10 items-center justify-center rounded-xl bg-accent px-4 font-semibold text-background hover:opacity-95 ${appBody}`}
                >
                  Upgrade
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="shynvo-glass rounded-2xl p-5 md:p-6">
          <h2 className={`${appPanelTitle} text-foreground/95`}>Current plan</h2>
          <p className="mt-2 text-2xl font-semibold text-foreground">{planDisplayName}</p>
          {plan === "paid" && paidTier === "unknown" && !queryError ? (
            <p className={`mt-2 ${appMeta}`}>
              To show <span className="text-foreground/80">Shynvo Pro</span> or{" "}
              <span className="text-foreground/80">Shynvo Team</span> here, set{" "}
              <code className={`rounded bg-surface px-1 font-mono text-accent ${appMeta}`}>
                NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID
              </code>{" "}
              and{" "}
              <code className={`rounded bg-surface px-1 font-mono text-accent ${appMeta}`}>
                NEXT_PUBLIC_LEMONSQUEEZY_TEAM_VARIANT_ID
              </code>{" "}
              to match your Lemon variant ids.
            </p>
          ) : null}
          {summary ? (
            <dl className={`mt-4 space-y-2 font-mono ${appMeta}`}>
              <div className="flex justify-between gap-4">
                <dt>Status</dt>
                <dd className="text-foreground/90">{summary.status}</dd>
              </div>
              {summary.lemon_variant_id ? (
                <div className="flex justify-between gap-4">
                  <dt>Variant</dt>
                  <dd className="truncate text-foreground/90" title={summary.lemon_variant_id}>
                    {summary.lemon_variant_id}
                  </dd>
                </div>
              ) : null}
              {summary.renews_at ? (
                <div className="flex justify-between gap-4">
                  <dt>Renews</dt>
                  <dd className="text-foreground/90">{summary.renews_at}</dd>
                </div>
              ) : null}
              {summary.ends_at ? (
                <div className="flex justify-between gap-4">
                  <dt>Ends</dt>
                  <dd className="text-foreground/90">{summary.ends_at}</dd>
                </div>
              ) : null}
            </dl>
          ) : !queryError ? (
            <p className={`mt-3 text-muted ${appBody}`}>
              No subscription on file yet. After you subscribe, the provider sends a webhook and
              this page will update (usually within seconds).
            </p>
          ) : null}
        </div>

        <div className="shynvo-glass rounded-2xl p-5 md:p-6">
          <h2 className={`${appPanelTitle} text-foreground/95`}>Upgrade</h2>
          <p className={`mt-2 text-muted ${appBody}`}>
            Checkout includes your account id so webhooks can attach the subscription to your
            profile.
          </p>
          {checkoutHref || teamCheckoutHref ? (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {checkoutHref ? (
                <a
                  href={checkoutHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-accent px-5 font-semibold text-background shadow-[0_0_28px_-8px_rgba(94,225,255,0.45)] transition-[opacity,box-shadow] hover:opacity-95 hover:shadow-[0_0_36px_-6px_rgba(94,225,255,0.55)] sm:min-w-[10rem] ${appBody}`}
                >
                  {teamCheckoutHref ? "Pro checkout" : "Open checkout"}
                </a>
              ) : null}
              {teamCheckoutHref ? (
                <a
                  href={teamCheckoutHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.04] px-5 font-semibold text-foreground transition-[border-color,box-shadow] hover:border-accent/40 hover:shadow-[0_0_24px_-12px_rgba(94,225,255,0.2)] sm:min-w-[10rem] ${appBody}`}
                >
                  Team checkout
                </a>
              ) : null}
            </div>
          ) : (
            <p className={`mt-3 text-muted ${appBody}`}>
              Set{" "}
              <code className={`rounded bg-surface px-1 py-0.5 font-mono text-accent ${appMeta}`}>
                NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL
              </code>{" "}
              (Pro) and optionally{" "}
              <code className={`rounded bg-surface px-1 py-0.5 font-mono text-accent ${appMeta}`}>
                NEXT_PUBLIC_LEMONSQUEEZY_TEAM_CHECKOUT_URL
              </code>{" "}
              (Team) to your Lemon checkout links.
            </p>
          )}
        </div>

        {plan === "paid" && portalHref ? (
          <div className="shynvo-glass rounded-2xl p-5 md:p-6">
            <h2 className={`${appPanelTitle} text-foreground/95`}>Manage subscription</h2>
            <p className={`mt-2 text-muted ${appBody}`}>
              Open your billing customer portal to update payment method, view invoices, or cancel.
            </p>
            <a
              href={portalHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-4 inline-flex h-11 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.03] px-5 font-semibold text-foreground transition-[border-color,color,box-shadow] hover:border-accent/40 hover:text-accent hover:shadow-[0_0_24px_-12px_rgba(94,225,255,0.2)] ${appBody}`}
            >
              Customer portal
            </a>
          </div>
        ) : plan === "paid" && !portalHref ? (
          <div className="shynvo-glass-subtle rounded-2xl border border-dashed border-white/[0.12] p-5 md:p-6">
            <h2 className={`${appPanelTitle} text-foreground/95`}>Customer portal</h2>
            <p className={`mt-2 text-muted ${appBody}`}>
              Optional: set{" "}
              <code className={`rounded bg-surface px-1 font-mono text-accent ${appMeta}`}>
                NEXT_PUBLIC_LEMONSQUEEZY_CUSTOMER_PORTAL_URL
              </code>{" "}
              (or <code className={`font-mono ${appMeta}`}>LEMONSQUEEZY_CUSTOMER_PORTAL_URL</code>) to
              your provider&apos;s customer portal URL.
            </p>
          </div>
        ) : null}

        <p className={appMeta}>
          Billing changes at your provider (cancel, payment method) sync via webhook. Questions?{" "}
          <Link
            href={encodeURI("mailto:support@shynvo.app?subject=Billing")}
            className="text-accent hover:underline"
          >
            support@shynvo.app
          </Link>
        </p>
      </div>
    </>
  );
}
