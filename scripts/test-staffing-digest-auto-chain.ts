import {
  classifyStaffingDigestChainStep,
  staffingDigestAutoChainPeriodKey,
  STAFFING_DIGEST_AUTO_CHAIN_VERSION,
  summarizeStaffingDigestAutoChain,
} from "../lib/compliance/staffing-digest-auto-chain";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(
  classifyStaffingDigestChainStep(true, "", []) === "sent",
  "ok → sent",
);
assert(
  classifyStaffingDigestChainStep(false, "Completion rollup already delivered this week.", [
    "already delivered",
  ]) === "skipped",
  "already delivered → skipped",
);
assert(
  classifyStaffingDigestChainStep(false, "Staffing completion rollup disabled for org.", [
    "already delivered",
  ]) === "failed",
  "disabled → failed",
);
assert(
  classifyStaffingDigestChainStep(
    false,
    "Rollup reported 2 open action(s) — no SLA breaches remain; escalation not required.",
    ["not required", "no sla breaches remain"],
  ) === "skipped",
  "escalation not required → skipped",
);

const summary = summarizeStaffingDigestAutoChain([
  { step: "rollup", status: "sent", reason: "delivered" },
  { step: "sla_breach", status: "skipped", reason: "no breaches" },
  { step: "escalation", status: "skipped", reason: "not required" },
]);
assert(summary.includes("rollup"), "summary mentions sent step");

const periodKey = staffingDigestAutoChainPeriodKey(new Date("2026-05-24T12:00:00.000Z"));
assert(periodKey.startsWith("week:"), "period key format");

assert(
  isPathAllowedForAuditor("/governance/compliance/staffing-digest-auto-chain"),
  "auditor path",
);

assert(
  STAFFING_DIGEST_AUTO_CHAIN_VERSION === "zentro-staffing-digest-auto-chain/1",
  "version",
);

console.log("test-staffing-digest-auto-chain: ok");
