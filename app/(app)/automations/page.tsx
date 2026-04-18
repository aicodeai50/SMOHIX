import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AutomationsConsole } from "@/components/automations/AutomationsConsole";
import { PageHeader } from "@/components/app/PageHeader";
import { listAutomationDryRuns } from "@/lib/automations/dry-runs-db";
import { listDryRuns } from "@/lib/automations/runs-dev";
import { billingPlanFromSummary, getSubscriptionSummary } from "@/lib/billing/plan";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Automations",
  description: "Playbooks and execution via your automation service.",
};

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  let runs;
  if (hasSupabaseAuth()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/auth/sign-in?next=/automations");
    }
    const { summary, error: subscriptionError } = await getSubscriptionSummary(
      supabase,
      user.id,
    );
    if (!subscriptionError && billingPlanFromSummary(summary) === "free") {
      return (
        <>
          <PageHeader
            title="Automations"
            description="Playbooks and dry-runs require an active subscription when organization billing is enabled."
          />
          <div className="shynvo-glass rounded-2xl p-6 md:p-8">
            <h2 className="text-lg font-semibold text-foreground">Subscription required</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              Choose a plan and complete checkout while signed in so your subscription links to
              this account. Then you can run playbooks and persist dry-run history.
            </p>
            <Link
              href="/settings/billing?upgrade=automations"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              View billing & checkout
            </Link>
          </div>
        </>
      );
    }
    const { runs: dbRuns, fromDb } = await listAutomationDryRuns(supabase);
    runs = fromDb ? dbRuns : listDryRuns(`u:${user.id}`);
  } else {
    const tenantKey = (await cookies()).get("shynvo_dev_tid")?.value ?? "anon";
    runs = listDryRuns(tenantKey);
  }

  return (
    <>
      <PageHeader
        title="Automations"
        description="Playbooks with dry-runs against your robot service when SHYNVO_ROBOT_API_URL is set; otherwise simulated runs are recorded. Signed-in accounts persist dry-runs and emit audit events when the automation_dry_runs migration is applied."
      />
      <AutomationsConsole initialRuns={runs} />
    </>
  );
}
