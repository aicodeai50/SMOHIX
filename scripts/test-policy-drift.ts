import type { AcceptedPolicyGuardrails } from "../lib/approvals/policy-suggestions";
import {
  buildPolicyDriftFindings,
  buildPolicyDriftPackFromFindings,
  guardrailDriftKindsForControl,
  detectGuardrailTextMismatch,
  buildAcceptedPolicySnapshots,
} from "../lib/compliance/policy-drift";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const partialGuardrails: AcceptedPolicyGuardrails = {
  playbookId: "pb-scale-api",
  maxBlastRadius: null,
  requireDryRunFresh: false,
  requireChangeWindow: true,
  suggestionIds: ["s1"],
};

const kinds = guardrailDriftKindsForControl("soc2:CC8.1", partialGuardrails);
assert(kinds.includes("missing_dry_run_fresh"), "detects missing dry run");
assert(!kinds.includes("missing_change_window"), "change window satisfied");

const snapshots = buildAcceptedPolicySnapshots(
  { "pb-scale-api": partialGuardrails },
  { "pb-scale-api": "2025-01-01T00:00:00.000Z" },
);

const findings = buildPolicyDriftFindings({
  snapshots,
  gaps: [
    {
      fullControlId: "soc2:CC8.1",
      framework: "soc2",
      controlRef: "CC8.1",
      title: "Change management",
      reason: "Partial evidence — missing audit events or accepted policy mapping.",
    },
  ],
  rawGuardrailsByPlaybook: {
    "pb-scale-api": ["Require dry-run freshness before execute"],
  },
});

assert(findings.length >= 2, "gap and text mismatch findings");
assert(
  findings.some((f) => f.kind === "missing_dry_run_fresh"),
  "missing dry run finding",
);

const mismatch = detectGuardrailTextMismatch(
  "pb-test",
  {
    playbookId: "pb-test",
    maxBlastRadius: null,
    requireDryRunFresh: false,
    requireChangeWindow: false,
    suggestionIds: [],
  },
  ["change window required"],
  "2025-06-01T00:00:00.000Z",
);
assert(mismatch?.kind === "guardrail_text_mismatch", "text mismatch kind");

const pack = buildPolicyDriftPackFromFindings({
  orgId: "org-1",
  periodDays: 30,
  acceptedPolicyCount: 1,
  assessmentGapCount: 1,
  findings,
});
assert(pack.highCount + pack.mediumCount + pack.lowCount === pack.findings.length, "severity counts");

console.log("test-policy-drift: all checks passed");
