import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AutomationsConsole } from "@/components/automations/AutomationsConsole";
import { PageHeader } from "@/components/app/PageHeader";
import { listAutomationDryRuns } from "@/lib/automations/dry-runs-db";
import { listDryRuns } from "@/lib/automations/runs-dev";
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
