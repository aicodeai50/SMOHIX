/** Console routes — require a Supabase session when auth env is configured. */
export const PROTECTED_PREFIXES = [
  "/hub",
  "/vision",
  "/overview",
  "/copilot",
  "/incidents",
  "/services",
  "/automations",
  "/runbooks",
  "/approvals",
  "/audit",
  "/governance",
  "/settings",
  "/admin",
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
