import { getCheckoutUrlForUser } from "@/lib/billing";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Lemon checkout URL with `shynvo_user_id` when the visitor is signed in; otherwise `undefined`. */
export async function getSignedInCheckoutUrl(): Promise<string | undefined> {
  if (!hasSupabaseAuth()) {
    return undefined;
  }
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return undefined;
    }
    return getCheckoutUrlForUser(user.id);
  } catch {
    return undefined;
  }
}
