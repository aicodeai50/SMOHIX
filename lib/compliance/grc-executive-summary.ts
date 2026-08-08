import type { SupabaseClient } from "@supabase/supabase-js";

import { escapeCsvField } from "@/lib/audit/csv-escape";
import {
  buildComplianceRiskHeatmap,
  type ComplianceRiskHeatmapPack,
  type RiskHeatLevel,
  type RiskHotspot,
} from "@/lib/compliance/compliance-risk-heatmap";
import {
  buildComplianceProgramDashboard,
  type ComplianceProgramDashboard,
  type ProgramGapRow,
} from "@/lib/compliance/program-dashboard";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const GRC_EXECUTIVE_SUMMARY_VERSION = "smohix-grc-executive-summary/1";

export type GrcFrameworkSnapshot = {
  label: string;
  readinessPercent: number;
  riskScore: number;
  level: RiskHeatLevel;
  exceptionCount: number;
};

export type GrcExecutiveSummaryPack = {
  version: typeof GRC_EXECUTIVE_SUMMARY_VERSION;
  generatedAt: string;
  periodDays: number;
  orgId: string | null;
  orgName: string | null;
  programReadinessPercent: number;
  overallRiskScore: number;
  overallRiskLevel: RiskHeatLevel;
  frameworks: GrcFrameworkSnapshot[];
  attestations: ComplianceProgramDashboard["attestations"];
  gapRemediations: ComplianceProgramDashboard["gapRemediations"];
  topGaps: ProgramGapRow[];
  overdueAttestations: ComplianceProgramDashboard["overdueAttestations"];
  hotspots: RiskHotspot[];
  vendorCount: number;
  criticalVendorCount: number;
  highTierVendorCount: number;
  evidenceBundleCount: number;
  leadershipActions: string[];
};

function deriveLeadershipActions(
  program: ComplianceProgramDashboard,
  heatmap: ComplianceRiskHeatmapPack,
): string[] {
  const actions: string[] = [];

  if (program.attestations.overdue > 0) {
    actions.push(
      `Assign owners and sign off ${program.attestations.overdue} overdue control attestation(s).`,
    );
  }
  if (program.gapRemediations.open + program.gapRemediations.inProgress > 0) {
    actions.push(
      `Advance ${program.gapRemediations.open + program.gapRemediations.inProgress} open gap remediation(s) via compliance runbooks.`,
    );
  }

  const worstFramework = [...heatmap.frameworkCells].sort(
    (a, b) => b.riskScore - a.riskScore,
  )[0];
  if (worstFramework && worstFramework.riskScore >= 50) {
    actions.push(
      `Prioritize ${worstFramework.label} (${worstFramework.readinessPercent}% readiness, risk ${worstFramework.riskScore}).`,
    );
  }

  if (heatmap.criticalVendorCount > 0) {
    actions.push(
      `Review ${heatmap.criticalVendorCount} critical-tier third-party vendor(s) and inherited control evidence.`,
    );
  }

  const vendorHotspot = heatmap.hotspots.find((h) => h.kind === "vendor" && h.riskScore >= 60);
  if (vendorHotspot) {
    actions.push(`Escalate vendor risk: ${vendorHotspot.label} (${vendorHotspot.detail}).`);
  }

  if (program.overallReadinessPercent < 60) {
    actions.push(
      `Raise program readiness above 60% (currently ${program.overallReadinessPercent}%) with targeted evidence collection.`,
    );
  }

  if (actions.length === 0) {
    actions.push("Maintain current control monitoring cadence; no elevated board actions this period.");
  }

  return actions.slice(0, 6);
}

export function buildGrcExecutiveSummaryFromInputs(input: {
  orgId: string | null;
  orgName: string | null;
  periodDays: number;
  program: ComplianceProgramDashboard;
  heatmap: ComplianceRiskHeatmapPack;
  vendorCount: number;
  generatedAt?: string;
}): GrcExecutiveSummaryPack {
  const { program, heatmap } = input;

  return {
    version: GRC_EXECUTIVE_SUMMARY_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    periodDays: input.periodDays,
    orgId: input.orgId,
    orgName: input.orgName,
    programReadinessPercent: program.overallReadinessPercent,
    overallRiskScore: heatmap.overallRiskScore,
    overallRiskLevel: heatmap.overallLevel,
    frameworks: heatmap.frameworkCells.map((c) => ({
      label: c.label,
      readinessPercent: c.readinessPercent,
      riskScore: c.riskScore,
      level: c.level,
      exceptionCount: c.exceptionCount,
    })),
    attestations: program.attestations,
    gapRemediations: program.gapRemediations,
    topGaps: program.topGaps.slice(0, 5),
    overdueAttestations: program.overdueAttestations.slice(0, 5),
    hotspots: heatmap.hotspots.slice(0, 6),
    vendorCount: input.vendorCount,
    criticalVendorCount: heatmap.criticalVendorCount,
    highTierVendorCount: heatmap.highTierVendorCount,
    evidenceBundleCount: program.evidenceBundleCount,
    leadershipActions: deriveLeadershipActions(program, heatmap),
  };
}

export async function buildGrcExecutiveSummary(
  userId: string,
  opts: {
    orgId: string | null;
    orgName?: string | null;
    periodDays?: number;
    auditorReadOnly?: boolean;
    supabase?: SupabaseClient;
  },
): Promise<GrcExecutiveSummaryPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const periodDays = opts.periodDays ?? 30;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const [program, heatmap] = await Promise.all([
    buildComplianceProgramDashboard(userId, { ...opts, periodDays, supabase }),
    buildComplianceRiskHeatmap(userId, { ...opts, periodDays, supabase }),
  ]);

  if (!program || !heatmap) return null;

  const vendorCount = heatmap.vendorTierRollup.reduce((s, t) => s + t.vendorCount, 0);

  return buildGrcExecutiveSummaryFromInputs({
    orgId: opts.orgId,
    orgName: opts.orgName ?? null,
    periodDays,
    program,
    heatmap,
    vendorCount,
  });
}

export function grcExecutiveSummaryToMarkdown(pack: GrcExecutiveSummaryPack): string {
  const lines: string[] = [
    `# GRC Executive Summary — ${SITE_BRAND_NAME}`,
    "",
    `**Organization:** ${pack.orgName ?? pack.orgId ?? "—"}`,
    `**Generated:** ${pack.generatedAt}`,
    `**Assessment window:** ${pack.periodDays} days`,
    "",
    "## Program posture",
    "",
    `- Weighted program readiness: **${pack.programReadinessPercent}%**`,
    `- Overall risk concentration: **${pack.overallRiskScore}** (${pack.overallRiskLevel})`,
    `- Evidence bundles on file: **${pack.evidenceBundleCount}**`,
    `- Third-party vendors: **${pack.vendorCount}** (${pack.criticalVendorCount} critical, ${pack.highTierVendorCount} high)`,
    "",
    "## Framework readiness",
    "",
    "| Framework | Readiness | Risk | Exceptions |",
    "| --- | ---: | ---: | ---: |",
  ];

  for (const f of pack.frameworks) {
    lines.push(
      `| ${f.label} | ${f.readinessPercent}% | ${f.riskScore} (${f.level}) | ${f.exceptionCount} |`,
    );
  }

  lines.push(
    "",
    "## Control attestations",
    "",
    `- Total: ${pack.attestations.total}`,
    `- Attested: ${pack.attestations.attested}`,
    `- Pending: ${pack.attestations.pending}`,
    `- Overdue: ${pack.attestations.overdue}`,
    "",
    "## Gap remediation",
    "",
    `- Open: ${pack.gapRemediations.open}`,
    `- In progress: ${pack.gapRemediations.inProgress}`,
    `- Resolved: ${pack.gapRemediations.resolved}`,
    "",
    "## Top assessment gaps",
    "",
  );

  if (pack.topGaps.length === 0) {
    lines.push("_No open gaps in the current monitoring window._");
  } else {
    for (const g of pack.topGaps) {
      lines.push(`- **${g.controlRef}** (${g.framework}): ${g.title} — ${g.reason}`);
    }
  }

  lines.push("", "## Risk hotspots", "");

  if (pack.hotspots.length === 0) {
    lines.push("_No elevated hotspots._");
  } else {
    for (const h of pack.hotspots) {
      lines.push(`- **${h.label}** (${h.kind}, risk ${h.riskScore}): ${h.detail}`);
    }
  }

  lines.push("", "## Board actions", "");
  for (const a of pack.leadershipActions) {
    lines.push(`1. ${a}`);
  }

  lines.push("", "---", `_Source: live ${SITE_BRAND_NAME} audit_log, policies, and vendor register._`, "");
  return lines.join("\n");
}

export function grcExecutiveSummaryToHtml(pack: GrcExecutiveSummaryPack): string {
  const frameworkRows = pack.frameworks
    .map(
      (f) =>
        `<tr><td>${escapeHtml(f.label)}</td><td>${f.readinessPercent}%</td><td>${f.riskScore} (${f.level})</td><td>${f.exceptionCount}</td></tr>`,
    )
    .join("");

  const gapList =
    pack.topGaps.length === 0
      ? "<p><em>No open gaps in window.</em></p>"
      : `<ul>${pack.topGaps.map((g) => `<li><strong>${escapeHtml(g.controlRef)}</strong> — ${escapeHtml(g.title)}</li>`).join("")}</ul>`;

  const hotspotList =
    pack.hotspots.length === 0
      ? "<p><em>No elevated hotspots.</em></p>"
      : `<ul>${pack.hotspots.map((h) => `<li><strong>${escapeHtml(h.label)}</strong> (${h.riskScore}) — ${escapeHtml(h.detail)}</li>`).join("")}</ul>`;

  const actions = pack.leadershipActions
    .map((a) => `<li>${escapeHtml(a)}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>GRC Executive Summary — ${escapeHtml(pack.orgName ?? "Organization")}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; color: #111; margin: 0; padding: 24px 32px; font-size: 13px; line-height: 1.45; }
    h1 { font-size: 20px; margin: 0 0 8px; }
    h2 { font-size: 14px; margin: 20px 0 8px; text-transform: uppercase; letter-spacing: 0.04em; color: #444; }
    .meta { color: #555; margin-bottom: 16px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
    .kpi { border: 1px solid #ccc; padding: 10px 12px; border-radius: 6px; }
    .kpi strong { display: block; font-size: 18px; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
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
  <h1>GRC Executive Summary</h1>
  <p class="meta">${escapeHtml(SITE_BRAND_NAME)} · ${escapeHtml(pack.orgName ?? "Organization")}<br />
  Generated ${escapeHtml(pack.generatedAt)} · ${pack.periodDays}-day window</p>
  <div class="kpis">
    <div class="kpi">Program readiness<strong>${pack.programReadinessPercent}%</strong></div>
    <div class="kpi">Risk concentration<strong>${pack.overallRiskScore}</strong> (${pack.overallRiskLevel})</div>
    <div class="kpi">Overdue attestations<strong>${pack.attestations.overdue}</strong></div>
    <div class="kpi">Open remediations<strong>${pack.gapRemediations.open + pack.gapRemediations.inProgress}</strong></div>
  </div>
  <h2>Framework readiness</h2>
  <table>
    <thead><tr><th>Framework</th><th>Readiness</th><th>Risk</th><th>Exceptions</th></tr></thead>
    <tbody>${frameworkRows}</tbody>
  </table>
  <h2>Attestations</h2>
  <p>${pack.attestations.attested} attested · ${pack.attestations.pending} pending · ${pack.attestations.overdue} overdue · ${pack.attestations.total} total</p>
  <h2>Top gaps</h2>
  ${gapList}
  <h2>Risk hotspots</h2>
  ${hotspotList}
  <h2>Recommended board actions</h2>
  <ol>${actions}</ol>
  <footer>Live data from org audit_log, accepted policies, and third-party vendor register. Not a contractual attestation.</footer>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function grcExecutiveSummaryToCsv(pack: GrcExecutiveSummaryPack): string {
  const lines = [
    "section,key,value,detail",
    `summary,program_readiness,${pack.programReadinessPercent},percent`,
    `summary,overall_risk,${pack.overallRiskScore},${pack.overallRiskLevel}`,
    `summary,attestations_overdue,${pack.attestations.overdue},count`,
    `summary,gap_remediations_open,${pack.gapRemediations.open + pack.gapRemediations.inProgress},count`,
  ];
  for (const f of pack.frameworks) {
    lines.push(
      `framework,${escapeCsvField(f.label)},${f.readinessPercent},risk=${f.riskScore};exceptions=${f.exceptionCount}`,
    );
  }
  for (const a of pack.leadershipActions) {
    lines.push(`action,,,${escapeCsvField(a)}`);
  }
  return `${lines.join("\n")}\n`;
}
