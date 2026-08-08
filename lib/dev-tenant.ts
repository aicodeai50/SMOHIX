/**
 * Dev-mode tenant cookie for in-memory stores when Supabase auth is off.
 * Prefers Smohix cookie; migrates once from legacy Zentro cookie name.
 */

export const DEV_TENANT_COOKIE = "smohix_dev_tid" as const;
/** Temporary compatibility — remove after clients have migrated. */
export const LEGACY_DEV_TENANT_COOKIE = "zentro_dev_tid" as const;

type CookieReader = {
  get: (name: string) => { value: string } | undefined;
};

export function readDevTenantId(cookies: CookieReader): string | undefined {
  return cookies.get(DEV_TENANT_COOKIE)?.value ?? cookies.get(LEGACY_DEV_TENANT_COOKIE)?.value;
}
