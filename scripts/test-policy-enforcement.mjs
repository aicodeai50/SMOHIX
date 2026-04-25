import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export async function runPolicyEnforcementChecks(root) {
  const [policySource, scopeSource, suggestionSource, reasonSource, executeRouteSource] = await Promise.all([
    readFile(path.join(root, "lib/approvals/policy.ts"), "utf8"),
    readFile(path.join(root, "lib/approvals/policy-scope.ts"), "utf8"),
    readFile(path.join(root, "lib/approvals/policy-suggestions.ts"), "utf8"),
    readFile(path.join(root, "lib/approvals/policy-block-reasons.ts"), "utf8"),
    readFile(path.join(root, "app/api/automations/execute/route.ts"), "utf8"),
  ]);

  assert(
    policySource.includes("export function evaluateAcceptedPolicyEnforcement"),
    "missing evaluateAcceptedPolicyEnforcement export",
  );
  assert(
    policySource.includes("Execution blocked by accepted policy"),
    "accepted policy enforcement must expose clear block messages",
  );
  assert(scopeSource.includes("export function parseMaxBlastScope"), "missing parseMaxBlastScope");
  assert(scopeSource.includes("export function hasMaxBlastToken"), "missing hasMaxBlastToken");
  assert(
    scopeSource.includes("max[-_\\s]?blast\\s*:\\s*(service|cluster|region|global)"),
    "blast scope parser must support service|cluster|region|global",
  );
  assert(
    suggestionSource.includes('from "@/lib/approvals/policy-scope"'),
    "policy suggestions must use shared blast scope parser",
  );
  assert(
    reasonSource.includes("export function policyBlockReasonCodeFromMessage"),
    "missing policyBlockReasonCodeFromMessage",
  );
  assert(
    executeRouteSource.includes("blocked_reason_code"),
    "execute route should persist normalized blocked reason code",
  );
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

if (process.argv[1] === __filename) {
  runPolicyEnforcementChecks(root)
    .then(() => {
      console.log("test-policy-enforcement: all checks passed");
    })
    .catch((error) => {
      console.error(`test-policy-enforcement: FAILED\n${error.message}`);
      process.exitCode = 1;
    });
}
