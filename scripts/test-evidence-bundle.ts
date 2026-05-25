import { complianceEvidencePackToCsv } from "../lib/compliance/export";
import {
  buildTamperEvidentManifest,
  canonicalJsonStringify,
  sha256Canonical,
  verifyEvidenceBundleManifest,
} from "../lib/compliance/manifest";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const pack = {
  generatedAt: "2026-05-25T12:00:00.000Z",
  windowLabel: "30d",
  sinceIso: "2026-04-25T00:00:00.000Z",
  summary: {
    sinceIso: "2026-04-25T00:00:00.000Z",
    auditEventsScanned: 1,
    acceptedPolicyCount: 0,
    coveragePercent: 25,
    rows: [],
  },
  auditEvents: [],
  acceptedPolicies: [],
};

const manifest = buildTamperEvidentManifest("bundle-1", "org-1", pack);
assert(verifyEvidenceBundleManifest(manifest), "manifest verifies");
assert(manifest.files.length === 2, "json and csv files hashed");
assert(manifest.files[0].name === "evidence.json", "json artifact");

const tampered = { ...manifest, auditEventCount: 999 };
assert(!verifyEvidenceBundleManifest(tampered as typeof manifest), "tampered manifest fails");

const a = canonicalJsonStringify({ b: 1, a: 2 });
const b = canonicalJsonStringify({ a: 2, b: 1 });
assert(a === b, "canonical json is stable");

assert(sha256Canonical({ x: 1 }) === sha256Canonical({ x: 1 }), "hash is deterministic");

const csv = complianceEvidencePackToCsv(pack);
assert(csv.includes("coverage_percent"), "csv still builds");

console.log("test-evidence-bundle: all checks passed");
