import {
  isAuditorWorkspaceRole,
  isPathAllowedForAuditor,
  filterConsoleModulesForRole,
} from "../lib/org/auditor-workspace";
import { isReadOnlyAuditorRole } from "../lib/org/roles";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(isAuditorWorkspaceRole("auditor"), "auditor role detected");
assert(!isAuditorWorkspaceRole("admin"), "admin is not auditor workspace");
assert(isPathAllowedForAuditor("/governance/compliance/type-ii"), "type-ii allowed");
assert(!isPathAllowedForAuditor("/automations"), "automations blocked");
assert(isReadOnlyAuditorRole("auditor"), "auditor is read only");

const modules = [
  { href: "/hub" },
  { href: "/governance/compliance/type-ii" },
  { href: "/audit" },
  { href: "/automations" },
];
const filtered = filterConsoleModulesForRole(modules, "auditor");
assert(filtered.length === 2, "auditor sees compliance + audit modules only");
assert(filtered.some((m) => m.href.includes("compliance")), "compliance nav kept");

console.log("test-soc2-type-ii: all checks passed");
