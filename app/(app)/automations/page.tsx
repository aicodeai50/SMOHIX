import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AutomationsConsole } from "@/components/automations/AutomationsConsole";
import { ConsoleAmbientBanner } from "@/components/console/ConsoleAmbientBanner";
import { GuardedAutomationIdentity } from "@/components/guardrails/GuardedAutomationIdentity";
import { ExecutionBadge } from "@/components/guardrails/ExecutionBadge";
import { PageHeader } from "@/components/app/PageHeader";
import { appBody, appPanelTitle } from "@/lib/app-typography";
import { loadConsoleAmbientSnapshot } from "@/lib/console/load-ambient-status";
import { getOrgContextForUser } from "@/lib/org/context";
import { listAutomationDryRuns } from "@/lib/automations/dry-runs-db";
import { listAutomationExecutionsForUser } from "@/lib/automations/executions-db";
import type { ExecutionReceipt } from "@/lib/automations/executions-dev";
import { listDryRuns } from "@/lib/automations/runs-dev";
import type { DryRunRecord } from "@/lib/automations/runs-dev";
import { getLatestAuditWhisper } from "@/lib/audit/whispers";
import { isRobotBackendConfigured } from "@/lib/backend-urls";
import { billingPlanFromSummary, getSubscriptionSummary } from "@/lib/billing/plan";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Automations",
  description: "Playbooks and execution via your automation service.",
};

export const dynamic = "force-dynamic";

const INCIDENT_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function AutomationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const rawInc = typeof sp.incident === "string" ? sp.incident.trim() : "";
  const linkedIncidentId = INCIDENT_UUID.test(rawInc) ? rawInc : null;
  let runs: DryRunRecord[] = [];
  let initialExecutions: ExecutionReceipt[] = [];
  let auditTrailOnDryRun = false;
  let auditWhisper = null;

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
          <div className="mb-4">
            <GuardedAutomationIdentity />
          </div>
          <div className="smohix-glass rounded-2xl p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={`${appPanelTitle} text-foreground`}>Subscription required</h2>
              <ExecutionBadge tone="warn" title="Paid plan required for automation console">
                Execution blocked
              </ExecutionBadge>
            </div>
            <p className={`mt-2 max-w-md text-muted ${appBody}`}>
              Choose a plan and complete checkout while signed in so your subscription links to
              this account. Then you can run playbooks and persist dry-run history.
            </p>
            <Link
              href="/settings/billing?upgrade=automations"
              className={`mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-accent px-5 font-semibold text-background transition-opacity hover:opacity-90 ${appBody}`}
            >
              View billing & checkout
            </Link>
          </div>
        </>
      );
    }
    auditTrailOnDryRun = true;
    auditWhisper = await getLatestAuditWhisper(user.id);
    const orgContext = await getOrgContextForUser(user.id);
    const { runs: dbRuns, fromDb } = await listAutomationDryRuns(supabase, {
      userId: user.id,
      orgId: orgContext.orgId,
    });
    runs = fromDb ? dbRuns : listDryRuns(`u:${user.id}`);
    initialExecutions = (
      await listAutomationExecutionsForUser(supabase, user.id, 12, orgContext.orgId)
    ).map((x) => ({
      id: x.id,
      playbookId: x.playbookId,
      ok: x.ok,
      at: x.createdAt,
      mode: x.mode,
      rollbackPlan: x.rollbackPlan,
      approvalNote: x.approvalNote,
      ...(x.incidentId ? { incidentId: x.incidentId } : {}),
      ...(x.decisionBrief ? { decisionBrief: x.decisionBrief } : {}),
      ...(x.expectedOutcome ? { expectedOutcome: x.expectedOutcome } : {}),
      ...(x.actualOutcome ? { actualOutcome: x.actualOutcome } : {}),
      ...(typeof x.decisionAccuracyScore === "number"
        ? { decisionAccuracyScore: x.decisionAccuracyScore }
        : {}),
      ...(x.policySuggestions?.length ? { policySuggestions: x.policySuggestions } : {}),
      ...(x.decisionBrief
        ? {
            changeRisk: {
              score: x.decisionBrief.riskScore,
              tier:
                x.decisionBrief.riskScore >= 85
                  ? "critical"
                  : x.decisionBrief.riskScore >= 70
                    ? "high"
                    : x.decisionBrief.riskScore >= 45
                      ? "medium"
                      : "low",
              factors: [],
            },
          }
        : {}),
    }));
  } else {
    const tenantKey = ((await cookies()).get("smohix_dev_tid")?.value ?? (await cookies()).get("zentro_dev_tid")?.value) ?? "anon";
    runs = listDryRuns(tenantKey);
  }

  const robotConnectorConfigured = isRobotBackendConfigured();
  const ambient = await loadConsoleAmbientSnapshot({ context: "automations" });

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Automations"
        description="Playbooks with guarded dry-runs and evidence. Connect automation under Settings → Integrations for live robot execution; otherwise simulated runs are recorded."
      />
      <ConsoleAmbientBanner snapshot={ambient} />
      <AutomationsConsole
        initialRuns={runs}
        auditTrailOnDryRun={auditTrailOnDryRun}
        auditWhisper={auditWhisper}
        robotConnectorConfigured={robotConnectorConfigured}
        linkedIncidentId={linkedIncidentId}
        initialExecutions={initialExecutions}
      />
    </>
  );
}
