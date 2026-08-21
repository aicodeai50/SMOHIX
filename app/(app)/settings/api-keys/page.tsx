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
  description: "Create keys for scripts and integrations calling Smohix proxies.",
};

export const dynamic = "force-dynamic";

export default async function ApiKeysSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string; setup_step?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const returnHref =
    typeof sp.next === "string" && sp.next.startsWith("/")
      ? sp.next
      : null;
  const setupStep = typeof sp.setup_step === "string" ? sp.setup_step.trim().toLowerCase() : "";
  const wizardContextQuery = [
    returnHref ? `next=${encodeURIComponent(returnHref)}` : null,
    setupStep ? `setup_step=${encodeURIComponent(setupStep)}` : null,
  ]
    .filter(Boolean)
    .join("&");
  const apiKeysPathWithWizard = `/settings/api-keys${
    wizardContextQuery ? `?${wizardContextQuery}` : ""
  }${setupStep === "api-key" ? "#api-key-create" : ""}`;
  const currentStepIsApiKey = setupStep === "api-key";
  const setupStepPosition = currentStepIsApiKey ? 2 : null;
  const setupStepLabel = "API key";
  const inSetupFlow = Boolean(returnHref && currentStepIsApiKey);

  if (!hasSupabaseAuth()) {
    const jar = await cookies();
    const tid = (jar.get("smohix_dev_tid")?.value ?? jar.get("zentro_dev_tid")?.value) ?? null;
    const initialKeys = (tid ? devListKeys(tid) : []) as ApiKeyRow[];
    const hasActiveKey = initialKeys.some((k) => !k.revoked_at);

    return (
      <>
        <PageHeader
          title="API keys"
          description="Session mode: keys are stored in server memory for this browser session. They authenticate /api/reasoning and /api/robot until Supabase is connected."
        />
        <p className={`mb-6 max-w-2xl ${appBody}`}>
          <Link href="/docs/api#api-keys" className="font-medium text-accent hover:underline">
            API key documentation →
          </Link>
          {" · "}
          <Link href="/developers" className="font-medium text-accent hover:underline">
            Developer platform →
          </Link>
        </p>
        {returnHref ? (
          <p className={`mb-4 ${appBody}`}>
            <Link href={returnHref} className="font-medium text-accent hover:underline">
              ← Return to setup wizard
            </Link>
          </p>
        ) : null}
        {inSetupFlow ? (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 ${
                hasActiveKey
                  ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-300"
                  : "border-accent/35 bg-accent/10 text-accent"
              } ${appBody}`}
            >
              Guided setup: step {setupStepPosition} of 4
            </span>
            <span className={`rounded-full border border-white/[0.12] px-2.5 py-1 text-foreground/75 ${appBody}`}>
              {setupStepLabel}
            </span>
            <span
              className={`rounded-full border px-2.5 py-1 ${
                hasActiveKey
                  ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-300"
                  : "border-amber-400/35 bg-amber-400/10 text-amber-300"
              } ${appBody}`}
            >
              {hasActiveKey ? "Complete" : "Pending"}
            </span>
          </div>
        ) : null}
        {returnHref && setupStep === "api-key" && hasActiveKey ? (
          <p className={`mb-4 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-emerald-100 ${appBody}`}>
            API key step complete.{" "}
            <Link href={returnHref} className="font-semibold text-emerald-200 underline-offset-2 hover:underline">
              Continue setup wizard →
            </Link>
          </p>
        ) : null}
        <ApiKeysPanel
          initialKeys={initialKeys}
          serviceRoleConfigured={false}
          sessionScoped
          setupStep={setupStep}
          returnHref={returnHref}
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(apiKeysPathWithWizard)}`);
  }

  const { data: rows, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, created_at, last_used_at, revoked_at")
    .order("created_at", { ascending: false });

  const listError = error?.message;
  const initialKeys = (rows ?? []) as ApiKeyRow[];
  const hasActiveKey = initialKeys.some((k) => !k.revoked_at);
  const serviceRoleConfigured = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );

  return (
    <>
      <PageHeader
        title="API keys"
        description="Authenticate server-side jobs to the same-origin reasoning and robot proxies. Secrets are shown once at creation; only the key prefix is retained afterward."
      />
      <p className={`mb-6 max-w-2xl ${appBody}`}>
        <Link href="/docs/api#api-keys" className="font-medium text-accent hover:underline">
          API key documentation →
        </Link>
        {" · "}
        <Link href="/developers" className="font-medium text-accent hover:underline">
          Developer platform →
        </Link>
      </p>
      {returnHref ? (
        <p className={`mb-4 ${appBody}`}>
          <Link href={returnHref} className="font-medium text-accent hover:underline">
            ← Return to setup wizard
          </Link>
        </p>
      ) : null}
      {inSetupFlow ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 ${
              hasActiveKey
                ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-300"
                : "border-accent/35 bg-accent/10 text-accent"
            } ${appBody}`}
          >
            Guided setup: step {setupStepPosition} of 4
          </span>
          <span className={`rounded-full border border-white/[0.12] px-2.5 py-1 text-foreground/75 ${appBody}`}>
            {setupStepLabel}
          </span>
          <span
            className={`rounded-full border px-2.5 py-1 ${
              hasActiveKey
                ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-300"
                : "border-amber-400/35 bg-amber-400/10 text-amber-300"
            } ${appBody}`}
          >
            {hasActiveKey ? "Complete" : "Pending"}
          </span>
        </div>
      ) : null}
      {returnHref && setupStep === "api-key" && hasActiveKey ? (
        <p className={`mb-4 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-emerald-100 ${appBody}`}>
          API key step complete.{" "}
          <Link href={returnHref} className="font-semibold text-emerald-200 underline-offset-2 hover:underline">
            Continue setup wizard →
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
        setupStep={setupStep}
        returnHref={returnHref}
      />
    </>
  );
}
