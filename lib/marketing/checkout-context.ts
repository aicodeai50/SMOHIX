import { getCheckoutUrlForUser, getTeamCheckoutUrlForUser } from "@/lib/billing";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SignedInCheckoutUrls = {
  pro?: string;
  team?: string;
};

/** Signed-in billing URLs (PayPal checkout via /settings/billing). */
export async function getSignedInCheckoutUrls(): Promise<SignedInCheckoutUrls> {
  if (!hasSupabaseAuth()) {
    return {};
  }
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return {};
    }
    const pro = getCheckoutUrlForUser(user.id);
    const team = getTeamCheckoutUrlForUser(user.id);
    const out: SignedInCheckoutUrls = {};
    if (pro) out.pro = pro;
    if (team) out.team = team;
    return out;
  } catch {
    return {};
  }
}

/** @deprecated Prefer `getSignedInCheckoutUrls().pro` */
export async function getSignedInCheckoutUrl(): Promise<string | undefined> {
  const u = await getSignedInCheckoutUrls();
  return u.pro;
}
