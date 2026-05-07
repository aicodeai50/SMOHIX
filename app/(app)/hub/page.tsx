import type { Metadata } from "next";
import Link from "next/link";
import { launchGuidedScenarioAction } from "./actions";

import { PageHeader } from "@/components/app/PageHeader";
import { getUserDisplayName, getUserFirstName } from "@/lib/auth/display-name";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { appBody, appMeta, appPanelTitle } from "@/lib/app-typography";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "Platform",
  description: `${SITE_BRAND_NAME} console — command center and modules.`,
};

export const dynamic = "force-dynamic";

const QUICK = [
  {
    href: "/overview",
    title: "Command center",
    blurb: "Incidents snapshot, connectors, and readiness.",
  },
  {
    href: "/incidents",
    title: "Incidents",
    blurb: "Open, resolve, and drill into timelines.",
  },
  {
    href: "/services",
    title: "Services",
    blurb: "Catalog systems and wire alert → incident ingest (paid).",
  },
  {
    href: "/copilot",
    title: "Copilot",
    blurb: "Triage with structured next steps.",
  },
] as const;

export default async function HubPage() {
  let firstName: string | null = null;
  let displayName: string | null = null;

  if (hasSupabaseAuth()) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      firstName = getUserFirstName(user);
      displayName = getUserDisplayName(user);
    } catch {
      firstName = null;
      displayName = null;
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

  return (
    <>
      <PageHeader eyebrow={SITE_BRAND_NAME} title={title} description={description} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {QUICK.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shynvo-glass group flex flex-col rounded-2xl p-5 transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_0_40px_-14px_rgba(94,225,255,0.2)]"
          >
            <h2 className={`${appPanelTitle} text-foreground group-hover:text-accent`}>{item.title}</h2>
            <p className={`mt-2 flex-1 ${appBody} text-muted`}>{item.blurb}</p>
            <span className={`mt-4 font-semibold text-accent/85 ${appMeta}`}>Open →</span>
          </Link>
        ))}
      </div>
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
