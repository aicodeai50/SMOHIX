import {
  buildHubPersonalizationState,
  DEFAULT_HUB_QUICK_LINK_HREFS,
  HUB_PERSONALIZATION_VERSION,
  moveHref,
  reorderNavModulesForPins,
  sanitizeHubPersonalizationPrefs,
  togglePinnedHref,
} from "../lib/console/hub-personalization";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const defaults = sanitizeHubPersonalizationPrefs(null, null);
assert(
  JSON.stringify(defaults.quickLinkHrefs) === JSON.stringify(DEFAULT_HUB_QUICK_LINK_HREFS),
  "defaults match",
);

const auditorSanitized = sanitizeHubPersonalizationPrefs(
  {
    quickLinkHrefs: ["/incidents", "/governance/compliance/type-ii", "/overview"],
    pinnedHrefs: ["/incidents", "/copilot"],
  },
  "auditor",
);
assert(!auditorSanitized.quickLinkHrefs.includes("/incidents"), "auditor strips incidents");
assert(auditorSanitized.quickLinkHrefs.includes("/governance/compliance/type-ii"), "auditor keeps compliance");
assert(!auditorSanitized.pinnedHrefs.includes("/copilot"), "auditor strips invalid pin");

const state = buildHubPersonalizationState(
  {
    quickLinkHrefs: ["/copilot", "/overview"],
    pinnedHrefs: ["/copilot"],
  },
  null,
);
assert(state.quickLinks.length === 2, "resolved quick links");
assert(state.quickLinks[0]?.href === "/copilot", "order preserved");
assert(state.pinnedHrefs[0] === "/copilot", "pinned preserved");
assert(state.version === HUB_PERSONALIZATION_VERSION, "version");

const modules = [
  { href: "/hub", label: "Platform" },
  { href: "/overview", label: "Overview" },
  { href: "/copilot", label: "Copilot" },
  { href: "/incidents", label: "Incidents" },
];
const reordered = reorderNavModulesForPins(modules, ["/copilot", "/overview"]);
assert(reordered[0]?.href === "/copilot", "pinned first");
assert(reordered[1]?.href === "/overview", "pinned second");
assert(reordered[2]?.href === "/hub", "unpinned follow");

assert(moveHref(["a", "b", "c"], "b", "up")[0] === "b", "move up");
assert(moveHref(["a", "b", "c"], "b", "down")[2] === "b", "move down");
assert(togglePinnedHref([], "/overview")[0] === "/overview", "toggle pin on");
assert(togglePinnedHref(["/overview"], "/overview").length === 0, "toggle pin off");

console.log("test-hub-personalization: ok");
