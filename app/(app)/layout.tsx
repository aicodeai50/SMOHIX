import { AppShell } from "@/components/app/AppShell";
import { getUserDisplayName } from "@/lib/auth/display-name";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Always SSR console HTML so deploys and nav are not served from a stale shell cache. */
export const dynamic = "force-dynamic";

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail: string | null = null;
  let userDisplayName: string | null = null;
  const authEnabled = hasSupabaseAuth();

  if (authEnabled) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userEmail = user?.email ?? null;
      userDisplayName = getUserDisplayName(user);
    } catch {
      userEmail = null;
      userDisplayName = null;
    }
  }

  return (
    <AppShell
      userEmail={userEmail}
      userDisplayName={userDisplayName}
      authEnabled={authEnabled}
    >
      {children}
    </AppShell>
  );
}
