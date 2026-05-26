import type { Metadata } from "next";
import Link from "next/link";

import { ConsoleAmbientBanner } from "@/components/console/ConsoleAmbientBanner";
import { ConnectionStatus } from "@/components/copilot/ConnectionStatus";
import { CopilotChat } from "@/components/copilot/CopilotChat";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { loadConsoleAmbientSnapshot } from "@/lib/console/load-ambient-status";
import { appBody, appMeta } from "@/lib/app-typography";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Incident Copilot",
  description: "AI-assisted triage and next steps with human oversight.",
};

export const dynamic = "force-dynamic";

export default async function CopilotPage() {
  let persistSession = false;
  if (hasSupabaseAuth()) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      persistSession = Boolean(user);
    } catch {
      persistSession = false;
    }
  }

  const ambient = await loadConsoleAmbientSnapshot({ context: "copilot" });

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Incident Copilot"
        description="Triage and next steps in plain language. Copilot drafts hypotheses, checks, and actions — you stay in control. Signed-in workspaces can keep conversation history when persistence is on."
      />
      <ConsoleAmbientBanner snapshot={ambient} />
      <ConnectionStatus />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PlaceholderCard title="Conversation">
            <CopilotChat persistSession={persistSession} />
          </PlaceholderCard>
        </div>
        <div className="space-y-4">
          <PlaceholderCard title="Shortcuts">
            <ul className={`space-y-1 ${appBody}`}>
              <li>
                <Link
                  href="/approvals"
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-foreground/90 transition-colors hover:bg-surface-elevated/60 hover:text-accent"
                >
                  <span className="font-medium">Dry-run rollback canary</span>
                  <span className={`shrink-0 rounded-md bg-warning-dim px-2 py-0.5 font-semibold uppercase tracking-wide text-warning ${appMeta}`}>
                    Approval
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/runbooks/api-latency"
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-foreground/90 transition-colors hover:bg-surface-elevated/60 hover:text-accent"
                >
                  <span className="font-medium">API latency runbook</span>
                  <span className={`shrink-0 rounded-md bg-accent-dim px-2 py-0.5 font-semibold uppercase tracking-wide text-accent ${appMeta}`}>
                    Runbook
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/automations"
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-foreground/90 transition-colors hover:bg-surface-elevated/60 hover:text-accent"
                >
                  <span className="font-medium">Playbook dry-runs</span>
                  <span className={`shrink-0 rounded-md bg-accent-dim px-2 py-0.5 font-semibold uppercase tracking-wide text-accent ${appMeta}`}>
                    Automate
                  </span>
                </Link>
              </li>
            </ul>
          </PlaceholderCard>
          <PlaceholderCard title="On the horizon">
            <p className={`text-muted ${appBody}`}>
              Annotation-grade Copilot: structured labels on hypotheses, human-in-the-loop
              approvals before actions, runbook citations on every suggestion, timeline
              auto-summaries, and an audit trail tying AI output to incidents and owners.
            </p>
          </PlaceholderCard>
        </div>
      </div>
    </>
  );
}
