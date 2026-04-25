import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  return readFile(path.join(root, "lib/decision-intelligence.ts"), "utf8").then((source) => {
    assert(source.includes("export function buildDecisionBrief"), "missing buildDecisionBrief export");
    assert(source.includes("export function buildExpectedOutcome"), "missing buildExpectedOutcome export");
    assert(source.includes("export function buildActualOutcome"), "missing buildActualOutcome export");
    assert(source.includes("export function decisionAccuracyScore"), "missing decisionAccuracyScore export");
    assert(
      source.includes("export function suggestPolicyPromotions"),
      "missing suggestPolicyPromotions export",
    );
    assert(source.includes("Two-person approval"), "policy check labels should include two-person approval");
    assert(source.includes("Rollback plan"), "policy checks should enforce rollback plan");
    console.log("test-decision-intelligence: all checks passed");
  });
}

main().catch((error) => {
  console.error(`test-decision-intelligence: FAILED\n${error.message}`);
  process.exitCode = 1;
});
