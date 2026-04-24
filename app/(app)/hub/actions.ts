"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createApprovalRequest } from "@/lib/approvals/data";
import { devCreateApproval } from "@/lib/approvals/dev-store";
import { appendAuditEvent } from "@/lib/audit/append";
import { insertAutomationDryRun } from "@/lib/automations/dry-runs-db";
import { recordDryRun } from "@/lib/automations/runs-dev";
import { recordDevIncident } from "@/lib/incidents/dev-store";
import { createIncidentForUser } from "@/lib/incidents/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function launchKillerDemoAction() {
  const nowTag = new Date().toISOString().replace("T", " ").slice(0, 16);
  const demoTitle = `Demo: Checkout failover risk review (${nowTag})`;
  const demoAction = `Execute database failover for checkout service (${nowTag})`;
  const demoPolicy = "two-person approval | change window | risk:high";

  if (hasSupabaseAuth()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/auth/sign-in?next=/hub");
    }

    const incident = await createIncidentForUser(user.id, {
      title: demoTitle,
      severity: "critical",
      status: "investigating",
      ownerHint: "platform-oncall",
      runbookSlug: "db-failover",
      externalRef: `demo:${Date.now()}`,
    });
    if (!incident.ok) {
      redirect(`/hub?demo_error=${encodeURIComponent(incident.reason)}`);
    }

    const approval = await createApprovalRequest({
      userId: user.id,
      devTenantId: null,
      actionLabel: demoAction,
      requestedBy: "demo-seeder",
      policyHint: demoPolicy,
    });
    if (!approval.ok) {
      redirect(`/hub?demo_error=${encodeURIComponent(approval.reason)}`);
    }

    await insertAutomationDryRun(supabase, user.id, {
      playbookId: "db-failover",
      ok: true,
      detail: "Dry-run only: previewed command set and blast radius checks for demo.",
      incidentId: incident.id,
    });

    await appendAuditEvent({
      event_type: "demo.killer_flow_seeded",
      user_id: user.id,
      details: {
        incident_id: incident.id,
        approval_action: demoAction,
      },
    });

    revalidatePath("/hub");
    revalidatePath("/overview");
    revalidatePath("/approvals");
    revalidatePath(`/incidents/${incident.id}`);
    redirect(`/incidents/${incident.id}?demo=1`);
  }

  const tid = (await cookies()).get("shynvo_dev_tid")?.value ?? "anon";
  const incidentId = recordDevIncident(tid, {
    title: demoTitle,
    severity: "critical",
    status: "investigating",
    ownerHint: "platform-oncall",
    runbookSlug: "db-failover",
  });
  devCreateApproval(tid, {
    action: demoAction,
    requestedBy: "demo-seeder",
    policy: demoPolicy,
  });
  recordDryRun(tid, {
    playbookId: "db-failover",
    ok: true,
    detail: "Dry-run only: previewed command set and blast radius checks for demo.",
    incidentId,
  });

  revalidatePath("/hub");
  revalidatePath("/overview");
  revalidatePath("/approvals");
  revalidatePath(`/incidents/${incidentId}`);
  redirect(`/incidents/${incidentId}?demo=1`);
}
