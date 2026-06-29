import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/app/PageHeader";
import { BillingCheckoutActions } from "@/components/settings/BillingCheckoutActions";
import { Card, CardHeader } from "@/components/ui/Card";
import { appBody, appMeta, appPanelTitle } from "@/lib/app-typography";
import { isBillingConfigured } from "@/lib/billing";
import { getMailtoHref, SITE_EMAIL_CONTACT } from "@/lib/billing";
import {
  billingPlanFromSummary,
  getBillingBalance,
  getBillingTransactions,
  getSubscriptionSummary,
  paidProductDisplayName,
  paidProductTierFromSummary,
} from "@/lib/billing/plan";
import { isPayPalConfigured } from "@/lib/paypal/config";
import { PRICING_TIERS } from "@/lib/product-identity";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Billing",
  description: "Plan, balance, PayPal checkout, and transaction history.",
};

export const dynamic = "force-dynamic";

function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const upgradeHint = typeof sp.upgrade === "string" ? sp.upgrade : undefined;
  const checkoutStatus = typeof sp.checkout === "string" ? sp.checkout : undefined;
  const errorHint = typeof sp.error === "string" ? sp.error : undefined;

  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Billing"
          description="Connect Supabase to manage accounts and billing."
        />
        <p className={`max-w-xl text-muted ${appBody}`}>
          Set Supabase environment variables and redeploy to enable billing.
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
  const { balanceCents, error: balanceError } = await getBillingBalance(supabase, user.id);
  const { transactions, error: txError } = await getBillingTransactions(supabase, user.id);
  const paypalReady = isPayPalConfigured();

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Billing"
        description="Manage your plan, account balance, and PayPal transactions."
      />

      {checkoutStatus === "success" ? (
        <div className={`mb-6 rounded-xl border border-success/35 bg-success-dim px-4 py-3 ${appBody}`}>
          <p className="font-medium text-success">Payment submitted</p>
          <p className={`mt-1 text-muted ${appMeta}`}>
            Your subscription or top-up will appear here once PayPal confirms the webhook.
          </p>
        </div>
      ) : null}

      {checkoutStatus === "cancelled" ? (
        <div className={`mb-6 rounded-xl border border-white/[0.12] bg-white/[0.03] px-4 py-3 ${appBody}`}>
          Checkout was cancelled. You can try again below.
        </div>
      ) : null}

      {errorHint ? (
        <div className={`mb-6 rounded-xl border border-danger/35 bg-danger-dim px-4 py-3 ${appBody}`}>
          {decodeURIComponent(errorHint)}
        </div>
      ) : null}

      {upgradeHint === "automations" && plan === "free" && !queryError ? (
        <div className={`mb-6 rounded-xl border border-accent/35 bg-accent/[0.08] px-4 py-3 ${appBody}`}>
          <p className="font-medium text-foreground">Automations require a paid plan</p>
          <p className={`mt-1 text-muted ${appMeta}`}>
            Subscribe to Pro or Team below to unlock automation execution.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Account balance" description="Prepaid credits for usage-based features." />
            <p className="text-3xl font-bold text-foreground">
              {formatCents(balanceCents)}
            </p>
            {balanceError ? (
              <p className={`mt-2 text-danger ${appMeta}`}>{balanceError}</p>
            ) : null}
            {paypalReady ? (
              <div className="mt-4">
                <BillingCheckoutActions
                  tier="top_up"
                  label="Top up $25"
                  topUpAmount={25}
                />
              </div>
            ) : (
              <p className={`mt-3 text-muted ${appMeta}`}>
                Configure PayPal credentials to enable top-ups.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader title="Current plan" />
            <p className="text-2xl font-semibold text-foreground">{planDisplayName}</p>
            {summary ? (
              <dl className={`mt-4 space-y-2 font-mono ${appMeta}`}>
                <div className="flex justify-between gap-4">
                  <dt>Status</dt>
                  <dd className="text-foreground/90">{summary.status}</dd>
                </div>
                {summary.paypal_subscription_id ? (
                  <div className="flex justify-between gap-4">
                    <dt>PayPal sub</dt>
                    <dd className="truncate text-foreground/90" title={summary.paypal_subscription_id}>
                      {summary.paypal_subscription_id.slice(0, 12)}…
                    </dd>
                  </div>
                ) : null}
                {summary.renews_at ? (
                  <div className="flex justify-between gap-4">
                    <dt>Renews</dt>
                    <dd className="text-foreground/90">{summary.renews_at}</dd>
                  </div>
                ) : null}
              </dl>
            ) : !queryError ? (
              <p className={`mt-3 text-muted ${appBody}`}>
                No active subscription. Choose a plan below to upgrade.
              </p>
            ) : null}
            {queryError ? (
              <p className={`mt-3 text-amber-300 ${appMeta}`}>{queryError.message}</p>
            ) : null}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Upgrade plan"
              description="Secure checkout powered by PayPal. Subscriptions sync via webhook."
            />
            {paypalReady && isBillingConfigured() ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {PRICING_TIERS.filter((t) => t.id !== "free").map((tier) => (
                  <div
                    key={tier.id}
                    className={`rounded-xl border p-4 ${
                      paidTier === tier.id
                        ? "border-accent/40 bg-accent/[0.06]"
                        : "border-white/[0.08]"
                    }`}
                  >
                    <p className={`${appPanelTitle}`}>{tier.name}</p>
                    <p className="mt-1 text-lg font-bold">
                      {tier.price}
                      <span className="text-sm font-normal text-muted">{tier.period}</span>
                    </p>
                    <p className={`mt-2 ${appMeta} text-muted`}>{tier.description}</p>
                    {paidTier === tier.id && plan === "paid" ? (
                      <p className={`mt-3 text-success ${appMeta}`}>Current plan</p>
                    ) : (
                      <div className="mt-4">
                        <BillingCheckoutActions
                          tier={tier.id as "pro" | "team"}
                          label={tier.cta}
                          variant={tier.highlight ? "primary" : "secondary"}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-muted ${appBody}`}>
                Set{" "}
                <code className="rounded bg-surface px-1 font-mono text-accent">PAYPAL_CLIENT_ID</code>,{" "}
                <code className="rounded bg-surface px-1 font-mono text-accent">PAYPAL_CLIENT_SECRET</code>, and plan IDs{" "}
                <code className="rounded bg-surface px-1 font-mono text-accent">PAYPAL_PLAN_ID_PRO</code> /{" "}
                <code className="rounded bg-surface px-1 font-mono text-accent">PAYPAL_PLAN_ID_TEAM</code>.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader title="Transaction history" />
            {txError ? (
              <p className={`text-muted ${appMeta}`}>{txError}</p>
            ) : transactions.length === 0 ? (
              <p className={`text-muted ${appBody}`}>No transactions yet.</p>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {transactions.map((tx) => (
                  <li key={tx.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className={`font-medium text-foreground/90 ${appBody}`}>
                        {tx.description ?? tx.type}
                      </p>
                      <p className={`${appMeta} text-muted`}>
                        {new Date(tx.created_at).toLocaleString()} · {tx.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm text-foreground">
                        {formatCents(tx.amount_cents, tx.currency)}
                      </p>
                      {tx.invoice_url ? (
                        <a
                          href={tx.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${appMeta} text-accent hover:underline`}
                        >
                          Invoice
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <p className={`mt-8 ${appMeta}`}>
        Billing questions?{" "}
        <Link href={getMailtoHref("billing")} className="text-accent hover:underline">
          {SITE_EMAIL_CONTACT}
        </Link>
      </p>
    </>
  );
}
