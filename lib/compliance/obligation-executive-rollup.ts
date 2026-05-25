import type { SupabaseClient } from "@supabase/supabase-js";

import { buildBoardObligationForecastPack } from "@/lib/compliance/board-obligation-forecast";
import type { BoardObligationForecastPack } from "@/lib/compliance/board-obligation-forecast";
import {
  buildEvidenceRequestSlaDashboardPack,
  type EvidenceRequestSlaDashboardPack,
} from "@/lib/compliance/evidence-request-sla-dashboard";
import { buildObligationConsolidationPlaybookPack } from "@/lib/compliance/obligation-consolidation-playbook";
import type { ObligationConsolidationPlaybookPack } from "@/lib/compliance/obligation-consolidation-playbook";
import { buildObligationCrossoverReportPack } from "@/lib/compliance/obligation-crossover-report";
import type { ObligationCrossoverReportPack } from "@/lib/compliance/obligation-crossover-report";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const OBLIGATION_EXECUTIVE_ROLLUP_VERSION = "zentro-obligation-executive-rollup/1";

export const OBLIGATION_ROLLUP_HORIZON_DAYS = 90;

export type ObligationExecutiveRollupPack = {
  version: typeof OBLIGATION_EXECUTIVE_ROLLUP_VERSION;
  generatedAt: string;
  orgId: string | null;
  orgName: string | null;
  horizonDays: number;
  forecast: BoardObligationForecastPack | null;
  crossover: ObligationCrossoverReportPack | null;
  consolidation: ObligationConsolidationPlaybookPack | null;
  sla: EvidenceRequestSlaDashboardPack | null;
  boardSummary: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildObligationExecutiveBoardSummary(input: {
  forecast: BoardObligationForecastPack | null;
  crossover: ObligationCrossoverReportPack | null;
  consolidation: ObligationConsolidationPlaybookPack | null;
  sla: EvidenceRequestSlaDashboardPack | null;
}): string {
  const parts: string[] = [];

  if (input.forecast) {
    parts.push(input.forecast.committeeSummary);
  }
  if (input.crossover && input.crossover.crossoverClusterCount > 0) {
    parts.push(
      `${input.crossover.crossoverClusterCount} multi-framework crossover cluster(s); ${input.crossover.multiFrameworkObligationCount} obligations share catalog control links.`,
    );
  }
  if (input.consolidation && input.consolidation.workflowCount > 0) {
    parts.push(
      `Consolidation plays: ${input.consolidation.stats.inProgress} in progress, ${input.consolidation.stats.collected} collected, ${input.consolidation.stats.verified} verified of ${input.consolidation.workflowCount} workflows.`,
    );
  }
  if (input.sla && (input.sla.overdueCount > 0 || input.sla.atRiskCount > 0)) {
    parts.push(
      `Evidence requests: ${input.sla.overdueCount} overdue, ${input.sla.atRiskCount} at risk; on-time fulfillment ${input.sla.onTimeFulfillmentPercent}%.`,
    );
  }

  if (parts.length === 0) {
    return "No elevated obligation concentration in the current horizon.";
  }
  return parts.join(" ");
}

export function buildObligationExecutiveRollupHtml(input: {
  orgName: string | null;
  horizonDays: number;
  generatedAt: string;
  forecast: BoardObligationForecastPack | null;
  crossover: ObligationCrossoverReportPack | null;
  consolidation: ObligationConsolidationPlaybookPack | null;
  sla: EvidenceRequestSlaDashboardPack | null;
  boardSummary: string;
}): string {
  const org = escapeHtml(input.orgName ?? "Organization");

  const forecastWeekRows =
    input.forecast?.buckets
      .filter((b) => b.totalCount > 0)
      .slice(0, 10)
      .map(
        (b) =>
          `<tr><td>${escapeHtml(b.weekKey)}</td><td>${b.totalCount}</td><td>${b.overdueCount}</td><td>${b.dueSoonCount}</td><td>${b.upcomingCount}</td></tr>`,
      )
      .join("") ?? "";

  const crossoverRows =
    input.crossover?.clusters
      .slice(0, 8)
      .map(
        (c) =>
          `<tr><td>${escapeHtml(c.frameworks.join(", "))}</td><td>${c.obligationCount}</td><td>${c.overdueCount}</td><td>${escapeHtml(c.controlRefs.slice(0, 3).join(", "))}</td></tr>`,
      )
      .join("") ?? "";

  const consolidationRows =
    input.consolidation?.workflows
      .slice(0, 8)
      .map((w) => {
        const status = w.play?.status ?? "planned";
        const done = w.steps.filter((s) => s.completed).length;
        return `<tr><td>${escapeHtml(w.frameworkLabels.join(" · "))}</td><td>${escapeHtml(status)}</td><td>${done}/${w.steps.length}</td><td>${w.obligationCount}</td></tr>`;
      })
      .join("") ?? "";

  const slaOverdue =
    input.sla?.overdueQueue
      .slice(0, 10)
      .map(
        (q) =>
          `<li><strong>${escapeHtml(q.controlRef)}</strong> — ${escapeHtml(q.title)} (${q.daysOverdue}d overdue)</li>`,
      )
      .join("") ?? "";

  const milestones =
    input.forecast?.milestones
      .slice(0, 8)
      .map(
        (m) =>
          `<li>${escapeHtml(m.dueAt.slice(0, 10))} · ${escapeHtml(m.title)} <em>(${escapeHtml(m.urgency)})</em></li>`,
      )
      .join("") ?? "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Obligation executive rollup — ${org}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; color: #111; margin: 0; padding: 24px 32px; font-size: 13px; line-height: 1.45; }
    h1 { font-size: 20px; margin: 0 0 8px; }
    h2 { font-size: 14px; margin: 20px 0 8px; text-transform: uppercase; letter-spacing: 0.04em; color: #444; }
    .meta { color: #555; margin-bottom: 16px; }
    .summary { background: #f8f8f8; border: 1px solid #ddd; padding: 12px 14px; border-radius: 6px; margin: 12px 0 20px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
    .kpi { border: 1px solid #ccc; padding: 10px 12px; border-radius: 6px; }
    .kpi strong { display: block; font-size: 18px; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; font-size: 12px; }
    th { background: #f4f4f4; font-size: 11px; text-transform: uppercase; }
    ul { margin: 6px 0; padding-left: 20px; }
    footer { margin-top: 24px; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 12px; }
    @media print {
      body { padding: 12px 16px; }
      @page { margin: 12mm; size: letter; }
    }
  </style>
</head>
<body>
  <h1>Obligation executive rollup</h1>
  <p class="meta">${escapeHtml(SITE_BRAND_NAME)} · ${org}<br />
  Generated ${escapeHtml(input.generatedAt)} · ${input.horizonDays}-day horizon</p>
  <div class="summary">${escapeHtml(input.boardSummary)}</div>
  <div class="kpis">
    <div class="kpi">Open obligations<strong>${input.forecast?.totalForecastObligations ?? 0}</strong></div>
    <div class="kpi">Peak week<strong>${input.forecast?.peakWeekCount ?? 0}</strong><span style="font-size:11px;display:block">${escapeHtml(input.forecast?.peakWeekKey ?? "—")}</span></div>
    <div class="kpi">Crossover clusters<strong>${input.crossover?.crossoverClusterCount ?? 0}</strong></div>
    <div class="kpi">SLA overdue<strong>${input.sla?.overdueCount ?? 0}</strong></div>
  </div>
  <h2>Forecast timeline (weekly density)</h2>
  ${
    forecastWeekRows
      ? `<table><thead><tr><th>Week</th><th>Total</th><th>Overdue</th><th>Due ≤7d</th><th>Upcoming</th></tr></thead><tbody>${forecastWeekRows}</tbody></table>`
      : "<p><em>No forecast buckets in horizon.</em></p>"
  }
  <h2>Upcoming milestones</h2>
  ${milestones ? `<ul>${milestones}</ul>` : "<p><em>None.</em></p>"}
  <h2>Multi-framework crossover</h2>
  ${
    crossoverRows
      ? `<table><thead><tr><th>Frameworks</th><th>Obligations</th><th>Overdue</th><th>Controls</th></tr></thead><tbody>${crossoverRows}</tbody></table>`
      : "<p><em>No crossover clusters.</em></p>"
  }
  <h2>Consolidation playbook status</h2>
  ${
    consolidationRows
      ? `<table><thead><tr><th>Cluster</th><th>Status</th><th>Steps</th><th>Obligations</th></tr></thead><tbody>${consolidationRows}</tbody></table>`
      : "<p><em>No consolidation workflows.</em></p>"
  }
  <h2>Evidence request SLA breaches</h2>
  <p>${input.sla?.openCount ?? 0} open · ${input.sla?.atRiskCount ?? 0} at risk · on-time ${input.sla?.onTimeFulfillmentPercent ?? 0}%</p>
  ${slaOverdue ? `<ul>${slaOverdue}</ul>` : "<p><em>No overdue evidence requests.</em></p>"}
  <footer>Live ${escapeHtml(SITE_BRAND_NAME)} data — forecast, crossover, consolidation, and SLA. Use your browser Print → Save as PDF for board distribution.</footer>
</body>
</html>`;
}

export function buildObligationExecutiveRollupFromParts(input: {
  orgId: string | null;
  orgName: string | null;
  horizonDays: number;
  forecast: BoardObligationForecastPack | null;
  crossover: ObligationCrossoverReportPack | null;
  consolidation: ObligationConsolidationPlaybookPack | null;
  sla: EvidenceRequestSlaDashboardPack | null;
  generatedAt?: string;
}): ObligationExecutiveRollupPack {
  const boardSummary = buildObligationExecutiveBoardSummary({
    forecast: input.forecast,
    crossover: input.crossover,
    consolidation: input.consolidation,
    sla: input.sla,
  });

  return {
    version: OBLIGATION_EXECUTIVE_ROLLUP_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    orgId: input.orgId,
    orgName: input.orgName,
    horizonDays: input.horizonDays,
    forecast: input.forecast,
    crossover: input.crossover,
    consolidation: input.consolidation,
    sla: input.sla,
    boardSummary,
  };
}

export async function buildObligationExecutiveRollupPack(
  userId: string,
  opts: {
    orgId: string | null;
    orgName?: string | null;
    horizonDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<ObligationExecutiveRollupPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const horizonDays = opts.horizonDays ?? OBLIGATION_ROLLUP_HORIZON_DAYS;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const [forecast, crossover, consolidation, sla] = await Promise.all([
    buildBoardObligationForecastPack(userId, { orgId: opts.orgId, horizonDays, supabase }),
    buildObligationCrossoverReportPack(userId, { orgId: opts.orgId, horizonDays, supabase }),
    buildObligationConsolidationPlaybookPack(userId, { orgId: opts.orgId, horizonDays, supabase }),
    buildEvidenceRequestSlaDashboardPack(userId, { orgId: opts.orgId, supabase }),
  ]);

  return buildObligationExecutiveRollupFromParts({
    orgId: opts.orgId,
    orgName: opts.orgName ?? null,
    horizonDays,
    forecast,
    crossover,
    consolidation,
    sla,
  });
}

export function obligationExecutiveRollupToCsv(pack: ObligationExecutiveRollupPack): string {
  const lines = [
    "section,metric,value",
    ["forecast", "total_obligations", pack.forecast?.totalForecastObligations ?? 0].join(","),
    ["forecast", "peak_week_count", pack.forecast?.peakWeekCount ?? 0].join(","),
    ["forecast", "current_overdue", pack.forecast?.currentOverdue ?? 0].join(","),
    ["crossover", "cluster_count", pack.crossover?.crossoverClusterCount ?? 0].join(","),
    ["consolidation", "in_progress", pack.consolidation?.stats.inProgress ?? 0].join(","),
    ["consolidation", "verified", pack.consolidation?.stats.verified ?? 0].join(","),
    ["sla", "overdue", pack.sla?.overdueCount ?? 0].join(","),
    ["sla", "at_risk", pack.sla?.atRiskCount ?? 0].join(","),
    ["sla", "on_time_percent", pack.sla?.onTimeFulfillmentPercent ?? 0].join(","),
  ];
  return `${lines.join("\n")}\n`;
}
