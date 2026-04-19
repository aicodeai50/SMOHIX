import { listApprovalsForUser } from "@/lib/approvals/data";
import type { ApprovalRow } from "@/lib/approvals/types";
import { listAutomationDryRuns } from "@/lib/automations/dry-runs-db";
import { listDryRuns } from "@/lib/automations/runs-dev";
import type { DryRunRecord } from "@/lib/automations/runs-dev";
import { getLatestAuditWhisper, type AuditWhisper } from "@/lib/audit/whispers";
import { billingPlanFromSummary, getSubscriptionSummary } from "@/lib/billing/plan";
import type { ConnectorRow } from "@/lib/connectors-health";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import type { IncidentRow } from "@/lib/incidents/types";

export type AttentionItem = {
  id: string;
  label: string;
  href: string;
};

export type OverviewGovernance = {
  auditTrail: "active" | "inactive";
  approvalsQueue: "active" | "session";
  connectors: { configured: number; reachable: number; total: number };
  automationsConsole: "paid" | "free_blocked" | "dev_session";
};

export type OverviewCommandCenterData = {
  robotEnvConfigured: boolean;
  attention: AttentionItem[];
  pendingApprovals: ApprovalRow[];
  pendingCount: number;
  recentDryRuns: DryRunRecord[];
  lastAuditWhisper: AuditWhisper | null;
  governance: OverviewGovernance;
  /** Incidents that look untriaged (open + no owner + no runbook). */
  triageGapCount: number;
};

function needsTriage(row: IncidentRow): boolean {
  if (row.status === "resolved") return false;
  return !row.ownerHint && !row.runbookSlug;
}

export async function loadOverviewCommandCenterData(input: {
  userId: string | null;
  devTenantKey: string | null;
  incidents: IncidentRow[];
  connectors: ConnectorRow[];
}): Promise<OverviewCommandCenterData> {
  const robotEnvConfigured = Boolean(process.env.SHYNVO_ROBOT_API_URL?.trim());
  const triageGapCount = input.incidents.filter(needsTriage).length;

  const { pending, source: approvalSource } = await listApprovalsForUser({
    userId: input.userId ?? "local",
    devTenantId: input.devTenantKey,
  });

  let recentDryRuns: DryRunRecord[] = [];
  let lastAuditWhisper: AuditWhisper | null = null;
  let automationsConsole: OverviewGovernance["automationsConsole"] = "dev_session";
  let auditTrail: "active" | "inactive" = "inactive";

  if (hasSupabaseAuth() && input.userId) {
    auditTrail = "active";
    lastAuditWhisper = await getLatestAuditWhisper(input.userId);
    const supabase = await createServerSupabaseClient();
    const { summary, error: subErr } = await getSubscriptionSummary(supabase, input.userId);
    if (!subErr && billingPlanFromSummary(summary) === "free") {
      automationsConsole = "free_blocked";
    } else {
      automationsConsole = "paid";
    }
    const { runs: dbRuns, fromDb } = await listAutomationDryRuns(supabase);
    recentDryRuns = fromDb ? dbRuns : listDryRuns(`u:${input.userId}`);
  } else {
    const tid = input.devTenantKey ?? "anon";
    recentDryRuns = listDryRuns(tid);
  }

  const connectorsConfigured = input.connectors.filter((c) => c.baseUrl).length;
  const connectorsReachable = input.connectors.filter((c) => c.ok === true).length;

  const governance: OverviewGovernance = {
    auditTrail,
    approvalsQueue: approvalSource === "database" ? "active" : "session",
    connectors: {
      configured: connectorsConfigured,
      reachable: connectorsReachable,
      total: input.connectors.length,
    },
    automationsConsole,
  };

  const attention: AttentionItem[] = [];

  if (pending.length > 0) {
    attention.push({
      id: "approvals",
      label:
        pending.length === 1
          ? "1 approval is waiting for a decision"
          : `${pending.length} approvals are waiting for a decision`,
      href: "/approvals",
    });
  }

  const badRuns = recentDryRuns.slice(0, 20).filter((r) => !r.ok).length;
  if (badRuns > 0) {
    attention.push({
      id: "dry-run-issues",
      label:
        badRuns === 1
          ? "1 recent dry-run reported issues"
          : `${badRuns} recent dry-runs reported issues`,
      href: "/automations",
    });
  }

  if (triageGapCount > 0) {
    attention.push({
      id: "triage",
      label:
        triageGapCount === 1
          ? "1 open incident has no owner or runbook"
          : `${triageGapCount} open incidents have no owner or runbook`,
      href: "/incidents",
    });
  }

  if (connectorsConfigured === 0) {
    attention.push({
      id: "connectors",
      label: "No automation or reasoning connectors configured",
      href: "/settings/connectors",
    });
  } else {
    const down = input.connectors.filter((c) => c.baseUrl && c.ok === false);
    if (down.length > 0) {
      attention.push({
        id: "connector-down",
        label:
          down.length === 1
            ? "1 configured connector is unreachable"
            : `${down.length} configured connectors are unreachable`,
        href: "/settings/connectors",
      });
    }
  }

  if (governance.automationsConsole === "free_blocked") {
    attention.push({
      id: "billing-automations",
      label: "Automation console is blocked on the free plan — upgrade to run playbooks",
      href: "/settings/billing?upgrade=automations",
    });
  }

  return {
    robotEnvConfigured,
    attention,
    pendingApprovals: pending.slice(0, 5),
    pendingCount: pending.length,
    recentDryRuns: recentDryRuns.slice(0, 5),
    lastAuditWhisper,
    governance,
    triageGapCount,
  };
}
