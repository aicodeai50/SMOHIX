import { listApprovalsForUser } from "@/lib/approvals/data";
import type { ApprovalRow } from "@/lib/approvals/types";
import { listAutomationDryRuns } from "@/lib/automations/dry-runs-db";
import { listDryRuns } from "@/lib/automations/runs-dev";
import type { DryRunRecord } from "@/lib/automations/runs-dev";
import { getLatestAuditWhisper, type AuditWhisper } from "@/lib/audit/whispers";
import { billingPlanFromSummary, getSubscriptionSummary } from "@/lib/billing/plan";
import { dryRunOutcomePresentation } from "@/lib/guardrails/execution-outcome";
import type { ConnectorRow } from "@/lib/connectors-health";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import type { IncidentRow } from "@/lib/incidents/types";

export type AttentionGroup = {
  kind: "approvals" | "incident" | "workspace";
  id: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  primaryAction: { label: string; href: string };
  secondaryLinks?: { label: string; href: string }[];
  /** Human-readable recency line (dry-run / activity). */
  lastActivityLabel?: string;
};

export type OverviewGovernance = {
  auditTrail: "active" | "inactive";
  approvalsQueue: "active" | "session";
  connectors: { configured: number; reachable: number; total: number };
  automationsConsole: "paid" | "free_blocked" | "dev_session";
};

export type OverviewCommandCenterData = {
  robotEnvConfigured: boolean;
  /** Grouped problems with a single primary CTA per card. */
  attentionGroups: AttentionGroup[];
  pendingApprovals: ApprovalRow[];
  pendingCount: number;
  recentDryRuns: DryRunRecord[];
  lastAuditWhisper: AuditWhisper | null;
  governance: OverviewGovernance;
  triageGapCount: number;
};

function openIncidentContextGaps(row: IncidentRow): { missingOwner: boolean; missingRunbook: boolean } {
  if (row.status === "resolved") {
    return { missingOwner: false, missingRunbook: false };
  }
  return {
    missingOwner: !row.ownerHint,
    missingRunbook: !row.runbookSlug,
  };
}

function formatDryRunActivity(rec: DryRunRecord, robotConfigured: boolean): string {
  const { label } = dryRunOutcomePresentation(rec.ok, robotConfigured);
  const t = new Date(rec.at);
  const when = t.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Last: dry-run → ${label} · ${when}`;
}

function buildAttentionGroups(input: {
  incidents: IncidentRow[];
  recentDryRuns: DryRunRecord[];
  pending: ApprovalRow[];
  connectors: ConnectorRow[];
  governance: OverviewGovernance;
  robotEnvConfigured: boolean;
}): AttentionGroup[] {
  const groups: AttentionGroup[] = [];
  const { incidents, recentDryRuns, pending, connectors, governance, robotEnvConfigured } = input;

  if (pending.length > 0) {
    groups.push({
      kind: "approvals",
      id: "pending-approvals",
      title: "Pending decisions",
      subtitle:
        pending.length === 1
          ? "1 approval request needs a human decision"
          : `${pending.length} approval requests need a human decision`,
      bullets: pending.slice(0, 4).map((p) => p.action.slice(0, 120)),
      primaryAction: { label: "Review approvals", href: "/approvals" },
      secondaryLinks: [{ label: "Audit log", href: "/audit" }],
    });
  }

  const incidentById = new Map(incidents.map((r) => [r.id, r]));

  const latestFailedByIncident = new Map<string, DryRunRecord>();
  for (const r of recentDryRuns.slice(0, 40)) {
    if (r.ok || !r.incidentId) continue;
    const prev = latestFailedByIncident.get(r.incidentId);
    if (!prev || new Date(r.at) > new Date(prev.at)) {
      latestFailedByIncident.set(r.incidentId, r);
    }
  }

  const incidentGroupIds = new Set<string>();
  for (const row of incidents) {
    const { missingOwner, missingRunbook } = openIncidentContextGaps(row);
    if (missingOwner || missingRunbook) {
      incidentGroupIds.add(row.id);
    }
  }
  for (const id of latestFailedByIncident.keys()) {
    incidentGroupIds.add(id);
  }

  const incidentCards: AttentionGroup[] = [];
  for (const iid of incidentGroupIds) {
    const row = incidentById.get(iid);
    const bad = latestFailedByIncident.get(iid);
    const gaps = row ? openIncidentContextGaps(row) : { missingOwner: false, missingRunbook: false };
    const missingOwner = gaps.missingOwner;
    const missingRunbook = gaps.missingRunbook;

    const bullets: string[] = [];
    if (bad) {
      bullets.push(`Dry-run failed for playbook “${bad.playbookId}”.`);
    }
    if (missingOwner) {
      bullets.push("No owner / on-call set.");
    }
    if (missingRunbook) {
      bullets.push("No runbook linked.");
    }
    if (!bullets.length) {
      continue;
    }

    let primaryAction: { label: string; href: string };
    if (bad) {
      primaryAction = {
        label: "Review automation",
        href: `/automations?incident=${encodeURIComponent(iid)}`,
      };
    } else if (missingOwner) {
      primaryAction = {
        label: "Assign owner",
        href: `/incidents/${encodeURIComponent(iid)}#incident-context`,
      };
    } else {
      primaryAction = {
        label: "Attach runbook",
        href: `/incidents/${encodeURIComponent(iid)}#incident-context`,
      };
    }

    const title = row?.title ?? `Incident ${iid.slice(0, 8)}…`;
    const subtitle = row ? `${row.severity} · ${row.status}` : "Unknown incident row";

    incidentCards.push({
      kind: "incident",
      id: iid,
      title,
      subtitle,
      bullets,
      primaryAction,
      secondaryLinks: [{ label: "Open incident", href: `/incidents/${encodeURIComponent(iid)}` }],
      lastActivityLabel: bad ? formatDryRunActivity(bad, robotEnvConfigured) : undefined,
    });
  }

  incidentCards.sort((a, b) => {
    const aBad = a.bullets.some((x) => x.startsWith("Dry-run failed")) ? 1 : 0;
    const bBad = b.bullets.some((x) => x.startsWith("Dry-run failed")) ? 1 : 0;
    return bBad - aBad;
  });

  groups.push(...incidentCards);

  const workspaceBullets: string[] = [];
  const connectorsConfigured = connectors.filter((c) => c.baseUrl).length;
  const down = connectors.filter((c) => c.baseUrl && c.ok === false);

  if (connectorsConfigured === 0) {
    workspaceBullets.push("No reasoning or robot connector URLs are configured.");
  } else if (down.length > 0) {
    workspaceBullets.push(
      down.length === 1
        ? "One configured connector is unreachable."
        : `${down.length} configured connectors are unreachable.`,
    );
  }
  if (governance.automationsConsole === "free_blocked") {
    workspaceBullets.push("Automation console is blocked on the free plan.");
  }

  if (workspaceBullets.length > 0) {
    const primaryAction =
      governance.automationsConsole === "free_blocked"
        ? { label: "View billing", href: "/settings/billing?upgrade=automations" }
        : { label: "Fix connectors", href: "/settings/connectors" };

    groups.push({
      kind: "workspace",
      id: "workspace",
      title: "Workspace configuration",
      subtitle: "Signals that affect more than one incident",
      bullets: workspaceBullets,
      primaryAction,
      secondaryLinks: [{ label: "Connector settings", href: "/settings/connectors" }],
    });
  }

  return groups;
}

export async function loadOverviewCommandCenterData(input: {
  userId: string | null;
  devTenantKey: string | null;
  incidents: IncidentRow[];
  connectors: ConnectorRow[];
}): Promise<OverviewCommandCenterData> {
  const robotEnvConfigured = Boolean(process.env.ZENTRO_ROBOT_API_URL?.trim());
  const triageGapCount = input.incidents.filter((r) => {
    const g = openIncidentContextGaps(r);
    return g.missingOwner || g.missingRunbook;
  }).length;

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

  const attentionGroups = buildAttentionGroups({
    incidents: input.incidents,
    recentDryRuns,
    pending,
    connectors: input.connectors,
    governance,
    robotEnvConfigured,
  });

  return {
    robotEnvConfigured,
    attentionGroups,
    pendingApprovals: pending.slice(0, 5),
    pendingCount: pending.length,
    recentDryRuns: recentDryRuns.slice(0, 5),
    lastAuditWhisper,
    governance,
    triageGapCount,
  };
}
