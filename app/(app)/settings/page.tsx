import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app/PageHeader";
import { appBody, appMeta, appPanelTitle } from "@/lib/app-typography";
import { ProfileNameForm } from "@/components/settings/ProfileNameForm";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Settings",
  description: "Billing, connectors, and workspace configuration.",
};

const cards = [
  {
    href: "/vision",
    title: "Vision & roadmap",
    description: "Product direction from ops console to long-horizon autonomy (in-app + docs).",
  },
  {
    href: "/settings/billing",
    title: "Billing",
    description: "Plan, checkout, and subscription status for this workspace.",
  },
  {
    href: "/settings/api-keys",
    title: "API keys",
    description: "Keys for automation and integrations calling your deployment.",
  },
  {
    href: "/settings/connectors",
    title: "Connectors",
    description: "Reasoning and automation endpoints plus health checks.",
  },
  {
    href: "/services",
    title: "Services",
    description: "Service catalog and monitoring webhook ingest (subscription).",
  },
] as const;

export default async function SettingsIndexPage() {
  let accountEmail: string | null = null;
  let initialFullName = "";

  if (hasSupabaseAuth()) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      accountEmail = user?.email ?? null;
      const meta = user?.user_metadata;
      if (meta && typeof meta.full_name === "string") {
        initialFullName = meta.full_name;
      }
    } catch {
      accountEmail = null;
      initialFullName = "";
    }
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Billing and service links for this workspace. Runbooks and audit live under their own modules in the rail."
      />
      {accountEmail ? (
        <section className="shynvo-glass mb-6 rounded-2xl p-5 md:p-6">
          <h2 className={`${appPanelTitle} text-foreground/95`}>Profile</h2>
          <p className={`mt-1 ${appMeta}`}>
            Your display name appears in the console rail. Clear the field to fall back to your email.
          </p>
          <ProfileNameForm initialFullName={initialFullName} email={accountEmail} />
        </section>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="shynvo-glass group flex flex-col rounded-2xl p-5 transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_0_40px_-14px_rgba(94,225,255,0.2)]"
          >
            <h2 className={`${appPanelTitle} group-hover:text-accent`}>{c.title}</h2>
            <p className={`mt-2 flex-1 text-muted ${appBody}`}>{c.description}</p>
            <span className={`mt-4 font-medium text-accent ${appBody}`}>Open →</span>
          </Link>
        ))}
      </div>
    </>
  );
}
