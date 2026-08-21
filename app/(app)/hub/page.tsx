import type { Metadata } from "next";
import Link from "next/link";
import { launchGuidedScenarioAction } from "./actions";

import { PageHeader } from "@/components/app/PageHeader";
import { ConsoleAmbientBanner } from "@/components/console/ConsoleAmbientBanner";
import { DashboardStats, QuickActions } from "@/components/console/DashboardStats";
import { HubOnboardingPanel } from "@/components/console/HubOnboardingPanel";
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
  let orgName: string | null = null;
  let hasOrganization = false;

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
        const org = await getOrgContextForUser(user.id);
        orgRole = org.role;
        orgName = org.orgName;
        hasOrganization = Boolean(org.orgId);
      }
    } catch {
      firstName = null;
      displayName = null;
      userId = null;
      orgName = null;
      hasOrganization = false;
    }
  }

  const signedIn = Boolean(displayName);
  const title = signedIn && firstName ? `Welcome back, ${firstName}` : "Welcome to Smohix";
  const guidedFlow = [
    "Service or alert opens incident",
    "Incident links runbooks and dry-runs",
    "Human approves high-risk change",
    "Guarded execution records evidence",
    "Audit and Copilot stay on the same thread",
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
      <PageHeader
        eyebrow="Home"
        title={title}
        description={
          signedIn
            ? "Your Smohix Platform workspace — health, setup, products, and where to continue."
            : "Core flows work without accounts. Sign in for organizations, shared history, and setup."
        }
      />
      <ConsoleAmbientBanner snapshot={ambient} />
      <HubOnboardingPanel
        orgName={orgName}
        orgRole={orgRole}
        hasOrganization={hasOrganization}
        signedIn={signedIn}
      />
      <section className="mt-6" aria-labelledby="hub-health-heading">
        <h2 id="hub-health-heading" className={appPanelTitle}>
          Workspace health
        </h2>
        <p className={`mt-1 ${appBody} text-muted`}>
          Active load across incidents, approvals, and plan status.
        </p>
        <DashboardStats userId={userId} />
      </section>
      <QuickActions />
      <section className="mt-6" aria-labelledby="hub-continue-heading">
        <h2 id="hub-continue-heading" className={appPanelTitle}>
          Continue working
        </h2>
        <p className={`mt-1 mb-3 ${appBody} text-muted`}>
          Personalized module shortcuts — pin what you use most.
        </p>
        <HubQuickLinksPanel
          quickLinks={hubPersonalization.quickLinks}
          pinnedHrefs={hubPersonalization.pinnedHrefs}
          availableModules={availableModules}
          canPersistServer={Boolean(userId && hasSupabaseAuth())}
          customized={hubPersonalization.customized}
        />
      </section>
      <section className="smohix-glass mt-6 rounded-2xl p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={appPanelTitle}>Demo scenario flow</h2>
              <span className={`rounded-md border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 font-semibold uppercase tracking-wide text-amber-200 ${appMeta}`}>
                Demo data
              </span>
            </div>
            <p className={`mt-1 ${appBody} text-muted`}>
              Seed a clearly labeled local scenario to evaluate the incident-to-approval evidence loop.
            </p>
          </div>
          <form action={launchGuidedScenarioAction}>
            <button
              type="submit"
              className={`inline-flex h-10 items-center justify-center rounded-xl bg-accent px-4 font-semibold text-background shadow-[0_0_28px_-8px_rgba(94,225,255,0.45)] transition-[opacity,box-shadow] hover:opacity-95 hover:shadow-[0_0_36px_-6px_rgba(94,225,255,0.55)] ${appBody}`}
            >
              Create demo scenario
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
        Automations, runbooks, approvals, audit, connectors, and the focused module rail stay above.{" "}
        <Link href="/vision" className="font-medium text-accent hover:underline">
          Vision & roadmap
        </Link>{" "}
        describes where the product is headed — from serious ops console to long-horizon autonomy.
      </p>
    </>
  );
}
