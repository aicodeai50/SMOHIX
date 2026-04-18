import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AutomationsConsole } from "@/components/automations/AutomationsConsole";
import { PageHeader } from "@/components/app/PageHeader";
import { listDryRuns } from "@/lib/automations/runs-dev";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Automations",
  description: "Playbooks and execution via your automation service.",
};

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  let tenantKey = "anon";
  if (hasSupabaseAuth()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/auth/sign-in?next=/automations");
    }
    tenantKey = `u:${user.id}`;
  } else {
    tenantKey = (await cookies()).get("shynvo_dev_tid")?.value ?? "anon";
  }

  const runs = listDryRuns(tenantKey);

  return (
    <>
      <PageHeader
        title="Automations"
        description="Playbooks with dry-runs against your robot service when SHYNVO_ROBOT_API_URL is set; otherwise simulated runs are recorded for this workspace."
      />
      <AutomationsConsole initialRuns={runs} />
    </>
  );
}
