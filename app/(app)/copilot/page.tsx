import type { Metadata } from "next";
import Link from "next/link";

import { ConnectionStatus } from "@/components/copilot/ConnectionStatus";
import { CopilotChat } from "@/components/copilot/CopilotChat";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";

export const metadata: Metadata = {
  title: "Incident Copilot",
  description: "AI-assisted triage and next steps with human oversight.",
};

export const dynamic = "force-dynamic";

export default function CopilotPage() {
  return (
    <>
      <PageHeader
        title="Incident Copilot"
        description="Natural-language investigations wired to your reasoning service. Suggested actions stay behind approval gates until you promote them."
      />
      <ConnectionStatus />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PlaceholderCard title="Conversation">
            <CopilotChat />
          </PlaceholderCard>
        </div>
        <PlaceholderCard title="Suggested actions">
          <ul className="space-y-3 text-sm text-muted">
            <li className="flex justify-between gap-2">
              <Link href="/approvals" className="text-foreground/90 hover:text-accent hover:underline">
                Dry-run rollback canary
              </Link>
              <span className="font-mono text-xs text-amber-400/90">approval</span>
            </li>
            <li className="flex justify-between gap-2">
              <Link href="/runbooks/api-latency" className="text-foreground/90 hover:text-accent hover:underline">
                API latency runbook
              </Link>
              <span className="font-mono text-xs text-accent">runbook</span>
            </li>
            <li className="flex justify-between gap-2">
              <Link href="/automations" className="text-foreground/90 hover:text-accent hover:underline">
                Playbook dry-runs
              </Link>
              <span className="font-mono text-xs text-accent">automate</span>
            </li>
          </ul>
        </PlaceholderCard>
      </div>
    </>
  );
}
