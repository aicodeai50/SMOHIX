import type { SupabaseClient } from "@supabase/supabase-js";

import { appendAuditEvent } from "@/lib/audit/append";
import type { AcceptedPolicyGuardrails } from "@/lib/approvals/policy-suggestions";
import { listAcceptedPolicyGuardrailsByPlaybook } from "@/lib/approvals/policy-suggestions";
import { listAutomationDryRuns } from "@/lib/automations/dry-runs-db";
import type { DryRunRecord } from "@/lib/automations/runs-dev";
import { getPlaybookById } from "@/lib/automations/playbooks";
import { getComplianceControl } from "@/lib/compliance/catalog";
import {
  buildControlTestingSchedulesPack,
  type ControlTestingSchedule,
} from "@/lib/compliance/control-testing-schedules";
import type { EvidenceBundleRow } from "@/lib/compliance/evidence-bundle";
import { listEvidenceBundlesForOrg } from "@/lib/compliance/evidence-bundle";
import { complianceControlsForAcceptedPolicy } from "@/lib/compliance/map-policy";
import type { ComplianceFramework } from "@/lib/compliance/types";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const CONTROL_TESTING_EVIDENCE_LINKER_VERSION =
  "zentro-control-testing-evidence-linker/1";

/** Fallback control mapping when no accepted policy exists for a playbook. */
export const PLAYBOOK_CONTROL_FALLBACK: Record<string, string[]> = {
  "pb-restart-workers": ["soc2:CC7.3", "soc2:CC7.2", "iso:A.8.16"],
  "pb-scale-api": ["soc2:CC7.2", "soc2:CC8.1", "pcidss:10.2.1"],
  "pb-cache-flush": ["soc2:CC8.1", "iso:A.8.9", "pcidss:12.3.1"],
};

export type TestRunLinkStatus = "linked" | "run_only" | "unlinked";

export type ControlTestRunLink = {
  linkId: string;
  dryRunId: string;
  playbookId: string;
  playbookName: string;
  ok: boolean;
  detail: string;
  runAt: string;
  controlId: string;
  controlRef: string;
  controlTitle: string;
  framework: ComplianceFramework;
  frameworkLabel: string;
  bundleId: string | null;
  bundleWindowLabel: string | null;
  bundleCreatedAt: string | null;
  scheduleId: string | null;
  scheduleKind: ControlTestingSchedule["kind"] | null;
  linkStatus: TestRunLinkStatus;
};

export type ScheduleCoverageRow = {
  scheduleId: string;
  scheduleKind: ControlTestingSchedule["kind"];
  title: string;
  status: ControlTestingSchedule["status"];
  controlCount: number;
  linkedControlCount: number;
  coveragePercent: number;
  href: string;
};

export type ControlTestingEvidenceLinkerPack = {
  version: typeof CONTROL_TESTING_EVIDENCE_LINKER_VERSION;
  generatedAt: string;
  periodDays: number;
  orgId: string | null;
  dryRunCount: number;
  linkCount: number;
  linkedToBundleCount: number;
  scheduleCoveragePercent: number;
  unlinkedRunCount: number;
  links: ControlTestRunLink[];
  scheduleCoverage: ScheduleCoverageRow[];
  bundlesUsed: { bundleId: string; windowLabel: string; createdAt: string }[];
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

export function controlIdsForPlaybook(
  playbookId: string,
  acceptedByPlaybook: Record<string, AcceptedPolicyGuardrails>,
): string[] {
  const guardrails = acceptedByPlaybook[playbookId];
  if (guardrails) {
    return complianceControlsForAcceptedPolicy(guardrails).map((c) => c.id);
  }
  return PLAYBOOK_CONTROL_FALLBACK[playbookId] ?? ["soc2:CC8.1"];
}

export function findBundleCoveringRun(
  runAtIso: string,
  bundles: EvidenceBundleRow[],
): EvidenceBundleRow | null {
  const t = new Date(runAtIso).getTime();
  for (const bundle of bundles) {
    const start = bundle.sinceIso ? new Date(bundle.sinceIso).getTime() : 0;
    const end = new Date(bundle.createdAt).getTime();
    if (t >= start && t <= end) return bundle;
  }
  return bundles[0] ?? null;
}

export function findScheduleForControl(
  controlId: string,
  schedules: ControlTestingSchedule[],
): ControlTestingSchedule | null {
  for (const s of schedules) {
    if (s.controlIds.includes(controlId)) return s;
    if (s.kind === "framework_checkpoint" && s.framework) {
      const control = getComplianceControl(controlId);
      if (control?.framework === s.framework) return s;
    }
  }
  return null;
}

export function buildControlTestRunLinks(input: {
  runs: DryRunRecord[];
  acceptedByPlaybook: Record<string, AcceptedPolicyGuardrails>;
  bundles: EvidenceBundleRow[];
  schedules: ControlTestingSchedule[];
}): ControlTestRunLink[] {
  const links: ControlTestRunLink[] = [];

  for (const run of input.runs) {
    const controlIds = controlIdsForPlaybook(run.playbookId, input.acceptedByPlaybook);
    const bundle = findBundleCoveringRun(run.at, input.bundles);
    const playbook = getPlaybookById(run.playbookId);

    for (const controlId of controlIds) {
      const control = getComplianceControl(controlId);
      if (!control) continue;

      const schedule = findScheduleForControl(controlId, input.schedules);
      const linkStatus: TestRunLinkStatus = bundle ? "linked" : "run_only";

      links.push({
        linkId: `${run.id}::${controlId}`,
        dryRunId: run.id,
        playbookId: run.playbookId,
        playbookName: playbook?.name ?? run.playbookId,
        ok: run.ok,
        detail: run.detail,
        runAt: run.at,
        controlId,
        controlRef: control.ref,
        controlTitle: control.title,
        framework: control.framework,
        frameworkLabel: FRAMEWORK_LABELS[control.framework],
        bundleId: bundle?.id ?? null,
        bundleWindowLabel: bundle?.windowLabel ?? null,
        bundleCreatedAt: bundle?.createdAt ?? null,
        scheduleId: schedule?.id ?? null,
        scheduleKind: schedule?.kind ?? null,
        linkStatus,
      });
    }
  }

  return links.sort(
    (a, b) =>
      (a.linkStatus === "linked" ? 0 : 1) - (b.linkStatus === "linked" ? 0 : 1) ||
      new Date(b.runAt).getTime() - new Date(a.runAt).getTime() ||
      a.controlRef.localeCompare(b.controlRef),
  );
}

export function buildScheduleCoverageRows(
  schedules: ControlTestingSchedule[],
  links: ControlTestRunLink[],
): ScheduleCoverageRow[] {
  const linkedControls = new Set(links.map((l) => l.controlId));

  return schedules
    .filter((s) => s.controlCount > 0 || s.kind === "freshness_retest")
    .map((s) => {
      const ids =
        s.controlIds.length > 0
          ? s.controlIds
          : links
              .filter((l) => l.scheduleId === s.id)
              .map((l) => l.controlId);
      const unique = [...new Set(ids)];
      const linked = unique.filter((id) => linkedControls.has(id)).length;
      const controlCount = unique.length || s.controlCount;
      const coveragePercent =
        controlCount > 0 ? Math.round((linked / controlCount) * 1000) / 10 : 0;

      return {
        scheduleId: s.id,
        scheduleKind: s.kind,
        title: s.title,
        status: s.status,
        controlCount,
        linkedControlCount: linked,
        coveragePercent,
        href: s.href,
      };
    })
    .sort((a, b) => a.coveragePercent - b.coveragePercent);
}

export function buildControlTestingEvidenceLinkerFromParts(input: {
  orgId: string | null;
  periodDays: number;
  runs: DryRunRecord[];
  acceptedByPlaybook: Record<string, AcceptedPolicyGuardrails>;
  bundles: EvidenceBundleRow[];
  schedules: ControlTestingSchedule[];
  generatedAt?: string;
}): ControlTestingEvidenceLinkerPack {
  const links = buildControlTestRunLinks({
    runs: input.runs,
    acceptedByPlaybook: input.acceptedByPlaybook,
    bundles: input.bundles,
    schedules: input.schedules,
  });

  const scheduleCoverage = buildScheduleCoverageRows(input.schedules, links);
  const bundlesUsed = [
    ...new Map(
      links
        .filter((l) => l.bundleId)
        .map((l) => [
          l.bundleId!,
          {
            bundleId: l.bundleId!,
            windowLabel: l.bundleWindowLabel ?? "",
            createdAt: l.bundleCreatedAt ?? "",
          },
        ]),
    ).values(),
  ];

  const avgScheduleCoverage =
    scheduleCoverage.length > 0
      ? scheduleCoverage.reduce((s, r) => s + r.coveragePercent, 0) / scheduleCoverage.length
      : 100;

  return {
    version: CONTROL_TESTING_EVIDENCE_LINKER_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    periodDays: input.periodDays,
    orgId: input.orgId,
    dryRunCount: input.runs.length,
    linkCount: links.length,
    linkedToBundleCount: links.filter((l) => l.linkStatus === "linked").length,
    scheduleCoveragePercent: Math.round(avgScheduleCoverage * 10) / 10,
    unlinkedRunCount: new Set(
      links.filter((l) => l.linkStatus === "run_only").map((l) => l.dryRunId),
    ).size,
    links,
    scheduleCoverage,
    bundlesUsed,
  };
}

export async function buildControlTestingEvidenceLinkerPack(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<ControlTestingEvidenceLinkerPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const periodDays = opts.periodDays ?? 30;
  const sinceMs = Date.now() - periodDays * 86_400_000;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const [dryRunResult, accepted, bundles, schedulesPack] = await Promise.all([
    listAutomationDryRuns(supabase, { userId, orgId: opts.orgId }),
    listAcceptedPolicyGuardrailsByPlaybook(supabase, userId),
    listEvidenceBundlesForOrg(opts.orgId, { limit: 24, supabase }),
    buildControlTestingSchedulesPack(userId, {
      orgId: opts.orgId,
      horizonDays: periodDays,
      supabase,
    }),
  ]);

  const runs = dryRunResult.runs.filter((r) => new Date(r.at).getTime() >= sinceMs);

  return buildControlTestingEvidenceLinkerFromParts({
    orgId: opts.orgId,
    periodDays,
    runs,
    acceptedByPlaybook: accepted,
    bundles,
    schedules: schedulesPack?.schedules ?? [],
  });
}

export function controlTestingEvidenceLinkerToCsv(
  pack: ControlTestingEvidenceLinkerPack,
): string {
  const header =
    "dry_run_id,playbook,ok,run_at,control_ref,framework,link_status,bundle_id,bundle_window,schedule_id";
  const lines = pack.links.map((l) =>
    [
      l.dryRunId,
      l.playbookId,
      l.ok ? "pass" : "fail",
      l.runAt,
      l.controlRef,
      l.framework,
      l.linkStatus,
      l.bundleId ?? "",
      l.bundleWindowLabel ?? "",
      l.scheduleId ?? "",
    ].join(","),
  );
  return `${header}\n${lines.join("\n")}\n`;
}

export async function materializeTestingEvidenceLinksForExport(
  actorUserId: string,
  orgId: string,
  pack: ControlTestingEvidenceLinkerPack,
): Promise<void> {
  await appendAuditEvent({
    event_type: "governance.control_testing_evidence_linked",
    user_id: actorUserId,
    org_id: orgId,
    details: {
      period_days: pack.periodDays,
      link_count: pack.linkCount,
      linked_to_bundle_count: pack.linkedToBundleCount,
      dry_run_count: pack.dryRunCount,
      bundle_ids: pack.bundlesUsed.map((b) => b.bundleId).slice(0, 12),
      sample_links: pack.links.slice(0, 20).map((l) => ({
        dry_run_id: l.dryRunId,
        control_id: l.controlId,
        bundle_id: l.bundleId,
        link_status: l.linkStatus,
      })),
    },
  });
}
