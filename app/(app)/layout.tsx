import { AppShell } from "@/components/app/AppShell";
import { AuditorWorkspaceGuard } from "@/components/app/AuditorWorkspaceGuard";
import { getUserDisplayName } from "@/lib/auth/display-name";
import { filterConsoleModulesForRole, isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { getOrgContextForUser } from "@/lib/org/context";
import { CONSOLE_MODULES } from "@/lib/console-nav";
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
  let orgRole = null as import("@/lib/org/roles").OrgRole | null;

  if (authEnabled) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userEmail = user?.email ?? null;
      userDisplayName = getUserDisplayName(user);
      if (user) {
        orgRole = (await getOrgContextForUser(user.id)).role;
      }
    } catch {
      userEmail = null;
      userDisplayName = null;
    }
  }

  const navModules = filterConsoleModulesForRole(CONSOLE_MODULES, orgRole);
  const auditorWorkspace = isAuditorWorkspaceRole(orgRole);

  return (
    <AppShell
      userEmail={userEmail}
      userDisplayName={userDisplayName}
      authEnabled={authEnabled}
      navModules={navModules}
      auditorWorkspace={auditorWorkspace}
    >
      <AuditorWorkspaceGuard orgRole={orgRole}>{children}</AuditorWorkspaceGuard>
    </AppShell>
  );
}
