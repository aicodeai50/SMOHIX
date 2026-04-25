import path from "node:path";
import { fileURLToPath } from "node:url";
import { runDecisionCoreChecks } from "./test-decision-core.mjs";
import { runPolicyEnforcementChecks } from "./test-policy-enforcement.mjs";
import { runPolicyReviewFlowChecks } from "./test-policy-review-flow.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

function main() {
  return Promise.resolve().then(async () => {
    await runDecisionCoreChecks(root);
    await runPolicyEnforcementChecks(root);
    await runPolicyReviewFlowChecks(root);
    console.log("test-decision-intelligence: all checks passed");
  });
}

main().catch((error) => {
  console.error(`test-decision-intelligence: FAILED\n${error.message}`);
  process.exitCode = 1;
});
