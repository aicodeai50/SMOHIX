import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function read(relativePath) {
  const abs = path.join(root, relativePath);
  return readFile(abs, "utf8");
}

async function main() {
  const policyLib = await read("lib/approvals/policy.ts");
  const executeRoute = await read("app/api/automations/execute/route.ts");
  const remediationLib = await read("lib/automations/remediation.ts");

  // Shared parser should exist and include our required SLO gate signals.
  assert(
    policyLib.includes("export function parseApprovalNoteSignals"),
    "policy parser missing: parseApprovalNoteSignals",
  );
  assert(
    policyLib.includes("export const SLO_BURN_POLICY_BLOCKED_REASON"),
    "policy constant missing: SLO_BURN_POLICY_BLOCKED_REASON",
  );
  assert(
    policyLib.includes("export function isSloBurnPolicyBlockedReason"),
    "policy helper missing: isSloBurnPolicyBlockedReason",
  );
  assert(
    policyLib.includes("hasChangeWindow"),
    "policy parser missing hasChangeWindow signal",
  );
  assert(
    policyLib.includes("hasSeniorAcknowledgement"),
    "policy parser missing hasSeniorAcknowledgement signal",
  );
  assert(
    policyLib.includes("hasTwoPersonApproval"),
    "policy parser missing hasTwoPersonApproval signal",
  );

  // Approval policy path should use shared parser (single source of truth).
  assert(
    policyLib.includes("const signals = parseApprovalNoteSignals(policyHint)"),
    "evaluateApprovalPolicy should use shared parser",
  );
  assert(
    policyLib.includes("const signals = parseApprovalNoteSignals(input.approvalNote)"),
    "accepted policy enforcement should use shared parser",
  );

  // Execute path should import and use shared parser for SLO critical-burn gating.
  assert(
    executeRoute.includes("parseApprovalNoteSignals"),
    "execute route missing shared parser import/usage",
  );
  assert(
    executeRoute.includes("const signals = parseApprovalNoteSignals(approvalNote)"),
    "execute route should derive SLO checks from parser signals",
  );
  assert(
    executeRoute.includes("signals.hasSeniorAcknowledgement"),
    "execute route should use senior acknowledgement parser signal",
  );
  assert(
    executeRoute.includes("signals.hasChangeWindow"),
    "execute route should use change window parser signal",
  );
  assert(
    executeRoute.includes("const blockedReason = SLO_BURN_POLICY_BLOCKED_REASON"),
    "execute route should use shared SLO blocked reason constant",
  );

  // Remediation path should use the exact same shared parser.
  assert(
    remediationLib.includes("parseApprovalNoteSignals"),
    "remediation library missing shared parser import/usage",
  );
  assert(
    remediationLib.includes("const signals = parseApprovalNoteSignals(input.approvalNote)"),
    "remediation library should derive SLO checks from parser signals",
  );
  assert(
    remediationLib.includes("signals.hasSeniorAcknowledgement"),
    "remediation library should use senior acknowledgement parser signal",
  );
  assert(
    remediationLib.includes("signals.hasChangeWindow"),
    "remediation library should use change window parser signal",
  );
  assert(
    remediationLib.includes("blockedReason = SLO_BURN_POLICY_BLOCKED_REASON"),
    "remediation library should use shared SLO blocked reason constant",
  );

  const remediateRoute = await read("app/api/automations/remediate/route.ts");
  assert(
    remediateRoute.includes("isSloBurnPolicyBlockedReason(result.blockedReason)"),
    "remediate route should use shared SLO blocked reason matcher",
  );

  console.log("test-approval-policy: all checks passed");
}

main().catch((error) => {
  console.error(`test-approval-policy: FAILED\n${error.message}`);
  process.exitCode = 1;
});
