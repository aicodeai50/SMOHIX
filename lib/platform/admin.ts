/**
 * Platform-level admin authorization for marketing lead review.
 * Separate from org-scoped admin roles.
 */

export function getPlatformAdminEmails(): string[] {
  const raw = (process.env.SMOHIX_PLATFORM_ADMIN_EMAILS ?? process.env.ZENTRO_PLATFORM_ADMIN_EMAILS) ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = getPlatformAdminEmails();
  if (allowed.length === 0) return false;
  return allowed.includes(email.trim().toLowerCase());
}

export async function requirePlatformAdmin(): Promise<
  { ok: true; email: string } | { ok: false; status: 401 | 403 }
> {
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false, status: 401 };
  }
  if (!isPlatformAdmin(user.email)) {
    return { ok: false, status: 403 };
  }
  return { ok: true, email: user.email };
}
