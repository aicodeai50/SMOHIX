import { AppShell } from "@/components/app/AppShell";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail: string | null = null;
  const authEnabled = hasSupabaseAuth();

  if (authEnabled) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userEmail = user?.email ?? null;
    } catch {
      userEmail = null;
    }
  }

  return (
    <AppShell userEmail={userEmail} authEnabled={authEnabled}>
      {children}
    </AppShell>
  );
}
