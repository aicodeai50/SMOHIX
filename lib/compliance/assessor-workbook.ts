import { createHash } from "node:crypto";

import JSZip from "jszip";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildComplianceEvidencePack,
  complianceEvidencePackToCsv,
} from "@/lib/compliance/export";
import { buildCisV8AssessmentReport } from "@/lib/compliance/cis-v8-assessment";
import { buildCmmcL2AssessmentReport } from "@/lib/compliance/cmmc-l2-assessment";
import { buildGdprArt32AssessmentReport } from "@/lib/compliance/gdpr-art32-assessment";
import { buildHipaaSecurityAssessmentReport } from "@/lib/compliance/hipaa-assessment";
import { buildIso27001AssessmentReport } from "@/lib/compliance/iso-assessment";
import { buildNistCsfAlignmentReport } from "@/lib/compliance/nist-csf-assessment";
import { buildPciDssAssessmentReport } from "@/lib/compliance/pci-dss-assessment";
import { buildComplianceProgramDashboard } from "@/lib/compliance/program-dashboard";
import {
  buildControlTestingEvidenceLinkerPack,
  controlTestingEvidenceLinkerToCsv,
} from "@/lib/compliance/control-testing-evidence-linker";
import {
  buildSoc2IsoCrosswalkPack,
  soc2IsoCrosswalkToCsv,
} from "@/lib/compliance/soc2-iso-crosswalk";
import { buildSoc2TypeIIReport } from "@/lib/compliance/type-ii-report";
import {
  canonicalJsonStringify,
  sha256Canonical,
  type EvidenceBundleFileEntry,
} from "@/lib/compliance/manifest";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const ASSESSOR_WORKBOOK_VERSION = "smohix-assessor-workbook/1";

export type AssessorWorkbookFile = {
  path: string;
  mediaType: string;
  content: string;
};

export type AssessorWorkbookManifest = {
  version: typeof ASSESSOR_WORKBOOK_VERSION;
  generatedAt: string;
  periodDays: number;
  orgId: string | null;
  fileCount: number;
  files: EvidenceBundleFileEntry[];
  manifestSha256: string;
};

function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function buildAssessorWorkbookReadme(manifest: AssessorWorkbookManifest): string {
  const lines = [
    "Smohix unified assessor workbook",
    `Version: ${manifest.version}`,
    `Generated: ${manifest.generatedAt}`,
    `Period: ${manifest.periodDays} days`,
    `Files: ${manifest.fileCount}`,
    `Manifest SHA-256: ${manifest.manifestSha256}`,
    "",
    "Contents:",
    "  evidence/     — compliance evidence pack (JSON + CSV)",
    "  crosswalk/    — SOC 2 / ISO 27001 mapping matrix",
    "  assessments/ — framework readiness reports (JSON)",
    "  manifest.json — tamper-evident file manifest",
    "  testing/      — control test run ↔ bundle links for assessor export",
    "",
    "Verify manifest.json hashes before external audit delivery.",
  ];
  return lines.join("\n");
}

export function buildAssessorWorkbookManifest(files: AssessorWorkbookFile[]): AssessorWorkbookManifest {
  const generatedAt = new Date().toISOString();
  const entries: EvidenceBundleFileEntry[] = files.map((f) => {
    const content = f.content;
    return {
      name: f.path,
      mediaType: f.mediaType,
      byteLength: Buffer.byteLength(content, "utf8"),
      sha256: sha256Hex(content),
    };
  });

  const manifestBody = {
    version: ASSESSOR_WORKBOOK_VERSION,
    generatedAt,
    periodDays: 0,
    orgId: null as string | null,
    fileCount: entries.length,
    files: entries,
  };

  const manifestSha256 = sha256Canonical(manifestBody);

  return {
    version: ASSESSOR_WORKBOOK_VERSION,
    generatedAt,
    periodDays: 0,
    orgId: null,
    fileCount: entries.length,
    files: entries,
    manifestSha256,
  };
}

export function finalizeAssessorWorkbookManifest(
  partial: Omit<AssessorWorkbookManifest, "periodDays" | "orgId"> & {
    periodDays: number;
    orgId: string | null;
  },
): AssessorWorkbookManifest {
  const manifestBody = {
    version: partial.version,
    generatedAt: partial.generatedAt,
    periodDays: partial.periodDays,
    orgId: partial.orgId,
    fileCount: partial.fileCount,
    files: partial.files,
  };
  return {
    ...partial,
    periodDays: partial.periodDays,
    orgId: partial.orgId,
    manifestSha256: sha256Canonical(manifestBody),
  };
}

export async function assessorWorkbookToZip(
  files: AssessorWorkbookFile[],
  manifest: AssessorWorkbookManifest,
): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file("README.txt", buildAssessorWorkbookReadme(manifest));
  zip.file("manifest.json", `${canonicalJsonStringify(manifest)}\n`);
  for (const file of files) {
    zip.file(file.path, file.content);
  }
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

export async function buildAssessorWorkbookFiles(
  userId: string,
  opts: {
    periodDays?: number;
    orgId: string | null;
    supabase?: SupabaseClient;
  },
): Promise<{ files: AssessorWorkbookFile[]; periodDays: number } | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const periodDays = opts.periodDays ?? 30;
  const sinceIso = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();
  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const shared = { orgId: opts.orgId, periodDays, supabase };

  const [
    evidence,
    crosswalk,
    soc2,
    iso,
    pci,
    hipaa,
    nist,
    cis,
    cmmc,
    gdpr,
    program,
  ] = await Promise.all([
    buildComplianceEvidencePack(userId, {
      sinceIso,
      windowLabel: `${periodDays}d`,
      orgId: opts.orgId,
      supabase,
    }),
    buildSoc2IsoCrosswalkPack(userId, shared),
    buildSoc2TypeIIReport(userId, shared),
    buildIso27001AssessmentReport(userId, shared),
    buildPciDssAssessmentReport(userId, shared),
    buildHipaaSecurityAssessmentReport(userId, shared),
    buildNistCsfAlignmentReport(userId, shared),
    buildCisV8AssessmentReport(userId, shared),
    buildCmmcL2AssessmentReport(userId, shared),
    buildGdprArt32AssessmentReport(userId, shared),
    buildComplianceProgramDashboard(userId, shared),
  ]);

  if (!evidence || !crosswalk) return null;

  const files: AssessorWorkbookFile[] = [
    {
      path: "evidence/evidence-pack.json",
      mediaType: "application/json",
      content: `${JSON.stringify(evidence, null, 2)}\n`,
    },
    {
      path: "evidence/evidence-pack.csv",
      mediaType: "text/csv",
      content: complianceEvidencePackToCsv(evidence),
    },
    {
      path: "crosswalk/soc2-iso-crosswalk.json",
      mediaType: "application/json",
      content: `${JSON.stringify(crosswalk, null, 2)}\n`,
    },
    {
      path: "crosswalk/soc2-iso-crosswalk.csv",
      mediaType: "text/csv",
      content: soc2IsoCrosswalkToCsv(crosswalk),
    },
  ];

  const assessments: { name: string; data: unknown }[] = [
    { name: "soc2-type-ii.json", data: soc2 },
    { name: "iso27001.json", data: iso },
    { name: "pci-dss.json", data: pci },
    { name: "hipaa.json", data: hipaa },
    { name: "nist-csf.json", data: nist },
    { name: "cis-v8.json", data: cis },
    { name: "cmmc-l2.json", data: cmmc },
    { name: "gdpr-art32.json", data: gdpr },
    { name: "program-dashboard.json", data: program },
  ];

  for (const a of assessments) {
    if (!a.data) continue;
    files.push({
      path: `assessments/${a.name}`,
      mediaType: "application/json",
      content: `${JSON.stringify(a.data, null, 2)}\n`,
    });
  }

  const testLinks = await buildControlTestingEvidenceLinkerPack(userId, {
    orgId: opts.orgId,
    periodDays,
    supabase,
  });
  if (testLinks) {
    files.push({
      path: "testing/control-test-evidence-links.json",
      mediaType: "application/json",
      content: `${JSON.stringify(testLinks, null, 2)}\n`,
    });
    files.push({
      path: "testing/control-test-evidence-links.csv",
      mediaType: "text/csv",
      content: controlTestingEvidenceLinkerToCsv(testLinks),
    });
  }

  return { files, periodDays };
}

export async function buildAssessorWorkbookZip(
  userId: string,
  opts: {
    periodDays?: number;
    orgId: string | null;
    supabase?: SupabaseClient;
  },
): Promise<{ zip: Uint8Array; manifest: AssessorWorkbookManifest; filename: string } | null> {
  const built = await buildAssessorWorkbookFiles(userId, opts);
  if (!built) return null;

  const partialManifest = buildAssessorWorkbookManifest(built.files);
  const manifest = finalizeAssessorWorkbookManifest({
    ...partialManifest,
    periodDays: built.periodDays,
    orgId: opts.orgId,
  });

  const zip = await assessorWorkbookToZip(built.files, manifest);
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const filename = `smohix-assessor-workbook-${built.periodDays}d-${stamp}.zip`;

  return { zip, manifest, filename };
}
