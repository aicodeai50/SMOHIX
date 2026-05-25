import {
  inheritControlIdsForVendor,
} from "../lib/third-party-risk/inheritance";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const critical = inheritControlIdsForVendor("critical", "cloud");
const low = inheritControlIdsForVendor("low", "other");

assert(critical.length > low.length, "critical tier inherits more controls than low");
assert(critical.includes("soc2:CC6.6"), "cloud category boosts boundary control");
assert(critical.includes("iso:A.5.23"), "cloud inherits cloud services control");
assert(!low.includes("soc2:CC7.4"), "low tier skips incident program control");

assert(isPathAllowedForAuditor("/governance/third-party-risk"), "auditor can view register");

const baaVendor = inheritControlIdsForVendor("medium", "healthcare_baa");
assert(baaVendor.includes("hipaa:164.308b1"), "healthcare BAA category inherits HIPAA BAA control");

console.log("test-third-party-risk: all checks passed");
