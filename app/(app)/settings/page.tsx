import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app/PageHeader";
import { appBody, appMeta, appPanelTitle } from "@/lib/app-typography";
import { getConnectorHealthRows } from "@/lib/connectors-health";
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
  {
    href: "/assets/certificates",
    title: "Certificates",
    description: "Certificate inventory with expiry and ownership tracking.",
  },
  {
    href: "/assets/secrets",
    title: "Secrets",
    description: "Secret rotation metadata and governance visibility.",
  },
  {
    href: "/assets/network",
    title: "Network assets",
    description: "Routers, firewalls, switches, and firmware posture.",
  },
  {
    href: "/resilience/backups",
    title: "Backup readiness",
    description: "Backup policy inventory with recovery targets.",
  },
  {
    href: "/governance/access",
    title: "Access posture",
    description: "MFA and privileged-account governance snapshots.",
  },
  {
    href: "/changes",
    title: "Change calendar",
    description: "Maintenance windows and action execution log.",
  },
] as const;

export default async function SettingsIndexPage({
  searchParams,
}: {
  searchParams?: Promise<{ setup_check?: string; setup_done?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const setupCheckRequested = sp.setup_check === "1";
  const setupDoneHint = typeof sp.setup_done === "string" ? sp.setup_done.trim().toLowerCase() : "";
  const completedStepKey =
    setupDoneHint === "api-key" || setupDoneHint === "ingest-token" || setupDoneHint === "connectors"
      ? setupDoneHint
      : null;
  let accountEmail: string | null = null;
  let initialFullName = "";
  let hasApiKey = false;
  let hasIngestToken = false;
  let connectorsConfigured = 0;
  let connectorsReachable = 0;
  let setupMode: "supabase" | "session" = "session";

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
      if (user?.id) {
        setupMode = "supabase";
        const [connectorRows, { count: apiKeysCount }, { count: ingestCount }] =
          await Promise.all([
            getConnectorHealthRows(),
            supabase
              .from("api_keys")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id)
              .is("revoked_at", null),
            supabase
              .from("alert_ingest_tokens")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id)
              .is("revoked_at", null),
          ]);
        hasApiKey = (apiKeysCount ?? 0) > 0;
        hasIngestToken = (ingestCount ?? 0) > 0;
        connectorsConfigured = connectorRows.filter((c) => Boolean(c.baseUrl)).length;
        connectorsReachable = connectorRows.filter((c) => c.ok === true).length;
      }
    } catch {
      accountEmail = null;
      initialFullName = "";
    }
  }

  const setupSteps = [
    {
      key: "profile",
      done: Boolean(initialFullName.trim() || accountEmail),
      title: "Set your operator profile",
      detail: "Add a display name so ownership and audit activity are easy to scan.",
      href: "#profile-settings",
      cta: "Complete profile",
    },
    {
      key: "api-key",
      done: hasApiKey,
      title: "Create your first API key",
      detail: "Use keys for automation and external tool calls into your workspace.",
      href: "/settings/api-keys?setup_step=api-key&next=/settings%3Fsetup_check%3D1%26setup_done%3Dapi-key%23setup-wizard#api-key-create",
      cta: "Create API key",
    },
    {
      key: "ingest-token",
      done: hasIngestToken,
      title: "Create alert ingest token",
      detail: "Enable monitoring tools to open or dedupe incidents through ingest.",
      href: "/settings/connectors?setup_step=ingest-token&next=/settings%3Fsetup_check%3D1%26setup_done%3Dingest-token%23setup-wizard#ingest-token-setup",
      cta: "Set up ingest",
    },
    {
      key: "connectors",
      done: connectorsConfigured > 0,
      title: "Configure at least one connector",
      detail: "Attach reasoning or automation endpoints for live run coverage.",
      href: "/settings/connectors?setup_step=connectors&next=/settings%3Fsetup_check%3D1%26setup_done%3Dconnectors%23setup-wizard#connectors-health",
      cta: "Configure connectors",
    },
  ] as const;
  const setupComplete = setupSteps.filter((s) => s.done).length;
  const nextStep = setupSteps.find((s) => !s.done) ?? null;
  const progressPercent = Math.round((setupComplete / setupSteps.length) * 100);
  const remainingSteps = setupSteps.length - setupComplete;
  const estimatedMinutesRemaining = remainingSteps * 2;
  const blockingHelp = setupSteps
    .filter((s) => !s.done)
    .map((s) => {
      if (s.key === "profile") {
        return {
          key: s.key,
          title: "Profile step pending",
          detail: "Set your display name so ownership and audit entries are instantly recognizable.",
          href: "#profile-settings",
          cta: "Open profile",
        };
      }
      if (s.key === "api-key") {
        return {
          key: s.key,
          title: "API key step pending",
          detail: "No active API key found. Create one key for scripts or automation callers.",
          href: "/settings/api-keys#api-key-create",
          cta: "Open API keys",
        };
      }
      if (s.key === "ingest-token") {
        return {
          key: s.key,
          title: "Ingest token step pending",
          detail: "No active alert ingest token found. Create one in Connectors and run a test event.",
          href: "/settings/connectors#ingest-token-setup",
          cta: "Open Connectors",
        };
      }
      return {
        key: s.key,
        title: "Connector setup pending",
        detail:
          "No connector endpoints are configured or reachable. Add at least one connector URL and run a setup check.",
        href: "/settings/connectors#connectors-health",
        cta: "Configure connector",
      };
    });
  const setupReport = [
    "# Shynvo Setup Readiness",
    "",
    `Progress: ${setupComplete}/${setupSteps.length} (${progressPercent}%)`,
    `Data source: ${setupMode === "supabase" ? "live Supabase workspace state" : "session mode (local/dev)"}`,
    "",
    "## Steps",
    ...setupSteps.map((s) => `- [${s.done ? "x" : " "}] ${s.title}`),
    ...(blockingHelp.length > 0
      ? [
          "",
          "## Current blockers",
          ...blockingHelp.map((b) => `- ${b.title}: ${b.detail}`),
        ]
      : ["", "## Current blockers", "- None"]),
    "",
    `Generated: ${new Date().toISOString()}`,
  ].join("\n");
  const setupReportHref = `data:text/markdown;charset=utf-8,${encodeURIComponent(setupReport)}`;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Billing and service links for this workspace. Runbooks and audit live under their own modules in the rail."
      />
      <section id="setup-wizard" className="shynvo-glass mb-6 rounded-2xl p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={`${appPanelTitle} text-foreground/95`}>First-run setup wizard</h2>
            <p className={`mt-1 ${appMeta}`}>
              Complete the minimum setup path to run incidents, ingest, and automation safely.
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              setupComplete === setupSteps.length
                ? "border-success/40 bg-success-dim/40 text-success"
                : "border-amber-400/35 bg-amber-400/10 text-amber-300"
            }`}
          >
            {setupComplete} / {setupSteps.length} complete
          </span>
        </div>
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className={`mt-2 ${appMeta}`}>
            {progressPercent}% complete ·{" "}
            {remainingSteps > 0
              ? `~${estimatedMinutesRemaining} min remaining`
              : "ready for operations"}
          </p>
        </div>
        <div className="sticky top-2 z-10 mt-3 rounded-xl border border-white/[0.08] bg-background/80 px-3 py-2 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border border-accent/35 bg-accent/10 px-2.5 py-1 text-accent ${appMeta}`}>
                Setup progress: {setupComplete}/{setupSteps.length}
              </span>
              {nextStep ? (
                <span className={`rounded-full border border-amber-400/35 bg-amber-400/10 px-2.5 py-1 text-amber-300 ${appMeta}`}>
                  Next: {nextStep.title}
                </span>
              ) : (
                <span className={`rounded-full border border-success/35 bg-success-dim/40 px-2.5 py-1 text-success ${appMeta}`}>
                  All steps complete
                </span>
              )}
            </div>
            {nextStep ? (
              <Link
                href={nextStep.href}
                className={`rounded-lg border border-accent/45 bg-accent/20 px-3 py-1.5 font-medium text-accent transition-colors hover:border-accent/70 hover:bg-accent/30 ${appBody}`}
              >
                Continue
              </Link>
            ) : (
              <Link
                href="#setup-wizard"
                className={`rounded-lg border border-white/[0.14] px-3 py-1.5 font-medium text-foreground/80 transition-colors hover:border-accent/35 hover:text-foreground ${appBody}`}
              >
                Review checklist
              </Link>
            )}
          </div>
        </div>
        {nextStep ? (
          <div className="mt-3">
            <Link
              href={nextStep.href}
              className={`rounded-lg border border-accent/45 bg-accent/15 px-3 py-1.5 font-medium text-accent transition-colors hover:border-accent/70 hover:bg-accent/25 ${appBody}`}
            >
              Start guided setup
            </Link>
          </div>
        ) : null}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {setupSteps.map((step) => (
            <Link
              key={step.key}
              href={step.href}
              className={`rounded-xl border bg-black/20 p-4 transition-colors hover:border-accent/35 ${
                completedStepKey === step.key
                  ? "border-emerald-400/35 ring-1 ring-emerald-400/30"
                  : "border-white/[0.08]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className={`${appBody} font-medium text-foreground/90`}>{step.title}</p>
                <div className="flex items-center gap-2">
                  {completedStepKey === step.key ? (
                    <span className="rounded-full border border-emerald-400/35 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                      Just completed
                    </span>
                  ) : null}
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      step.done
                        ? "border-success/40 bg-success-dim/40 text-success"
                        : "border-amber-400/35 bg-amber-400/10 text-amber-300"
                    }`}
                  >
                    {step.done ? "Done" : "Pending"}
                  </span>
                </div>
              </div>
              <p className={`mt-2 ${appMeta}`}>{step.detail}</p>
              {!step.done ? (
                <span className={`mt-3 inline-block font-medium text-accent ${appBody}`}>{step.cta} →</span>
              ) : null}
            </Link>
          ))}
        </div>
        {setupDoneHint ? (
          <div className="mt-4 rounded-xl border border-success/35 bg-success-dim/40 p-4">
            <p className={`${appBody} font-medium text-success`}>
              Step completed:{" "}
              {setupDoneHint === "api-key"
                ? "API key created"
                : setupDoneHint === "ingest-token"
                  ? "ingest setup updated"
                  : setupDoneHint === "connectors"
                    ? "connector setup updated"
                    : "setup updated"}
              . Wizard progress refreshed.
            </p>
          </div>
        ) : null}
        {nextStep ? (
          <div className="mt-4 rounded-xl border border-accent/35 bg-accent/10 p-4">
            <p className={`${appMeta} uppercase tracking-wide text-accent/90`}>Next recommended step</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className={`${appBody} font-medium text-foreground/90`}>{nextStep.title}</p>
              <Link
                href={nextStep.href}
                className={`rounded-lg border border-accent/45 bg-accent/20 px-3 py-1.5 font-medium text-accent transition-colors hover:border-accent/70 hover:bg-accent/30 ${appBody}`}
              >
                {nextStep.cta}
              </Link>
            </div>
            <p className={`mt-1 ${appMeta}`}>{nextStep.detail}</p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-success/35 bg-success-dim/40 p-4">
            <p className={`${appBody} font-medium text-success`}>Setup complete. Your workspace is ready.</p>
          </div>
        )}
        <p className={`mt-4 ${appMeta}`}>
          Data source: {setupMode === "supabase" ? "live Supabase workspace state" : "session mode (local/dev)"}.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link
            href="/settings?setup_check=1#setup-wizard"
            className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
          >
            Run setup check now
          </Link>
          <a
            href={setupReportHref}
            download="shynvo-setup-readiness.md"
            className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
          >
            Download setup report
          </a>
          {setupMode === "supabase" ? (
            <span className={appMeta}>
              Connectors reachable: <span className="font-semibold text-foreground/85">{connectorsReachable}</span>{" "}
              / {connectorsConfigured}
            </span>
          ) : null}
          {setupCheckRequested ? (
            <span className="rounded-full border border-success/35 bg-success-dim/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
              Check refreshed
            </span>
          ) : null}
        </div>
        {blockingHelp.length > 0 ? (
          <details className="mt-4 rounded-xl border border-white/[0.08] bg-black/20 p-4">
            <summary className={`cursor-pointer text-foreground/80 ${appBody}`}>
              What&apos;s blocking setup?
            </summary>
            <div className="mt-3 space-y-3">
              {blockingHelp.map((item) => (
                <div key={item.key} className="rounded-lg border border-white/[0.08] bg-black/25 p-3">
                  <p className={`${appBody} font-medium text-foreground/90`}>{item.title}</p>
                  <p className={`mt-1 ${appMeta}`}>{item.detail}</p>
                  <Link href={item.href} className={`mt-2 inline-block font-medium text-accent ${appBody}`}>
                    {item.cta} →
                  </Link>
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </section>
      {accountEmail ? (
        <section id="profile-settings" className="shynvo-glass mb-6 rounded-2xl p-5 md:p-6">
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
