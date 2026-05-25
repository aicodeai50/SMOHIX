import { createHash } from "node:crypto";

import type { ComplianceEvidencePack } from "@/lib/compliance/export";
import { complianceEvidencePackToCsv } from "@/lib/compliance/export";

export const EVIDENCE_BUNDLE_MANIFEST_VERSION = "zentro-evidence-bundle/1";

export type EvidenceBundleFileEntry = {
  name: string;
  mediaType: string;
  byteLength: number;
  sha256: string;
};

export type EvidenceBundleManifest = {
  version: typeof EVIDENCE_BUNDLE_MANIFEST_VERSION;
  bundleId: string;
  orgId: string;
  generatedAt: string;
  windowLabel: string;
  sinceIso: string | null;
  coveragePercent: number;
  auditEventCount: number;
  acceptedPolicyCount: number;
  files: EvidenceBundleFileEntry[];
  manifestSha256: string;
};

function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/** Stable JSON for hashing (sorted keys). */
export function canonicalJsonStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => canonicalJsonStringify(v)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJsonStringify(obj[k])}`).join(",")}}`;
}

export function sha256Canonical(value: unknown): string {
  return sha256Hex(canonicalJsonStringify(value));
}

export function buildTamperEvidentManifest(
  bundleId: string,
  orgId: string,
  pack: ComplianceEvidencePack,
): EvidenceBundleManifest {
  const jsonBytes = JSON.stringify(pack);
  const csvBytes = complianceEvidencePackToCsv(pack);

  const files: EvidenceBundleFileEntry[] = [
    {
      name: "evidence.json",
      mediaType: "application/json",
      byteLength: Buffer.byteLength(jsonBytes, "utf8"),
      sha256: sha256Hex(jsonBytes),
    },
    {
      name: "evidence.csv",
      mediaType: "text/csv",
      byteLength: Buffer.byteLength(csvBytes, "utf8"),
      sha256: sha256Hex(csvBytes),
    },
  ];

  const body = {
    version: EVIDENCE_BUNDLE_MANIFEST_VERSION,
    bundleId,
    orgId,
    generatedAt: pack.generatedAt,
    windowLabel: pack.windowLabel,
    sinceIso: pack.sinceIso,
    coveragePercent: pack.summary.coveragePercent,
    auditEventCount: pack.auditEvents.length,
    acceptedPolicyCount: pack.acceptedPolicies.length,
    files,
  };

  const manifestSha256 = sha256Canonical(body);

  return {
    version: EVIDENCE_BUNDLE_MANIFEST_VERSION,
    bundleId,
    orgId,
    generatedAt: pack.generatedAt,
    windowLabel: pack.windowLabel,
    sinceIso: pack.sinceIso,
    coveragePercent: pack.summary.coveragePercent,
    auditEventCount: pack.auditEvents.length,
    acceptedPolicyCount: pack.acceptedPolicies.length,
    files,
    manifestSha256,
  };
}

export function verifyEvidenceBundleManifest(manifest: EvidenceBundleManifest): boolean {
  const { manifestSha256, ...rest } = manifest;
  return sha256Canonical(rest) === manifestSha256;
}
