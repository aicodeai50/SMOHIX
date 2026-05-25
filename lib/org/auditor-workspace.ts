import type { OrgRole } from "@/lib/org/roles";

/** Read-only SOC 2 Type II assessor workspace — path prefixes allowed in console. */
export const AUDITOR_WORKSPACE_PATH_PREFIXES = [
  "/governance/compliance",
  "/governance/third-party-risk",
  "/audit",
  "/auth",
] as const;

export const AUDITOR_WORKSPACE_HOME = "/governance/compliance/type-ii";

export function isAuditorWorkspaceRole(role: OrgRole | null | undefined): boolean {
  return role === "auditor";
}

export function isPathAllowedForAuditor(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? pathname;
  return AUDITOR_WORKSPACE_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export function filterConsoleModulesForRole<T extends { href: string }>(
  modules: readonly T[],
  role: OrgRole | null | undefined,
): T[] {
  if (!isAuditorWorkspaceRole(role)) return [...modules];
  const allowed = new Set([
    "/governance/compliance",
    "/governance/third-party-risk",
    "/audit",
  ]);
  return modules.filter((m) => {
    for (const base of allowed) {
      if (m.href === base || m.href.startsWith(`${base}/`)) return true;
    }
    return false;
  });
}
