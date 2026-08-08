import type { DryRunRecord } from "../lib/automations/runs-dev";
import type { EvidenceBundleRow } from "../lib/compliance/evidence-bundle";
import {
  buildControlTestRunLinks,
  buildControlTestingEvidenceLinkerFromParts,
  controlIdsForPlaybook,
  findBundleCoveringRun,
  CONTROL_TESTING_EVIDENCE_LINKER_VERSION,
  PLAYBOOK_CONTROL_FALLBACK,
} from "../lib/compliance/control-testing-evidence-linker";
import type { ControlTestingSchedule } from "../lib/compliance/control-testing-schedules";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(PLAYBOOK_CONTROL_FALLBACK["pb-scale-api"]?.length > 0, "fallback controls");

const runAt = new Date().toISOString();
const runs: DryRunRecord[] = [
  {
    id: "run-1",
    playbookId: "pb-scale-api",
    ok: true,
    detail: "dry run ok",
    at: runAt,
  },
];

const bundles: EvidenceBundleRow[] = [
  {
    id: "bundle-1",
    orgId: "org-1",
    windowLabel: "30d",
    sinceIso: new Date(Date.now() - 40 * 86_400_000).toISOString(),
    manifestSha256: "abc",
    manifest: {} as EvidenceBundleRow["manifest"],
    storageUri: "smohix://b1",
    deliveryStatus: "stored",
    deliveryNote: null,
    createdAt: runAt,
    createdBy: "user-1",
  },
];

const bundle = findBundleCoveringRun(runAt, bundles);
assert(bundle?.id === "bundle-1", "bundle covers run");

const schedules: ControlTestingSchedule[] = [
  {
    id: "freshness-1",
    kind: "freshness_retest",
    title: "Stale retest",
    cadenceLabel: "7d",
    nextRunAt: runAt,
    windowStart: runAt,
    windowEnd: runAt,
    status: "due",
    controlCount: 1,
    controlIds: ["soc2:CC7.2"],
    framework: null,
    detail: "retest",
    href: "/governance/compliance/evidence-freshness",
  },
];

const links = buildControlTestRunLinks({
  runs,
  acceptedByPlaybook: {},
  bundles,
  schedules,
});

assert(links.length >= 1, "links built");
assert(links.some((l) => l.linkStatus === "linked"), "linked status");
assert(links.some((l) => l.controlRef), "control ref");

const pack = buildControlTestingEvidenceLinkerFromParts({
  orgId: "org-1",
  periodDays: 30,
  runs,
  acceptedByPlaybook: {},
  bundles,
  schedules,
});

assert(pack.version === CONTROL_TESTING_EVIDENCE_LINKER_VERSION, "version");
assert(pack.linkCount === links.length, "link count");

const ids = controlIdsForPlaybook("pb-scale-api", {});
assert(ids.includes("soc2:CC7.2"), "fallback mapping used");

assert(
  isPathAllowedForAuditor("/governance/compliance/testing-evidence-linker"),
  "auditor path",
);

console.log("test-control-testing-evidence-linker: all checks passed");
