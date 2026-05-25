import type { SupabaseClient } from "@supabase/supabase-js";

import { appendAuditEvent } from "@/lib/audit/append";
import { deliverCrossStaffingCommitteeEscalation } from "@/lib/compliance/cross-staffing-committee-escalation";
import { deliverStaffingSlaBreachDigest } from "@/lib/compliance/staffing-action-sla-breach-digest";
import {
  deliverStaffingCompletionRollup,
  staffingCompletionPeriodKey,
} from "@/lib/compliance/staffing-completion-rollup";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const STAFFING_DIGEST_AUTO_CHAIN_VERSION = "zentro-staffing-digest-auto-chain/1";

export type StaffingDigestChainStepName = "rollup" | "sla_breach" | "escalation";

export type StaffingDigestChainStepStatus = "sent" | "skipped" | "failed";

export type StaffingDigestChainStepResult = {
  step: StaffingDigestChainStepName;
  status: StaffingDigestChainStepStatus;
  reason: string;
  emailsSent?: number;
  slackSent?: boolean;
};

export type StaffingDigestAutoChainRunRow = {
  id: string;
  periodKey: string;
  rollupStatus: StaffingDigestChainStepStatus;
  rollupReason: string | null;
  slaStatus: StaffingDigestChainStepStatus;
  slaReason: string | null;
  escalationStatus: StaffingDigestChainStepStatus;
  escalationReason: string | null;
  deliveryNote: string | null;
  createdAt: string;
};

export type StaffingDigestAutoChainOrgSettings = {
  autoChainEnabled: boolean;
};

const ROLLUP_SKIP_HINTS = [
  "already delivered",
  "no tracked staffing actions",
  "rollup not sent",
] as const;

const SLA_SKIP_HINTS = [
  "already delivered",
  "no sla breach",
  "no staffing actions breach",
  "not required",
  "disabled for org",
] as const;

const ESCALATION_SKIP_HINTS = [
  "already delivered",
  "not required",
  "no sla breaches remain",
  "waits until",
  "disabled for org",
  "was not emailed",
] as const;

export function staffingDigestAutoChainPeriodKey(now = new Date()): string {
  return staffingCompletionPeriodKey(now);
}

export function classifyStaffingDigestChainStep(
  ok: boolean,
  reason: string,
  skipHints: readonly string[],
): StaffingDigestChainStepStatus {
  if (ok) return "sent";
  const lower = reason.toLowerCase();
  if (skipHints.some((hint) => lower.includes(hint.toLowerCase()))) {
    return "skipped";
  }
  return "failed";
}

export function summarizeStaffingDigestAutoChain(
  steps: StaffingDigestChainStepResult[],
): string {
  const sent = steps.filter((s) => s.status === "sent").map((s) => s.step);
  if (sent.length === 0) {
    return "Auto-chain completed — no deliveries sent (see step reasons).";
  }
  return `Auto-chain delivered: ${sent.join(" → ")}.`;
}

export async function getStaffingDigestAutoChainOrgSettings(
  orgId: string,
  supabase?: SupabaseClient,
): Promise<StaffingDigestAutoChainOrgSettings> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data } = await client
    .from("organizations")
    .select("compliance_staffing_digest_auto_chain_enabled")
    .eq("id", orgId)
    .maybeSingle();

  return {
    autoChainEnabled: data?.compliance_staffing_digest_auto_chain_enabled !== false,
  };
}

export async function updateStaffingDigestAutoChainOrgSettings(
  orgId: string,
  input: Partial<Pick<StaffingDigestAutoChainOrgSettings, "autoChainEnabled">>,
  supabase?: SupabaseClient,
): Promise<boolean> {
  const client = supabase ?? (await createServerSupabaseClient());
  if (input.autoChainEnabled === undefined) return true;

  const { error } = await client
    .from("organizations")
    .update({ compliance_staffing_digest_auto_chain_enabled: input.autoChainEnabled })
    .eq("id", orgId);

  return !error;
}

async function wasStaffingDigestAutoChainRun(
  orgId: string,
  periodKey: string,
  supabase: SupabaseClient,
): Promise<boolean> {
  const { data } = await supabase
    .from("compliance_staffing_digest_auto_chain_runs")
    .select("id")
    .eq("org_id", orgId)
    .eq("period_key", periodKey)
    .maybeSingle();
  return Boolean(data?.id);
}

export async function listStaffingDigestAutoChainRuns(
  orgId: string,
  opts?: { supabase?: SupabaseClient; limit?: number },
): Promise<StaffingDigestAutoChainRunRow[]> {
  const client = opts?.supabase ?? (await createServerSupabaseClient());
  const { data } = await client
    .from("compliance_staffing_digest_auto_chain_runs")
    .select(
      "id, period_key, rollup_status, rollup_reason, sla_status, sla_reason, escalation_status, escalation_reason, delivery_note, created_at",
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 10);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    periodKey: String(row.period_key),
    rollupStatus: String(row.rollup_status) as StaffingDigestChainStepStatus,
    rollupReason: row.rollup_reason ? String(row.rollup_reason) : null,
    slaStatus: String(row.sla_status) as StaffingDigestChainStepStatus,
    slaReason: row.sla_reason ? String(row.sla_reason) : null,
    escalationStatus: String(row.escalation_status) as StaffingDigestChainStepStatus,
    escalationReason: row.escalation_reason ? String(row.escalation_reason) : null,
    deliveryNote: row.delivery_note ? String(row.delivery_note) : null,
    createdAt: String(row.created_at),
  }));
}

export type RunStaffingDigestAutoChainResult =
  | {
      ok: true;
      periodKey: string;
      steps: StaffingDigestChainStepResult[];
      summary: string;
    }
  | { ok: false; reason: string };

export async function runStaffingDigestAutoChain(
  actorUserId: string,
  orgId: string,
  opts: {
    siteOrigin: string;
    orgName?: string;
    horizonDays?: number;
    supabase?: SupabaseClient;
    force?: boolean;
    scheduled?: boolean;
    now?: Date;
  },
): Promise<RunStaffingDigestAutoChainResult> {
  if (!hasSupabaseAuth() || !actorUserId || !orgId) {
    return { ok: false, reason: "Not configured." };
  }

  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const settings = await getStaffingDigestAutoChainOrgSettings(orgId, supabase);
  if (!settings.autoChainEnabled) {
    return { ok: false, reason: "Staffing digest auto-chain disabled for org." };
  }

  const periodKey = staffingDigestAutoChainPeriodKey(opts.now);
  if (!opts.force && (await wasStaffingDigestAutoChainRun(orgId, periodKey, supabase))) {
    return { ok: false, reason: "Auto-chain already ran this UTC week." };
  }

  const deliverOpts = {
    siteOrigin: opts.siteOrigin,
    orgName: opts.orgName,
    supabase,
    force: opts.force,
    scheduled: opts.scheduled ?? false,
  };

  const rollupRaw = await deliverStaffingCompletionRollup(actorUserId, orgId, {
    ...deliverOpts,
    horizonDays: opts.horizonDays,
  });
  const rollupStep: StaffingDigestChainStepResult = {
    step: "rollup",
    status: classifyStaffingDigestChainStep(
      rollupRaw.ok,
      rollupRaw.ok ? "delivered" : rollupRaw.reason,
      ROLLUP_SKIP_HINTS,
    ),
    reason: rollupRaw.ok ? "Completion rollup delivered." : rollupRaw.reason,
    emailsSent: rollupRaw.ok ? rollupRaw.emailsSent : undefined,
  };

  const slaRaw = await deliverStaffingSlaBreachDigest(actorUserId, orgId, deliverOpts);
  const slaStep: StaffingDigestChainStepResult = {
    step: "sla_breach",
    status: classifyStaffingDigestChainStep(
      slaRaw.ok,
      slaRaw.ok ? "delivered" : slaRaw.reason,
      SLA_SKIP_HINTS,
    ),
    reason: slaRaw.ok ? "SLA breach digest delivered." : slaRaw.reason,
    emailsSent: slaRaw.ok ? slaRaw.emailsSent : undefined,
    slackSent: slaRaw.ok ? slaRaw.slackSent : undefined,
  };

  const escalationRaw = await deliverCrossStaffingCommitteeEscalation(actorUserId, orgId, {
    ...deliverOpts,
    now: opts.now,
  });
  const escalationStep: StaffingDigestChainStepResult = {
    step: "escalation",
    status: classifyStaffingDigestChainStep(
      escalationRaw.ok,
      escalationRaw.ok ? "delivered" : escalationRaw.reason,
      ESCALATION_SKIP_HINTS,
    ),
    reason: escalationRaw.ok ? "Committee escalation delivered." : escalationRaw.reason,
    emailsSent: escalationRaw.ok ? escalationRaw.emailsSent : undefined,
    slackSent: escalationRaw.ok ? escalationRaw.slackSent : undefined,
  };

  const steps = [rollupStep, slaStep, escalationStep];
  const summary = summarizeStaffingDigestAutoChain(steps);

  if (opts.force) {
    await supabase
      .from("compliance_staffing_digest_auto_chain_runs")
      .delete()
      .eq("org_id", orgId)
      .eq("period_key", periodKey);
  }

  await supabase.from("compliance_staffing_digest_auto_chain_runs").insert({
    org_id: orgId,
    period_key: periodKey,
    rollup_status: rollupStep.status,
    rollup_reason: rollupStep.reason,
    sla_status: slaStep.status,
    sla_reason: slaStep.reason,
    escalation_status: escalationStep.status,
    escalation_reason: escalationStep.reason,
    delivery_note: opts.scheduled ? "scheduled" : "manual",
  });

  await appendAuditEvent({
    event_type: "governance.staffing_digest_auto_chain_run",
    user_id: actorUserId,
    org_id: orgId,
    details: {
      period_key: periodKey,
      version: STAFFING_DIGEST_AUTO_CHAIN_VERSION,
      rollup_status: rollupStep.status,
      sla_status: slaStep.status,
      escalation_status: escalationStep.status,
      scheduled: Boolean(opts.scheduled),
      summary,
    },
  });

  return { ok: true, periodKey, steps, summary };
}
