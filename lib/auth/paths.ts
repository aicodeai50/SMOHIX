/** Console routes — require a Supabase session when auth env is configured. */
const PROTECTED_PREFIXES = [
  "/copilot",
  "/incidents",
  "/automations",
  "/approvals",
  "/audit",
  "/settings",
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
