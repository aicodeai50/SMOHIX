import type { Metadata } from "next";
import Link from "next/link";
import { launchGuidedScenarioAction } from "./actions";

import { PageHeader } from "@/components/app/PageHeader";
import { ConsoleAmbientBanner } from "@/components/console/ConsoleAmbientBanner";
import { HubQuickLinksPanel } from "@/components/console/HubQuickLinksPanel";
import { getUserDisplayName, getUserFirstName } from "@/lib/auth/display-name";
import { buildHubPersonalizationState } from "@/lib/console/hub-personalization";
import { loadHubPersonalizationPrefs } from "@/lib/console/hub-personalization-db";
import { loadConsoleAmbientSnapshot } from "@/lib/console/load-ambient-status";
import { CONSOLE_MODULES } from "@/lib/console-nav";
import { filterConsoleModulesForRole } from "@/lib/org/auditor-workspace";
import { getOrgContextForUser } from "@/lib/org/context";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { appBody, appMeta, appPanelTitle } from "@/lib/app-typography";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "Platform",
  description: `${SITE_BRAND_NAME} console — command center and modules.`,
};

export const dynamic = "force-dynamic";

export default async function HubPage() {
  let firstName: string | null = null;
  let displayName: string | null = null;
  let userId: string | null = null;
  let orgRole = null as import("@/lib/org/roles").OrgRole | null;

  if (hasSupabaseAuth()) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      firstName = getUserFirstName(user);
      displayName = getUserDisplayName(user);
      userId = user?.id ?? null;
      if (user) {
        orgRole = (await getOrgContextForUser(user.id)).role;
      }
    } catch {
      firstName = null;
      displayName = null;
      userId = null;
    }
  }

  const signedIn = Boolean(displayName);
  const title = signedIn && firstName ? `Welcome, ${firstName}` : "Platform";
  const description = signedIn
    ? "Your workspace is live. Start with the essentials below — the rail above reaches every module without repeating it here."
    : "Core flows work without accounts. Add organization sign-in when you want shared sessions, billing, and durable history.";
  const guidedFlow = [
    "Alert opens incident",
    "System proposes guarded action",
    "Human approves high-risk change",
    "Dry-run executes with evidence",
    "Audit timeline captures proof",
  ];

  const ambient = await loadConsoleAmbientSnapshot();

  let hubPrefsRaw = null as Awaited<ReturnType<typeof loadHubPersonalizationPrefs>> | null;
  if (userId && hasSupabaseAuth()) {
    try {
      const supabase = await createServerSupabaseClient();
      hubPrefsRaw = await loadHubPersonalizationPrefs(supabase, userId, orgRole);
    } catch {
      hubPrefsRaw = null;
    }
  }

  const hubPersonalization = buildHubPersonalizationState(hubPrefsRaw, orgRole);
  const availableModules = filterConsoleModulesForRole(CONSOLE_MODULES, orgRole)
    .filter((m) => m.href !== "/hub")
    .map((m) => ({ href: m.href, label: m.label, description: m.description }));

  return (
    <>
      <PageHeader eyebrow={SITE_BRAND_NAME} title={title} description={description} />
      <ConsoleAmbientBanner snapshot={ambient} />
      <HubQuickLinksPanel
        quickLinks={hubPersonalization.quickLinks}
        pinnedHrefs={hubPersonalization.pinnedHrefs}
        availableModules={availableModules}
        canPersistServer={Boolean(userId && hasSupabaseAuth())}
        customized={hubPersonalization.customized}
      />
      <section className="shynvo-glass mt-6 rounded-2xl p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={appPanelTitle}>Guided scenario flow</h2>
            <p className={`mt-1 ${appBody} text-muted`}>
              Seed a realistic incident-to-approval evidence scenario in one click.
            </p>
          </div>
          <form action={launchGuidedScenarioAction}>
            <button
              type="submit"
              className={`inline-flex h-10 items-center justify-center rounded-xl bg-accent px-4 font-semibold text-background shadow-[0_0_28px_-8px_rgba(94,225,255,0.45)] transition-[opacity,box-shadow] hover:opacity-95 hover:shadow-[0_0_36px_-6px_rgba(94,225,255,0.55)] ${appBody}`}
            >
              Run guided scenario
            </button>
          </form>
        </div>
        <ol className={`mt-3 list-inside list-decimal space-y-1 ${appMeta}`}>
          {guidedFlow.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
      <p className={`mt-6 max-w-2xl text-pretty ${appBody} text-muted`}>
        Automations, runbooks, approvals, audit, billing, connectors, and the full module rail stay
        above — one navigation surface, no duplicate module grids.{" "}
        <Link href="/vision" className="font-medium text-accent hover:underline">
          Vision & roadmap
        </Link>{" "}
        describes where the product is headed — from serious ops console to long-horizon autonomy.
      </p>
    </>
  );
}
