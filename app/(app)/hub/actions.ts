"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createApprovalRequest } from "@/lib/approvals/data";
import { devCreateApproval } from "@/lib/approvals/dev-store";
import { appendAuditEvent } from "@/lib/audit/append";
import { getOrgContextForUser } from "@/lib/org/context";
import { insertAutomationDryRun } from "@/lib/automations/dry-runs-db";
import { recordDryRun } from "@/lib/automations/runs-dev";
import { recordDevIncident } from "@/lib/incidents/dev-store";
import { createIncidentForUser } from "@/lib/incidents/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function launchGuidedScenarioAction() {
  const nowTag = new Date().toISOString().replace("T", " ").slice(0, 16);
  const scenarioTitle = `Guided scenario: Checkout failover readiness (${nowTag})`;
  const scenarioAction = `Execute database failover for checkout service (${nowTag})`;
  const scenarioPolicy = "two-person approval | change window | risk:high";

  if (hasSupabaseAuth()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/auth/sign-in?next=/hub");
    }

    const orgContext = await getOrgContextForUser(user.id);

    const incident = await createIncidentForUser(user.id, {
      title: scenarioTitle,
      severity: "critical",
      status: "investigating",
      ownerHint: "platform-oncall",
      runbookSlug: "db-failover",
      externalRef: `guided:${Date.now()}`,
      orgId: orgContext.orgId,
    });
    if (!incident.ok) {
      redirect(`/hub?scenario_error=${encodeURIComponent(incident.reason)}`);
    }

    const approval = await createApprovalRequest({
      userId: user.id,
      devTenantId: null,
      actionLabel: scenarioAction,
      requestedBy: "guided-scenario-seeder",
      policyHint: scenarioPolicy,
      orgId: orgContext.orgId,
    });
    if (!approval.ok) {
      redirect(`/hub?scenario_error=${encodeURIComponent(approval.reason)}`);
    }

    await insertAutomationDryRun(supabase, user.id, {
      playbookId: "db-failover",
      ok: true,
      detail: "Dry-run only: previewed command set and blast radius checks.",
      incidentId: incident.id,
      orgId: orgContext.orgId,
    });

    await appendAuditEvent({
      event_type: "guided.scenario_seeded",
      user_id: user.id,
      org_id: orgContext.orgId,
      details: {
        incident_id: incident.id,
        approval_action: scenarioAction,
      },
    });

    revalidatePath("/hub");
    revalidatePath("/overview");
    revalidatePath("/approvals");
    revalidatePath(`/incidents/${incident.id}`);
    redirect(`/incidents/${incident.id}?scenario=1`);
  }

  const tid = (await cookies()).get("zentro_dev_tid")?.value ?? "anon";
  const incidentId = recordDevIncident(tid, {
    title: scenarioTitle,
    severity: "critical",
    status: "investigating",
    ownerHint: "platform-oncall",
    runbookSlug: "db-failover",
  });
  devCreateApproval(tid, {
    action: scenarioAction,
    requestedBy: "guided-scenario-seeder",
    policy: scenarioPolicy,
  });
  recordDryRun(tid, {
    playbookId: "db-failover",
    ok: true,
    detail: "Dry-run only: previewed command set and blast radius checks.",
    incidentId,
  });

  revalidatePath("/hub");
  revalidatePath("/overview");
  revalidatePath("/approvals");
  revalidatePath(`/incidents/${incidentId}`);
  redirect(`/incidents/${incidentId}?scenario=1`);
}
