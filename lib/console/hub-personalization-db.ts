import type { SupabaseClient } from "@supabase/supabase-js";

import {
  hubPersonalizationDefaults,
  sanitizeHubPersonalizationPrefs,
  type HubPersonalizationPrefs,
} from "@/lib/console/hub-personalization";
import type { OrgRole } from "@/lib/org/roles";

type HubPrefsRow = {
  quick_link_hrefs: unknown;
  pinned_hrefs: unknown;
};

export async function loadHubPersonalizationPrefs(
  supabase: SupabaseClient,
  userId: string,
  role: OrgRole | null | undefined,
): Promise<HubPersonalizationPrefs> {
  const { data, error } = await supabase
    .from("user_console_hub_prefs")
    .select("quick_link_hrefs, pinned_hrefs")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return hubPersonalizationDefaults();
  }

  const row = data as HubPrefsRow;
  return sanitizeHubPersonalizationPrefs(
    {
      quickLinkHrefs: row.quick_link_hrefs as string[] | undefined,
      pinnedHrefs: row.pinned_hrefs as string[] | undefined,
    },
    role,
  );
}

export async function saveHubPersonalizationPrefs(
  supabase: SupabaseClient,
  userId: string,
  role: OrgRole | null | undefined,
  raw: Partial<HubPersonalizationPrefs>,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const prefs = sanitizeHubPersonalizationPrefs(raw, role);
  const { error } = await supabase.from("user_console_hub_prefs").upsert(
    {
      user_id: userId,
      quick_link_hrefs: prefs.quickLinkHrefs,
      pinned_hrefs: prefs.pinnedHrefs,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return { ok: false, reason: error.message };
  }

  return { ok: true };
}
