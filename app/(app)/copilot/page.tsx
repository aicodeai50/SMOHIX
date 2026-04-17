import type { Metadata } from "next";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";

export const metadata: Metadata = {
  title: "Incident Copilot",
  description: "AI-assisted triage and next steps with human oversight.",
};

export default function CopilotPage() {
  return (
    <>
      <PageHeader
        title="Incident Copilot"
        description="Natural-language investigations wired to your reasoning backend. Suggested actions stay behind approval gates until you promote them."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PlaceholderCard title="Conversation">
            <div className="space-y-4 font-mono text-sm text-muted">
              <p className="text-foreground/90">
                <span className="text-accent">You:</span> What changed before the API
                latency spike in prod?
              </p>
              <p>
                <span className="text-muted">Copilot:</span> Correlating deploys and
                SLOs… (connect sh-backend-api to enable live answers.)
              </p>
            </div>
            <div className="mt-6 flex gap-2">
              <input
                type="text"
                readOnly
                placeholder="Ask about an incident, service, or change window…"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted"
              />
              <button
                type="button"
                className="rounded-lg bg-accent px-4 text-sm font-medium text-background opacity-60"
                disabled
              >
                Send
              </button>
            </div>
          </PlaceholderCard>
        </div>
        <PlaceholderCard title="Suggested actions">
          <ul className="space-y-3 text-sm text-muted">
            <li className="flex justify-between gap-2">
              <span>Dry-run rollback canary</span>
              <span className="font-mono text-xs text-amber-400/90">approval</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>Open timeline for svc/api</span>
              <span className="font-mono text-xs text-accent">read</span>
            </li>
          </ul>
        </PlaceholderCard>
      </div>
    </>
  );
}
