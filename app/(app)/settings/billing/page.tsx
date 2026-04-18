import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/app/PageHeader";
import { getCheckoutUrlForUser } from "@/lib/billing";
import {
  billingPlanFromSummary,
  getSubscriptionSummary,
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
        <p className="max-w-xl text-sm text-muted">
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
  const checkoutHref = getCheckoutUrlForUser(user.id);

  return (
    <>
      <PageHeader
        title="Billing"
        description="Your plan comes from Lemon Squeezy webhooks into Shynvo. Run the SQL migration in Supabase if tables are missing."
      />

      {upgradeHint === "automations" && plan === "free" && !queryError ? (
        <div className="mb-6 rounded-lg border border-accent/30 bg-accent-dim/30 px-4 py-3 text-sm text-foreground/90">
          <p className="font-medium text-foreground">Automations require a paid plan</p>
          <p className="mt-1 text-muted">
            Subscribe below (or complete your Lemon webhook setup) to unlock the Automations
            console.
          </p>
        </div>
      ) : null}

      {queryError ? (
        <div className="mb-6 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-foreground/90">
          <p className="font-medium">Could not read subscriptions</p>
          <p className="mt-1 font-mono text-xs text-muted">
            {queryError.message}
            {queryError.code ? ` (${queryError.code})` : ""}
          </p>
          <p className="mt-2 text-xs text-muted">
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
        <div className="rounded-xl border border-border bg-surface/80 p-5">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Current plan</h2>
          <p className="mt-2 text-2xl font-semibold capitalize text-foreground">
            {plan === "paid" ? "Paid" : "Free"}
          </p>
          {summary ? (
            <dl className="mt-4 space-y-2 font-mono text-xs text-muted">
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
            <p className="mt-3 text-sm text-muted">
              No subscription on file yet. After you subscribe, Lemon will send a webhook and
              this page will update (usually within seconds).
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-border bg-surface/80 p-5">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Upgrade</h2>
          <p className="mt-2 text-sm text-muted">
            Checkout includes your account id so webhooks can attach the subscription to your
            profile.
          </p>
          {checkoutHref ? (
            <a
              href={checkoutHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Open checkout
            </a>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Set{" "}
              <code className="rounded bg-surface px-1 py-0.5 font-mono text-xs text-accent">
                NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL
              </code>{" "}
              to your Lemon checkout link.
            </p>
          )}
        </div>

        <p className="text-xs text-muted">
          Billing changes in Lemon (cancel, payment method) sync via webhook. Questions?{" "}
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
