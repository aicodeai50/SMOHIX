import { createHash } from "node:crypto";

import JSZip from "jszip";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildComplianceControlHealthScorecardPack,
  complianceControlHealthScorecardToCsv,
  type ComplianceControlHealthScorecardPack,
} from "@/lib/compliance/compliance-control-health-scorecard";
import {
  buildComplianceExceptionRegisterPack,
  complianceExceptionRegisterToCsv,
  type ComplianceExceptionRegisterPack,
} from "@/lib/compliance/compliance-exception-register";
import {
  buildCompliancePostureScorePack,
  compliancePostureScoreToCsv,
  type CompliancePostureScorePack,
} from "@/lib/compliance/compliance-posture-score";
import {
  listComplianceGapRemediations,
  type ComplianceGapRemediationRow,
  type ComplianceGapRemediationStats,
} from "@/lib/compliance/gap-remediation";
import {
  buildComplianceProgramDashboard,
  type ComplianceProgramDashboard,
  type ProgramGapRow,
} from "@/lib/compliance/program-dashboard";
import {
  canonicalJsonStringify,
  sha256Canonical,
  type EvidenceBundleFileEntry,
} from "@/lib/compliance/manifest";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const COMPLIANCE_COMMITTEE_MEETING_PACK_VERSION =
  "zentro-compliance-committee-meeting-pack/1";

export type CommitteeMeetingPackFile = {
  path: string;
  mediaType: string;
  content: string;
};

export type CommitteeMeetingPackManifest = {
  version: typeof COMPLIANCE_COMMITTEE_MEETING_PACK_VERSION;
  generatedAt: string;
  periodDays: number;
  orgId: string | null;
  orgName: string | null;
  fileCount: number;
  files: EvidenceBundleFileEntry[];
  manifestSha256: string;
};

export type CommitteeMeetingOpenGapsPack = {
  topAssessmentGaps: ProgramGapRow[];
  gapRemediations: ComplianceGapRemediationStats;
  openRemediationRows: ComplianceGapRemediationRow[];
};

function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildCommitteeMeetingOpenGapsPack(input: {
  program: ComplianceProgramDashboard;
  remediationRows: ComplianceGapRemediationRow[];
}): CommitteeMeetingOpenGapsPack {
  const openRemediationRows = input.remediationRows.filter(
    (r) => r.status === "open" || r.status === "in_progress",
  );
  return {
    topAssessmentGaps: input.program.topGaps,
    gapRemediations: input.program.gapRemediations,
    openRemediationRows,
  };
}

export function committeeMeetingOpenGapsToCsv(pack: CommitteeMeetingOpenGapsPack): string {
  const lines = [
    "section,framework,control_ref,title,status,detail",
    ...pack.topAssessmentGaps.map((g) =>
      [
        "assessment_gap",
        g.framework,
        g.controlRef,
        JSON.stringify(g.title),
        "open",
        JSON.stringify(g.reason),
      ].join(","),
    ),
    ...pack.openRemediationRows.map((r) =>
      [
        "remediation",
        r.framework,
        r.controlRef,
        JSON.stringify(r.title),
        r.status,
        JSON.stringify(r.reason),
      ].join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}

export function buildCommitteeMeetingPackSummaryText(input: {
  orgName: string | null;
  periodDays: number;
  generatedAt: string;
  scorecard: ComplianceControlHealthScorecardPack;
  posture: CompliancePostureScorePack;
  exceptions: ComplianceExceptionRegisterPack;
  openGaps: CommitteeMeetingOpenGapsPack;
}): string {
  const lines = [
    `${SITE_BRAND_NAME} — Compliance committee meeting pack`,
    `Organization: ${input.orgName ?? input.scorecard.orgId ?? "—"}`,
    `Generated: ${input.generatedAt}`,
    `Period: ${input.periodDays} days`,
    "",
    "=== Control health ===",
    `Health score: ${input.scorecard.healthScore}/100 (grade ${input.scorecard.grade})`,
    input.scorecard.leadershipSummary,
    "",
    "=== Unified posture ===",
    `Posture score: ${input.posture.postureScore}/100 (grade ${input.posture.grade})`,
    `Program readiness: ${input.posture.programReadinessPercent}%`,
    `Gap closure: ${input.posture.gapClosurePercent}%`,
    `Vendor readiness: ${input.posture.vendorReadinessPercent}%`,
    "",
    "=== Exceptions ===",
    `Total: ${input.exceptions.totalCount} · Open: ${input.exceptions.openCount} · Approved: ${input.exceptions.approvedCount}`,
    "",
    "=== Open gaps ===",
    `Assessment gaps (top): ${input.openGaps.topAssessmentGaps.length}`,
    `Remediation queue: ${input.openGaps.openRemediationRows.length} open/in-progress`,
    "",
    "Leadership actions (scorecard):",
    ...input.scorecard.leadershipActions.map((a, i) => `${i + 1}. ${a}`),
    "",
    "Open assessment gaps:",
  ];

  if (input.openGaps.topAssessmentGaps.length === 0) {
    lines.push("  (none in monitoring window)");
  } else {
    for (const g of input.openGaps.topAssessmentGaps) {
      lines.push(`  - ${g.controlRef} (${g.framework}): ${g.title}`);
    }
  }

  lines.push("", "Print committee-pack-summary.html from the ZIP for board-ready PDF.");
  return lines.join("\n");
}

export function buildCommitteeMeetingPackSummaryHtml(input: {
  orgName: string | null;
  periodDays: number;
  generatedAt: string;
  scorecard: ComplianceControlHealthScorecardPack;
  posture: CompliancePostureScorePack;
  exceptions: ComplianceExceptionRegisterPack;
  openGaps: CommitteeMeetingOpenGapsPack;
}): string {
  const metricRows = input.scorecard.metrics
    .map(
      (m) =>
        `<tr><td>${escapeHtml(m.label)}</td><td>${m.score}</td><td>${escapeHtml(m.status)}</td><td>${escapeHtml(m.detail)}</td></tr>`,
    )
    .join("");

  const pillarRows = input.posture.pillars
    .map(
      (p) =>
        `<tr><td>${escapeHtml(p.label)}</td><td>${p.score}%</td><td>${Math.round(p.weight * 100)}%</td></tr>`,
    )
    .join("");

  const gapList =
    input.openGaps.topAssessmentGaps.length === 0
      ? "<p><em>No top assessment gaps in window.</em></p>"
      : `<ul>${input.openGaps.topAssessmentGaps
          .map(
            (g) =>
              `<li><strong>${escapeHtml(g.controlRef)}</strong> (${escapeHtml(g.framework)}) — ${escapeHtml(g.title)}</li>`,
          )
          .join("")}</ul>`;

  const remediationList =
    input.openGaps.openRemediationRows.length === 0
      ? "<p><em>No open remediations.</em></p>"
      : `<ul>${input.openGaps.openRemediationRows
          .slice(0, 12)
          .map(
            (r) =>
              `<li><strong>${escapeHtml(r.controlRef)}</strong> (${escapeHtml(r.status)}) — ${escapeHtml(r.title)}</li>`,
          )
          .join("")}</ul>`;

  const actions = input.scorecard.leadershipActions
    .map((a) => `<li>${escapeHtml(a)}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Compliance committee pack — ${escapeHtml(input.orgName ?? "Organization")}</title>
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
  <h1>Compliance committee meeting pack</h1>
  <p class="meta">${escapeHtml(SITE_BRAND_NAME)} · ${escapeHtml(input.orgName ?? "Organization")}<br />
  Generated ${escapeHtml(input.generatedAt)} · ${input.periodDays}-day window</p>
  <div class="kpis">
    <div class="kpi">Control health<strong>${input.scorecard.healthScore}</strong> (${input.scorecard.grade})</div>
    <div class="kpi">Posture score<strong>${input.posture.postureScore}</strong> (${input.posture.grade})</div>
    <div class="kpi">Exceptions open<strong>${input.exceptions.openCount}</strong> / ${input.exceptions.totalCount}</div>
    <div class="kpi">Open remediations<strong>${input.openGaps.gapRemediations.open + input.openGaps.gapRemediations.inProgress}</strong></div>
  </div>
  <h2>Health scorecard metrics</h2>
  <table>
    <thead><tr><th>Metric</th><th>Score</th><th>Status</th><th>Detail</th></tr></thead>
    <tbody>${metricRows}</tbody>
  </table>
  <h2>Posture pillars</h2>
  <table>
    <thead><tr><th>Pillar</th><th>Score</th><th>Weight</th></tr></thead>
    <tbody>${pillarRows}</tbody>
  </table>
  <h2>Exception register</h2>
  <p>${input.exceptions.openCount} open · ${input.exceptions.approvedCount} approved · ${input.exceptions.expiringWithin14Days} expiring within 14 days</p>
  <h2>Top assessment gaps</h2>
  ${gapList}
  <h2>Open gap remediations</h2>
  ${remediationList}
  <h2>Committee actions</h2>
  <ol>${actions}</ol>
  <footer>Live ${escapeHtml(SITE_BRAND_NAME)} data — scorecard, posture, exceptions, and gaps. Open this HTML in a browser and print to PDF for distribution.</footer>
</body>
</html>`;
}

export function buildCommitteeMeetingPackReadme(manifest: CommitteeMeetingPackManifest): string {
  return [
    "Zentro compliance committee meeting pack",
    `Version: ${manifest.version}`,
    `Generated: ${manifest.generatedAt}`,
    `Organization: ${manifest.orgName ?? manifest.orgId ?? "—"}`,
    `Period: ${manifest.periodDays} days`,
    `Files: ${manifest.fileCount}`,
    `Manifest SHA-256: ${manifest.manifestSha256}`,
    "",
    "Contents:",
    "  committee-pack-summary.html — print to PDF for board / committee",
    "  committee-pack-summary.txt  — plain-text leadership brief",
    "  scorecard/                — control health scorecard (JSON + CSV)",
    "  posture/                  — unified posture score (JSON + CSV)",
    "  exceptions/               — compliance exception register (JSON + CSV)",
    "  open-gaps/                — assessment gaps and remediation queue (JSON + CSV)",
    "  manifest.json             — tamper-evident file manifest",
    "",
    "Verify manifest.json before quarterly compliance committee distribution.",
  ].join("\n");
}

export function buildCommitteeMeetingPackManifest(
  files: CommitteeMeetingPackFile[],
): Omit<CommitteeMeetingPackManifest, "periodDays" | "orgId" | "orgName"> {
  const generatedAt = new Date().toISOString();
  const entries: EvidenceBundleFileEntry[] = files.map((f) => ({
    name: f.path,
    mediaType: f.mediaType,
    byteLength: Buffer.byteLength(f.content, "utf8"),
    sha256: sha256Hex(f.content),
  }));

  const manifestBody = {
    version: COMPLIANCE_COMMITTEE_MEETING_PACK_VERSION,
    generatedAt,
    periodDays: 0,
    orgId: null as string | null,
    orgName: null as string | null,
    fileCount: entries.length,
    files: entries,
  };

  return {
    version: COMPLIANCE_COMMITTEE_MEETING_PACK_VERSION,
    generatedAt,
    fileCount: entries.length,
    files: entries,
    manifestSha256: sha256Canonical(manifestBody),
  };
}

export function finalizeCommitteeMeetingPackManifest(
  partial: Omit<CommitteeMeetingPackManifest, "manifestSha256"> & {
    periodDays: number;
    orgId: string | null;
    orgName: string | null;
  },
): CommitteeMeetingPackManifest {
  const manifestBody = {
    version: partial.version,
    generatedAt: partial.generatedAt,
    periodDays: partial.periodDays,
    orgId: partial.orgId,
    orgName: partial.orgName,
    fileCount: partial.fileCount,
    files: partial.files,
  };
  return {
    ...partial,
    manifestSha256: sha256Canonical(manifestBody),
  };
}

export function buildCommitteeMeetingPackFilesFromParts(input: {
  orgId: string | null;
  orgName: string | null;
  periodDays: number;
  scorecard: ComplianceControlHealthScorecardPack;
  posture: CompliancePostureScorePack;
  exceptions: ComplianceExceptionRegisterPack;
  openGaps: CommitteeMeetingOpenGapsPack;
  generatedAt?: string;
}): CommitteeMeetingPackFile[] {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const summaryInput = {
    orgName: input.orgName,
    periodDays: input.periodDays,
    generatedAt,
    scorecard: input.scorecard,
    posture: input.posture,
    exceptions: input.exceptions,
    openGaps: input.openGaps,
  };

  return [
    {
      path: "committee-pack-summary.html",
      mediaType: "text/html",
      content: buildCommitteeMeetingPackSummaryHtml(summaryInput),
    },
    {
      path: "committee-pack-summary.txt",
      mediaType: "text/plain",
      content: buildCommitteeMeetingPackSummaryText(summaryInput),
    },
    {
      path: "scorecard/control-health-scorecard.json",
      mediaType: "application/json",
      content: `${JSON.stringify(input.scorecard, null, 2)}\n`,
    },
    {
      path: "scorecard/control-health-scorecard.csv",
      mediaType: "text/csv",
      content: complianceControlHealthScorecardToCsv(input.scorecard),
    },
    {
      path: "posture/posture-score.json",
      mediaType: "application/json",
      content: `${JSON.stringify(input.posture, null, 2)}\n`,
    },
    {
      path: "posture/posture-score.csv",
      mediaType: "text/csv",
      content: compliancePostureScoreToCsv(input.posture),
    },
    {
      path: "exceptions/exception-register.json",
      mediaType: "application/json",
      content: `${JSON.stringify(input.exceptions, null, 2)}\n`,
    },
    {
      path: "exceptions/exception-register.csv",
      mediaType: "text/csv",
      content: complianceExceptionRegisterToCsv(input.exceptions),
    },
    {
      path: "open-gaps/open-gaps.json",
      mediaType: "application/json",
      content: `${JSON.stringify(input.openGaps, null, 2)}\n`,
    },
    {
      path: "open-gaps/open-gaps.csv",
      mediaType: "text/csv",
      content: committeeMeetingOpenGapsToCsv(input.openGaps),
    },
  ];
}

export async function committeeMeetingPackToZip(
  files: CommitteeMeetingPackFile[],
  manifest: CommitteeMeetingPackManifest,
): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file("README.txt", buildCommitteeMeetingPackReadme(manifest));
  zip.file("manifest.json", `${canonicalJsonStringify(manifest)}\n`);
  for (const file of files) {
    zip.file(file.path, file.content);
  }
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

export async function buildCommitteeMeetingPackFiles(
  userId: string,
  opts: {
    periodDays?: number;
    orgId: string | null;
    orgName?: string | null;
    supabase?: SupabaseClient;
  },
): Promise<{ files: CommitteeMeetingPackFile[]; periodDays: number } | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const periodDays = opts.periodDays ?? 30;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const shared = { orgId: opts.orgId, periodDays, supabase };

  const [scorecard, posture, exceptions, program, remediationRows] = await Promise.all([
    buildComplianceControlHealthScorecardPack(userId, shared),
    buildCompliancePostureScorePack(userId, shared),
    buildComplianceExceptionRegisterPack(userId, shared),
    buildComplianceProgramDashboard(userId, shared),
    listComplianceGapRemediations(opts.orgId, supabase),
  ]);

  if (!scorecard || !posture || !exceptions || !program) return null;

  const openGaps = buildCommitteeMeetingOpenGapsPack({ program, remediationRows });
  const files = buildCommitteeMeetingPackFilesFromParts({
    orgId: opts.orgId,
    orgName: opts.orgName ?? null,
    periodDays,
    scorecard,
    posture,
    exceptions,
    openGaps,
  });

  return { files, periodDays };
}

export async function buildComplianceCommitteeMeetingPackZip(
  userId: string,
  opts: {
    periodDays?: number;
    orgId: string | null;
    orgName?: string | null;
    supabase?: SupabaseClient;
  },
): Promise<{ zip: Uint8Array; manifest: CommitteeMeetingPackManifest; filename: string } | null> {
  const built = await buildCommitteeMeetingPackFiles(userId, opts);
  if (!built) return null;

  const partialManifest = buildCommitteeMeetingPackManifest(built.files);
  const manifest = finalizeCommitteeMeetingPackManifest({
    ...partialManifest,
    periodDays: built.periodDays,
    orgId: opts.orgId,
    orgName: opts.orgName ?? null,
  });

  const zip = await committeeMeetingPackToZip(built.files, manifest);
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const filename = `zentro-committee-meeting-pack-${built.periodDays}d-${stamp}.zip`;

  return { zip, manifest, filename };
}
