import type { User } from "@supabase/supabase-js";

function titleizeLocalPart(local: string): string {
  const spaced = local.replace(/[._-]+/g, " ").trim();
  if (!spaced) return local;
  return spaced.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Human-facing name for console chrome (metadata, then friendly email local-part). */
export function getUserDisplayName(user: User | null): string | null {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  const full =
    typeof meta.full_name === "string"
      ? meta.full_name.trim()
      : typeof meta.name === "string"
        ? meta.name.trim()
        : "";
  if (full) return full;
  const email = user.email?.trim();
  if (!email) return null;
  const local = email.split("@")[0] ?? "";
  return titleizeLocalPart(local) || email;
}

export function getUserFirstName(user: User | null): string | null {
  const display = getUserDisplayName(user);
  if (!display) return null;
  const first = display.split(/\s+/)[0];
  return first || display;
}
