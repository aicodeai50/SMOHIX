import { createHash } from "node:crypto";

import { gapKeyFor, suggestRemediationForGap } from "../lib/compliance/gap-remediation";
import { isRunbookSlugValid } from "../lib/runbooks/catalog";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const gap = {
  framework: "soc2" as const,
  controlRef: "CC6.1",
  title: "Logical access",
  reason: "No MFA enforcement events in the 30-day window",
};

const key1 = gapKeyFor(gap);
const key2 = gapKeyFor(gap);
assert(key1 === key2, "gap key is stable");
assert(key1.startsWith("soc2:CC6.1:"), "gap key prefix");

const suggestion = suggestRemediationForGap(gap);
assert(isRunbookSlugValid(suggestion.runbookSlug), "suggested runbook exists");
assert(/access|MFA/i.test(suggestion.rationale) || suggestion.runbookSlug.includes("access"), "access gap maps to access runbook");

const dbGap = {
  framework: "cmmc_l2" as const,
  controlRef: "3.1.1",
  title: "System backup",
  reason: "Recovery testing audit events missing",
};
const dbSuggestion = suggestRemediationForGap(dbGap);
assert(dbSuggestion.runbookSlug === "db-failover", "backup gap maps to db failover");

assert(
  isPathAllowedForAuditor("/governance/compliance/runbooks"),
  "auditor can open gap runbooks",
);

assert(createHash("sha256").digest("hex").length === 64, "hash sanity");

console.log("test-compliance-gap-runbooks: all checks passed");
