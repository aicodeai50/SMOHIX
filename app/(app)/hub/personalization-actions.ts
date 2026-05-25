"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  hubPersonalizationDefaults,
  sanitizeHubPersonalizationPrefs,
  type HubPersonalizationPrefs,
} from "@/lib/console/hub-personalization";
import { saveHubPersonalizationPrefs } from "@/lib/console/hub-personalization-db";
import { getOrgContextForUser } from "@/lib/org/context";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updateHubPersonalizationAction(
  prefs: Partial<HubPersonalizationPrefs>,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!hasSupabaseAuth()) {
    return { ok: false, reason: "Sign-in required to save hub preferences." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/hub");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const sanitized = sanitizeHubPersonalizationPrefs(prefs, orgContext.role);
  const result = await saveHubPersonalizationPrefs(supabase, user.id, orgContext.role, sanitized);
  if (!result.ok) {
    return result;
  }

  revalidatePath("/hub");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function resetHubPersonalizationAction(): Promise<
  { ok: true } | { ok: false; reason: string }
> {
  if (!hasSupabaseAuth()) {
    return { ok: false, reason: "Sign-in required to reset hub preferences." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/hub");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const defaults = hubPersonalizationDefaults();
  const result = await saveHubPersonalizationPrefs(supabase, user.id, orgContext.role, defaults);
  if (!result.ok) {
    return result;
  }

  revalidatePath("/hub");
  revalidatePath("/", "layout");
  return { ok: true };
}
