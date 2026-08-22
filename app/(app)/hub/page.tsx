import type { Metadata } from "next";
import Link from "next/link";
import { launchGuidedScenarioAction } from "./actions";

import { CommandSection, CoordinateDivider, SmohixHorizon, SmohixSurface } from "@/components/architecture";
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
import { appBody, appMeta, appPanelTitle, appSignal } from "@/lib/app-typography";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "Platform",
  description: `${SITE_BRAND_NAME} console — command environment and modules.`,
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
        eyebrow="Command environment"
        title={title}
        description={
          signedIn
            ? "System state, attention, and next actions — your Smohix operating workspace."
            : "Core flows work without accounts. Sign in for organizations, shared history, and setup."
        }
      />

      <div className="smohix-hub-command">
        <div className="smohix-hub-command__status smohix-hub-command__band">
          <ConsoleAmbientBanner snapshot={ambient} />
          <div className="mt-4 max-w-xl">
            <SmohixHorizon />
            <p className={`mt-2 ${appSignal} text-muted/70`}>
              STATE · ATTENTION · OPERATIONS · INTELLIGENCE · NEXT ACTIONS
            </p>
          </div>
          <HubOnboardingPanel
            orgName={orgName}
            orgRole={orgRole}
            hasOrganization={hasOrganization}
            signedIn={signedIn}
          />
        </div>

        <div className="smohix-hub-command__primary smohix-hub-command__band">
          <CommandSection
            id="hub-health"
            title="System state"
            description="Active load across incidents, approvals, and plan status."
          >
            <DashboardStats userId={userId} />
          </CommandSection>
        </div>

        <div className="smohix-hub-command__side smohix-hub-command__band">
          <CommandSection
            id="hub-continue"
            title="Operations rail"
            description="Personalized module shortcuts — pin what you use most."
          >
            <HubQuickLinksPanel
              quickLinks={hubPersonalization.quickLinks}
              pinnedHrefs={hubPersonalization.pinnedHrefs}
              availableModules={availableModules}
              canPersistServer={Boolean(userId && hasSupabaseAuth())}
              customized={hubPersonalization.customized}
            />
          </CommandSection>
        </div>

        <div className="smohix-hub-command__actions smohix-hub-command__band">
          <CommandSection id="hub-actions" title="Next actions" description="Where to continue operating.">
            <QuickActions />
          </CommandSection>
        </div>

        <div className="smohix-hub-command__full">
          <CoordinateDivider />
          <SmohixSurface tone="aware" className="mt-2 p-5 md:p-6" as="section">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className={appPanelTitle}>Demo scenario flow</h2>
                  <span
                    className={`rounded-md border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 font-semibold uppercase tracking-wide text-amber-200 ${appMeta}`}
                  >
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
                  className={`inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 font-semibold text-background shadow-[0_0_24px_-10px_rgba(16,185,129,0.45)] transition-opacity hover:opacity-95 ${appBody}`}
                >
                  Create demo scenario
                </button>
              </form>
            </div>
            <ol className={`mt-4 list-inside list-decimal space-y-1 ${appMeta}`}>
              {guidedFlow.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </SmohixSurface>

          <p className={`mt-8 max-w-2xl text-pretty ${appBody} text-muted`}>
            Operational path:{" "}
            <Link href="/services" className="font-medium text-accent hover:underline">
              Services
            </Link>
            {" → "}
            incidents → runbooks → automations → approvals → Copilot → audit.{" "}
            <Link href="/vision" className="font-medium text-accent hover:underline">
              Vision & roadmap
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
