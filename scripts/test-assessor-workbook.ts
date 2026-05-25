import JSZip from "jszip";

import {
  ASSESSOR_WORKBOOK_VERSION,
  assessorWorkbookToZip,
  buildAssessorWorkbookManifest,
  buildAssessorWorkbookReadme,
  finalizeAssessorWorkbookManifest,
  type AssessorWorkbookFile,
} from "../lib/compliance/assessor-workbook";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const mockFiles: AssessorWorkbookFile[] = [
  {
    path: "evidence/evidence-pack.json",
    mediaType: "application/json",
    content: '{"generatedAt":"2026-05-25T00:00:00.000Z"}\n',
  },
  {
    path: "crosswalk/soc2-iso-crosswalk.csv",
    mediaType: "text/csv",
    content: "soc2_ref,iso_ref\nCC6.1,A.5.15\n",
  },
  {
    path: "assessments/soc2-type-ii.json",
    mediaType: "application/json",
    content: '{"framework":"soc2"}\n',
  },
];

const partial = buildAssessorWorkbookManifest(mockFiles);
const manifest = finalizeAssessorWorkbookManifest({
  ...partial,
  periodDays: 30,
  orgId: "org-test",
});

assert(manifest.version === ASSESSOR_WORKBOOK_VERSION, "workbook version set");
assert(manifest.fileCount === 3, "three content files in manifest");
assert(manifest.manifestSha256.length === 64, "manifest hash present");

const readme = buildAssessorWorkbookReadme(manifest);
assert(readme.includes("assessor workbook"), "readme describes workbook");

async function main() {
  const zipBytes = await assessorWorkbookToZip(mockFiles, manifest);
  assert(zipBytes.length > 100, "zip has content");

  const zip = await JSZip.loadAsync(zipBytes);
  const names = Object.keys(zip.files).map((n) => n.replace(/\\/g, "/"));
  assert(names.includes("README.txt"), "zip contains readme");
  assert(names.includes("manifest.json"), "zip contains manifest");
  assert(names.some((n) => n.includes("evidence/evidence-pack.json")), "zip contains evidence");

  assert(isPathAllowedForAuditor("/governance/compliance/workbook"), "auditor can open workbook page");

  console.log("test-assessor-workbook: all checks passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
