import { computeOverallProgramReadiness } from "../lib/compliance/program-dashboard";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const score = computeOverallProgramReadiness([
  { value: 80, weight: 2 },
  { value: 60, weight: 2 },
  { value: 50, weight: 1 },
  { value: 40, weight: 1 },
]);
assert(score > 50 && score < 75, "weighted readiness is between inputs");
assert(computeOverallProgramReadiness([]) === 0, "empty parts yields zero");

assert(isPathAllowedForAuditor("/governance/compliance/program"), "auditor can open program dashboard");

console.log("test-compliance-program: all checks passed");
