import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ApiKeysPanel, type ApiKeyRow } from "@/components/settings/ApiKeysPanel";
import { PageHeader } from "@/components/app/PageHeader";
import { appBody } from "@/lib/app-typography";
import { devListKeys } from "@/lib/api-keys/dev-store";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "API keys",
  description: "Create keys for scripts and integrations calling Shynvo proxies.",
};

export const dynamic = "force-dynamic";

export default async function ApiKeysSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const returnHref =
    typeof sp.next === "string" && sp.next.startsWith("/")
      ? sp.next
      : null;

  if (!hasSupabaseAuth()) {
    const jar = await cookies();
    const tid = jar.get("shynvo_dev_tid")?.value ?? null;
    const initialKeys = (tid ? devListKeys(tid) : []) as ApiKeyRow[];

    return (
      <>
        <PageHeader
          title="API keys"
          description="Session mode: keys are stored in server memory per browser session (cookie). They authenticate /api/reasoning and /api/robot until Supabase is connected; then keys live in Postgres."
        />
        {returnHref ? (
          <p className={`mb-4 ${appBody}`}>
            <Link href={returnHref} className="font-medium text-accent hover:underline">
              ← Return to setup wizard
            </Link>
          </p>
        ) : null}
        <ApiKeysPanel
          initialKeys={initialKeys}
          serviceRoleConfigured={false}
          sessionScoped
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?next=/settings/api-keys");
  }

  const { data: rows, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, created_at, last_used_at, revoked_at")
    .order("created_at", { ascending: false });

  const listError = error?.message;
  const initialKeys = (rows ?? []) as ApiKeyRow[];
  const serviceRoleConfigured = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );

  return (
    <>
      <PageHeader
        title="API keys"
        description="Authenticate server-side jobs and tools to the same-origin reasoning and robot proxies without a browser session."
      />
      {returnHref ? (
        <p className={`mb-4 ${appBody}`}>
          <Link href={returnHref} className="font-medium text-accent hover:underline">
            ← Return to setup wizard
          </Link>
        </p>
      ) : null}
      {listError ? (
        <p className={`mb-6 max-w-2xl rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-100/90 ${appBody}`}>
          Could not load keys: {listError}. If the table is missing, run{" "}
          <span className="font-mono">supabase/migrations/20260418150000_api_keys.sql</span> in
          Supabase.
        </p>
      ) : null}
      <ApiKeysPanel
        initialKeys={initialKeys}
        serviceRoleConfigured={serviceRoleConfigured}
        sessionScoped={false}
      />
    </>
  );
}
