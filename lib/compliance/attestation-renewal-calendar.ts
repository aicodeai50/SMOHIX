import type { SupabaseClient } from "@supabase/supabase-js";

import { listControlAttestationBoard } from "@/lib/compliance/attestation/data";
import type { ControlAttestationRow } from "@/lib/compliance/attestation/types";
import { currentSlaReminderPeriodId } from "@/lib/compliance/compliance-sla-reminders";
import type { ComplianceFramework } from "@/lib/compliance/types";
import {
  isTransactionalEmailConfigured,
  sendTransactionalEmailWithAudit,
} from "@/lib/notifications/email";
import { listOrgMembers } from "@/lib/org/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const ATTESTATION_RENEWAL_CALENDAR_VERSION = "zentro-attestation-renewal-calendar/1";

export const RENEWAL_WAVE_LEAD_DAYS = 14;

export type AttestationRenewalKind = "initial" | "recertify" | "overdue";

export type AttestationRenewalItem = {
  attestationId: string;
  controlId: string;
  controlRef: string;
  title: string;
  framework: ComplianceFramework;
  frameworkLabel: string;
  renewalKind: AttestationRenewalKind;
  dueAt: string;
  daysUntilDue: number;
  ownerUserId: string | null;
  ownerLabel: string | null;
  status: ControlAttestationRow["status"];
  href: string;
};

export type AttestationRenewalWave = {
  waveId: string;
  waveLabel: string;
  windowStart: string;
  windowEnd: string;
  status: "overdue" | "due" | "upcoming";
  controlCount: number;
  overdueCount: number;
  unassignedCount: number;
  items: AttestationRenewalItem[];
};

export type FrameworkRenewalSummary = {
  framework: ComplianceFramework;
  label: string;
  renewalCount: number;
  overdueCount: number;
  href: string;
};

export type OwnerRenewalNudgeTarget = {
  ownerUserId: string;
  ownerLabel: string;
  ownerEmail: string | null;
  waveIds: string[];
  controlCount: number;
  overdueCount: number;
};

export type AttestationRenewalCalendarPack = {
  version: typeof ATTESTATION_RENEWAL_CALENDAR_VERSION;
  generatedAt: string;
  orgId: string | null;
  horizonDays: number;
  renewalLeadDays: number;
  totalRenewals: number;
  overdueCount: number;
  waveCount: number;
  unassignedCount: number;
  waves: AttestationRenewalWave[];
  frameworkSummaries: FrameworkRenewalSummary[];
  ownerNudgeTargets: OwnerRenewalNudgeTarget[];
};

export type AttestationRenewalOrgSettings = {
  nudgesEnabled: boolean;
  horizonDays: number;
};

const FRAMEWORK_LABELS: Record<ComplianceFramework, string> = {
  soc2: "SOC 2 Type II",
  iso27001: "ISO 27001",
  pcidss: "PCI DSS",
  hipaa: "HIPAA",
  nist_csf: "NIST CSF 2.0",
  cis_v8: "CIS Controls v8",
  cmmc_l2: "CMMC Level 2",
  gdpr_art32: "GDPR Art. 32",
};

const FRAMEWORK_PATHS: Record<ComplianceFramework, string> = {
  soc2: "/governance/compliance/type-ii",
  iso27001: "/governance/compliance/iso-assessment",
  pcidss: "/governance/compliance/pci-dss",
  hipaa: "/governance/compliance/hipaa",
  nist_csf: "/governance/compliance/nist-csf",
  cis_v8: "/governance/compliance/cis-v8",
  cmmc_l2: "/governance/compliance/cmmc-l2",
  gdpr_art32: "/governance/compliance/gdpr-art32",
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function daysUntil(iso: string, now = new Date()): number {
  return Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000);
}

function waveIdFromDueAt(dueAtIso: string): string {
  const due = new Date(dueAtIso);
  const windowStart = addDays(due, -RENEWAL_WAVE_LEAD_DAYS);
  return windowStart.toISOString().slice(0, 10);
}

function waveLabelFromId(waveId: string): string {
  return `Renewal wave starting ${waveId}`;
}

export function classifyRenewalItem(
  row: ControlAttestationRow,
  horizonDays: number,
  now = new Date(),
): AttestationRenewalItem | null {
  const days = daysUntil(row.dueAt, now);
  if (days > horizonDays) return null;

  let renewalKind: AttestationRenewalKind;
  if (row.status === "overdue") {
    renewalKind = "overdue";
  } else if (row.status === "attested") {
    renewalKind = "recertify";
  } else {
    renewalKind = "initial";
  }

  const framework = row.control.framework;
  return {
    attestationId: row.id,
    controlId: row.controlId,
    controlRef: row.control.ref,
    title: row.control.title,
    framework,
    frameworkLabel: FRAMEWORK_LABELS[framework],
    renewalKind,
    dueAt: row.dueAt,
    daysUntilDue: days,
    ownerUserId: row.ownerUserId,
    ownerLabel: row.ownerLabel,
    status: row.status,
    href: "/governance/compliance/attestations",
  };
}

export function buildAttestationRenewalWaves(
  items: AttestationRenewalItem[],
  now = new Date(),
): AttestationRenewalWave[] {
  const byWave = new Map<string, AttestationRenewalItem[]>();

  for (const item of items) {
    const waveId = waveIdFromDueAt(item.dueAt);
    const list = byWave.get(waveId) ?? [];
    list.push(item);
    byWave.set(waveId, list);
  }

  const waves: AttestationRenewalWave[] = [];

  for (const [waveId, waveItems] of byWave) {
    const sorted = [...waveItems].sort(
      (a, b) =>
        a.daysUntilDue - b.daysUntilDue ||
        a.framework.localeCompare(b.framework) ||
        a.controlRef.localeCompare(b.controlRef),
    );
    const earliestDue = sorted.reduce(
      (min, r) => (new Date(r.dueAt) < new Date(min) ? r.dueAt : min),
      sorted[0].dueAt,
    );
    const windowStart = addDays(new Date(earliestDue), -RENEWAL_WAVE_LEAD_DAYS);
    const windowEnd = earliestDue;
    const overdueCount = sorted.filter((r) => r.renewalKind === "overdue").length;
    const unassignedCount = sorted.filter((r) => !r.ownerUserId).length;

    let status: AttestationRenewalWave["status"] = "upcoming";
    if (overdueCount > 0) status = "overdue";
    else if (windowStart.getTime() <= now.getTime()) status = "due";

    waves.push({
      waveId,
      waveLabel: waveLabelFromId(waveId),
      windowStart: windowStart.toISOString(),
      windowEnd,
      status,
      controlCount: sorted.length,
      overdueCount,
      unassignedCount,
      items: sorted,
    });
  }

  return waves.sort((a, b) => a.waveId.localeCompare(b.waveId));
}

export function summarizeFrameworkRenewals(items: AttestationRenewalItem[]): FrameworkRenewalSummary[] {
  const map = new Map<ComplianceFramework, FrameworkRenewalSummary>();

  for (const item of items) {
    const existing = map.get(item.framework) ?? {
      framework: item.framework,
      label: item.frameworkLabel,
      renewalCount: 0,
      overdueCount: 0,
      href: FRAMEWORK_PATHS[item.framework],
    };
    existing.renewalCount += 1;
    if (item.renewalKind === "overdue") existing.overdueCount += 1;
    map.set(item.framework, existing);
  }

  return [...map.values()].sort((a, b) => b.renewalCount - a.renewalCount);
}

export function buildOwnerRenewalNudgeTargets(
  items: AttestationRenewalItem[],
  members: Awaited<ReturnType<typeof listOrgMembers>>,
): OwnerRenewalNudgeTarget[] {
  const byOwner = new Map<string, AttestationRenewalItem[]>();

  for (const item of items) {
    if (!item.ownerUserId) continue;
    const list = byOwner.get(item.ownerUserId) ?? [];
    list.push(item);
    byOwner.set(item.ownerUserId, list);
  }

  const targets: OwnerRenewalNudgeTarget[] = [];

  for (const [ownerUserId, ownerItems] of byOwner) {
    const member = members.find((m) => m.userId === ownerUserId);
    const waveIds = [...new Set(ownerItems.map((i) => waveIdFromDueAt(i.dueAt)))].sort();
    targets.push({
      ownerUserId,
      ownerLabel: ownerItems[0].ownerLabel ?? member?.displayName ?? "Owner",
      ownerEmail: member?.email ?? null,
      waveIds,
      controlCount: ownerItems.length,
      overdueCount: ownerItems.filter((i) => i.renewalKind === "overdue").length,
    });
  }

  return targets.sort((a, b) => b.overdueCount - a.overdueCount || b.controlCount - a.controlCount);
}

export function buildAttestationRenewalCalendarFromRows(input: {
  orgId: string | null;
  horizonDays: number;
  rows: ControlAttestationRow[];
  generatedAt?: string;
}): AttestationRenewalCalendarPack {
  const now = new Date();
  const renewalItems = input.rows
    .map((r) => classifyRenewalItem(r, input.horizonDays, now))
    .filter((r): r is AttestationRenewalItem => r != null);

  const waves = buildAttestationRenewalWaves(renewalItems, now);
  const unassignedCount = renewalItems.filter((r) => !r.ownerUserId).length;

  return {
    version: ATTESTATION_RENEWAL_CALENDAR_VERSION,
    generatedAt: input.generatedAt ?? now.toISOString(),
    orgId: input.orgId,
    horizonDays: input.horizonDays,
    renewalLeadDays: RENEWAL_WAVE_LEAD_DAYS,
    totalRenewals: renewalItems.length,
    overdueCount: renewalItems.filter((r) => r.renewalKind === "overdue").length,
    waveCount: waves.length,
    unassignedCount,
    waves,
    frameworkSummaries: summarizeFrameworkRenewals(renewalItems),
    ownerNudgeTargets: [],
  };
}

export async function buildAttestationRenewalCalendarPack(
  userId: string,
  opts: {
    orgId: string | null;
    horizonDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<AttestationRenewalCalendarPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const settings = await getAttestationRenewalOrgSettings(opts.orgId, opts.supabase);
  const horizonDays = opts.horizonDays ?? settings.horizonDays;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const [rows, members] = await Promise.all([
    listControlAttestationBoard(userId, opts.orgId, supabase),
    listOrgMembers(opts.orgId, { supabase }),
  ]);

  const pack = buildAttestationRenewalCalendarFromRows({
    orgId: opts.orgId,
    horizonDays,
    rows,
  });

  pack.ownerNudgeTargets = buildOwnerRenewalNudgeTargets(
    pack.waves.flatMap((w) => w.items),
    members,
  );

  return pack;
}

export function attestationRenewalCalendarToCsv(pack: AttestationRenewalCalendarPack): string {
  const header =
    "wave_id,wave_status,framework,control_ref,title,renewal_kind,due_at,days_until_due,owner,status";
  const lines = pack.waves.flatMap((w) =>
    w.items.map((i) =>
      [
        w.waveId,
        w.status,
        i.framework,
        i.controlRef,
        JSON.stringify(i.title),
        i.renewalKind,
        i.dueAt.slice(0, 10),
        i.daysUntilDue,
        JSON.stringify(i.ownerLabel ?? ""),
        i.status,
      ].join(","),
    ),
  );
  return `${header}\n${lines.join("\n")}\n`;
}

export async function getAttestationRenewalOrgSettings(
  orgId: string,
  supabase?: SupabaseClient,
): Promise<AttestationRenewalOrgSettings> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data } = await client
    .from("organizations")
    .select(
      "compliance_attestation_renewal_nudges_enabled, compliance_attestation_renewal_horizon_days",
    )
    .eq("id", orgId)
    .maybeSingle();

  return {
    nudgesEnabled: data?.compliance_attestation_renewal_nudges_enabled !== false,
    horizonDays: Number(data?.compliance_attestation_renewal_horizon_days ?? 90) || 90,
  };
}

function nudgeKey(periodId: string, ownerUserId: string, waveId: string): string {
  return `${periodId}:renewal:${waveId}:${ownerUserId}`;
}

async function wasNudgeSent(
  orgId: string,
  key: string,
  supabase: SupabaseClient,
): Promise<boolean> {
  const { data } = await supabase
    .from("compliance_attestation_renewal_nudge_log")
    .select("id")
    .eq("org_id", orgId)
    .eq("nudge_key", key)
    .eq("channel", "email")
    .maybeSingle();
  return Boolean(data?.id);
}

async function logNudgeSent(
  orgId: string,
  input: { nudgeKey: string; nudgeType: "owner_wave" | "owner_bulk"; recipient: string },
  supabase: SupabaseClient,
): Promise<void> {
  await supabase.from("compliance_attestation_renewal_nudge_log").insert({
    org_id: orgId,
    nudge_key: input.nudgeKey,
    nudge_type: input.nudgeType,
    channel: "email",
    recipient: input.recipient,
  });
}

function buildOwnerRenewalEmail(input: {
  orgName: string;
  recipientName: string;
  items: AttestationRenewalItem[];
  siteOrigin: string;
}): { subject: string; text: string } {
  const lines = [
    `Hi ${input.recipientName},`,
    "",
    `Attestation renewals assigned to you for ${input.orgName}:`,
    "",
  ];
  for (const item of input.items.slice(0, 20)) {
    lines.push(
      `- ${item.frameworkLabel} ${item.controlRef} — ${item.title} (${item.renewalKind}, due ${item.dueAt.slice(0, 10)})`,
    );
  }
  if (input.items.length > 20) {
    lines.push(`… and ${input.items.length - 20} more control(s).`);
  }
  lines.push(
    "",
    `Open attestation board: ${input.siteOrigin.replace(/\/$/, "")}/governance/compliance/attestations`,
    `Renewal calendar: ${input.siteOrigin.replace(/\/$/, "")}/governance/compliance/attestation-renewal`,
  );
  return {
    subject: `[Zentro] Attestation renewal wave — ${input.orgName}`,
    text: lines.join("\n"),
  };
}

export type RunAttestationRenewalNudgesResult =
  | {
      ok: true;
      emailsSent: number;
      emailsSkipped: number;
      ownersConsidered: number;
      controlsNotified: number;
    }
  | { ok: false; reason: string };

export async function runAttestationRenewalNudgesForOrg(
  actorUserId: string,
  orgId: string,
  opts: {
    siteOrigin: string;
    orgName?: string;
    horizonDays?: number;
    supabase?: SupabaseClient;
    scheduled?: boolean;
  },
): Promise<RunAttestationRenewalNudgesResult> {
  if (!hasSupabaseAuth() || !actorUserId || !orgId) {
    return { ok: false, reason: "Not configured." };
  }

  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const settings = await getAttestationRenewalOrgSettings(orgId, supabase);
  if (!settings.nudgesEnabled) {
    return { ok: false, reason: "Attestation renewal nudges disabled for organization." };
  }

  if (!isTransactionalEmailConfigured()) {
    return { ok: false, reason: "Transactional email not configured." };
  }

  const pack = await buildAttestationRenewalCalendarPack(actorUserId, {
    orgId,
    horizonDays: opts.horizonDays ?? settings.horizonDays,
    supabase,
  });

  if (!pack) return { ok: false, reason: "Could not build renewal calendar." };

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle();
  const orgName = opts.orgName ?? String(orgRow?.name ?? "Organization");

  const periodId = currentSlaReminderPeriodId();
  const members = await listOrgMembers(orgId, { supabase });
  const itemsByOwner = new Map<string, AttestationRenewalItem[]>();

  for (const wave of pack.waves) {
    for (const item of wave.items) {
      if (!item.ownerUserId) continue;
      if (item.renewalKind === "recertify" && item.daysUntilDue > RENEWAL_WAVE_LEAD_DAYS) {
        continue;
      }
      const list = itemsByOwner.get(item.ownerUserId) ?? [];
      list.push(item);
      itemsByOwner.set(item.ownerUserId, list);
    }
  }

  let emailsSent = 0;
  let emailsSkipped = 0;
  let controlsNotified = 0;

  for (const [ownerUserId, items] of itemsByOwner) {
    const member = members.find((m) => m.userId === ownerUserId);
    const email = member?.email?.trim();
    if (!email) {
      emailsSkipped += 1;
      continue;
    }

    const primaryWaveId = waveIdFromDueAt(items[0].dueAt);
    const key = nudgeKey(periodId, ownerUserId, primaryWaveId);
    if (await wasNudgeSent(orgId, key, supabase)) {
      emailsSkipped += 1;
      continue;
    }

    const body = buildOwnerRenewalEmail({
      orgName,
      recipientName: items[0].ownerLabel ?? member?.displayName ?? "there",
      items,
      siteOrigin: opts.siteOrigin,
    });

    const sent = await sendTransactionalEmailWithAudit({
      to: email,
      subject: body.subject,
      text: body.text,
      userId: actorUserId,
      orgId,
      auditDetails: {
        renewal_nudge: true,
        owner_user_id: ownerUserId,
        wave_id: primaryWaveId,
        control_count: items.length,
        scheduled: opts.scheduled ?? false,
      },
    });

    if (!sent.ok) {
      emailsSkipped += 1;
      continue;
    }

    await logNudgeSent(orgId, { nudgeKey: key, nudgeType: "owner_wave", recipient: email }, supabase);
    emailsSent += 1;
    controlsNotified += items.length;
  }

  return {
    ok: true,
    emailsSent,
    emailsSkipped,
    ownersConsidered: itemsByOwner.size,
    controlsNotified,
  };
}
