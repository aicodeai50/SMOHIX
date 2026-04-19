import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AlertIngestPanel } from "@/components/settings/AlertIngestPanel";
import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { appBody, appLabel, appMeta, appOverline, appPanelTitle } from "@/lib/app-typography";
import { billingPlanFromSummary, getSubscriptionSummary } from "@/lib/billing/plan";
import { listServicesForUser } from "@/lib/services/data";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { createServiceAction, deleteServiceAction } from "./actions";

export const metadata: Metadata = {
  title: "Services",
  description: "Service catalog and alert ingest for incidents.",
};

export const dynamic = "force-dynamic";

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Services"
          description="Connect Supabase and sign in to manage a service catalog and paid alert ingest."
        />
        <p className={`max-w-xl text-muted ${appBody}`}>
          Local mode does not persist services. Configure auth to use this module.
        </p>
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/services");
  }

  const { summary, error: subscriptionError } = await getSubscriptionSummary(supabase, user.id);
  const subscriptionGatedFree =
    !subscriptionError && billingPlanFromSummary(summary) === "free";

  const sp = await searchParams;
  const err = typeof sp.error === "string" ? sp.error : undefined;

  const rows = await listServicesForUser(user.id);
  const serviceRoleConfigured = Boolean(createServiceSupabaseClient());

  if (subscriptionGatedFree) {
    return (
      <>
        <PageHeader
          title="Services"
          description="Map systems and owners, then open incidents from monitoring via a secure webhook — included with an active subscription."
        />
        {err ? (
          <p className={`mb-4 rounded-xl border border-danger/25 bg-danger-dim/50 px-4 py-3 text-danger ${appBody}`}>
            {err}
          </p>
        ) : null}
        <div className="shynvo-glass rounded-2xl p-6 md:p-8">
          <h2 className={appPanelTitle}>Subscription required</h2>
          <p className={`mt-2 max-w-md text-muted ${appBody}`}>
            Service catalog and alert ingest are paid capabilities: they tie your observability
            stack to incident records and use server-side token verification.
          </p>
          <Link
            href="/settings/billing?upgrade=services"
            className={`mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-accent px-5 font-semibold text-background transition-opacity hover:opacity-90 ${appBody}`}
          >
            View billing & checkout
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Services"
        description="Catalog systems you operate, attach them to incidents, and accept monitoring webhooks that create incidents automatically."
      />
      {err ? (
        <p className={`mb-4 rounded-xl border border-danger/25 bg-danger-dim/50 px-4 py-3 text-danger ${appBody}`}>
          {err}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <PlaceholderCard title="Catalog">
          <form action={createServiceAction} className="space-y-3">
            <div>
              <label htmlFor="svc-name" className={`mb-1 block ${appLabel}`}>
                Name
              </label>
              <input
                id="svc-name"
                name="name"
                required
                maxLength={200}
                placeholder="payments-api"
                className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <div>
              <label htmlFor="svc-env" className={`mb-1 block ${appLabel}`}>
                Environment
              </label>
              <input
                id="svc-env"
                name="environment"
                maxLength={80}
                placeholder="production"
                className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <div>
              <label htmlFor="svc-owner" className={`mb-1 block ${appLabel}`}>
                Owner hint
              </label>
              <input
                id="svc-owner"
                name="owner_hint"
                maxLength={200}
                placeholder="Team: Platform / @pagerduty-schedule"
                className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <div>
              <label htmlFor="svc-desc" className={`mb-1 block ${appLabel}`}>
                Description
              </label>
              <textarea
                id="svc-desc"
                name="description"
                rows={3}
                maxLength={2000}
                placeholder="What this system does, dependencies, criticality…"
                className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <button
              type="submit"
              className={`h-10 rounded-lg bg-accent px-4 font-medium text-background hover:opacity-90 ${appBody}`}
            >
              Add service
            </button>
          </form>

          <div className="mt-6 border-t border-white/[0.06] pt-5">
            <h3 className={appOverline}>Registered</h3>
            {rows.length === 0 ? (
              <div className="mt-4">
                <ConsoleEmptyState
                  title="No services in the catalog"
                  description="Add a system you operate so incidents can link to it and ingest can resolve service_name."
                  ctas={[{ href: "#svc-name", label: "Fill form above" }]}
                />
              </div>
            ) : (
              <ul className={`mt-3 space-y-2 ${appBody}`}>
                {rows.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-foreground/90">{r.name}</p>
                      {r.environment ? (
                        <p className={appMeta}>{r.environment}</p>
                      ) : null}
                      {r.ownerHint ? (
                        <p className={appMeta}>{r.ownerHint}</p>
                      ) : null}
                      <p className={`mt-1 font-mono text-accent/80 ${appMeta}`}>{r.id}</p>
                    </div>
                    <form action={deleteServiceAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        type="submit"
                        className={`font-medium text-danger hover:underline ${appMeta}`}
                      >
                        Remove
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PlaceholderCard>

        <PlaceholderCard title="Monitoring ingest">
          <AlertIngestPanel serviceRoleConfigured={serviceRoleConfigured} />
        </PlaceholderCard>
      </div>
    </>
  );
}
