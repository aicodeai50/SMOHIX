import type { Metadata } from "next";
import Link from "next/link";

import { ConsoleAmbientBanner } from "@/components/console/ConsoleAmbientBanner";
import { IntelligenceField, SmohixHorizon } from "@/components/architecture";
import { ConnectionStatus } from "@/components/copilot/ConnectionStatus";
import { CopilotChat } from "@/components/copilot/CopilotChat";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { loadConsoleAmbientSnapshot } from "@/lib/console/load-ambient-status";
import { appBody, appMeta } from "@/lib/app-typography";
import { getIncidentForUser } from "@/lib/incidents/data";
import { getOrgContextForUser } from "@/lib/org/context";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isIncidentUuid } from "@/lib/workflow/incident-links";

export const metadata: Metadata = {
  title: "Smohix Copilot",
  description: "AI-assisted triage and next steps with human oversight.",
};

export const dynamic = "force-dynamic";

const SUGGESTED_PROMPTS = [
  "What should I check first on a high-severity API latency incident?",
  "Summarize pending approvals that block automation.",
  "Which runbook fits a burn-budget warning?",
] as const;

export default async function CopilotPage({
  searchParams,
}: {
  searchParams?: Promise<{ incident?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const incidentRaw = typeof sp.incident === "string" ? sp.incident.trim() : "";
  const incidentId = isIncidentUuid(incidentRaw) ? incidentRaw.toLowerCase() : "";
  let persistSession = false;
  let incidentTitle: string | null = null;
  let incidentMeta: string | null = null;
  if (hasSupabaseAuth()) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      persistSession = Boolean(user);
      if (user && incidentId) {
        const org = await getOrgContextForUser(user.id);
        const resolved = await getIncidentForUser(user.id, incidentId, null, org.orgId);
        if (resolved?.row) {
          incidentTitle = resolved.row.title;
          const parts = [
            resolved.row.severity,
            resolved.row.status,
            resolved.row.serviceName ?? null,
          ].filter(Boolean);
          incidentMeta = parts.join(" · ");
        }
      }
    } catch {
      persistSession = false;
    }
  }

  const ambient = await loadConsoleAmbientSnapshot({ context: "copilot" });

  return (
    <>
      <PageHeader
        eyebrow="Intelligence"
        title="Smohix Copilot"
        description="Ask about incidents, services, changes, runbooks, and operational risk. Copilot drafts hypotheses and next steps — you stay in control."
        actions={
          <Link
            href="/settings/connectors"
            className={`inline-flex h-10 items-center justify-center rounded-xl border border-white/[0.12] px-4 font-medium text-muted transition-colors hover:border-accent/35 hover:text-foreground ${appMeta}`}
          >
            Configure Copilot
          </Link>
        }
      />
      <ConsoleAmbientBanner snapshot={ambient} />
      <div className="relative mb-5 overflow-hidden rounded-lg">
        <IntelligenceField className="opacity-50" animate={false} withNodes />
        <div className="relative px-1 py-3">
          <SmohixHorizon />
          <p className="mt-2 font-mono text-[10px] tracking-[0.16em] text-muted/65">
            CONTEXT · CONVERSATION · HUMAN AUTHORITY
          </p>
        </div>
      </div>
      <div className="smohix-intelligence-workspace grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <ConsolePanel title="Conversation">
            {incidentId ? (
              <div className={`mb-4 rounded-lg border border-accent/25 bg-accent-dim/40 px-3 py-2 text-accent ${appMeta}`}>
                <p className="font-medium text-foreground">Incident context attached</p>
                <p className="mt-1">
                  {incidentTitle ?? "Scoped conversation"}
                  {incidentMeta ? (
                    <span className="text-muted"> · {incidentMeta}</span>
                  ) : null}
                </p>
                <Link
                  href={`/incidents/${encodeURIComponent(incidentId)}`}
                  className="mt-1 inline-block font-medium underline-offset-2 hover:underline"
                >
                  Open incident →
                </Link>
              </div>
            ) : null}
            <CopilotChat persistSession={persistSession} incidentId={incidentId || null} />
          </ConsolePanel>
          <ConnectionStatus />
        </div>
        <div className="space-y-4">
          <ConsolePanel title="Suggested prompts">
            <ul className={`space-y-2 ${appBody}`}>
              {SUGGESTED_PROMPTS.map((prompt) => (
                <li
                  key={prompt}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-muted"
                >
                  {prompt}
                </li>
              ))}
            </ul>
          </ConsolePanel>
          <ConsolePanel title="Shortcuts">
            <ul className={`space-y-1 ${appBody}`}>
              <li>
                <Link
                  href="/approvals"
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-foreground/90 transition-colors hover:bg-surface-elevated/60 hover:text-accent"
                >
                  <span className="font-medium">Pending approvals</span>
                  <span className={`shrink-0 rounded-md bg-warning-dim px-2 py-0.5 font-semibold uppercase tracking-wide text-warning ${appMeta}`}>
                    Review
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/runbooks"
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-foreground/90 transition-colors hover:bg-surface-elevated/60 hover:text-accent"
                >
                  <span className="font-medium">Runbooks</span>
                  <span className={`shrink-0 rounded-md bg-accent-dim px-2 py-0.5 font-semibold uppercase tracking-wide text-accent ${appMeta}`}>
                    Browse
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/automations"
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-foreground/90 transition-colors hover:bg-surface-elevated/60 hover:text-accent"
                >
                  <span className="font-medium">Automations</span>
                  <span className={`shrink-0 rounded-md bg-accent-dim px-2 py-0.5 font-semibold uppercase tracking-wide text-accent ${appMeta}`}>
                    Dry-run
                  </span>
                </Link>
              </li>
            </ul>
          </ConsolePanel>
        </div>
      </div>
    </>
  );
}
