import type { Metadata } from "next";
import { PageHeader } from "@/components/app/PageHeader";

export const metadata: Metadata = {
  title: "Approvals",
  description: "Pending and recent approval decisions.",
};

const pending = [
  {
    id: "apr-882",
    action: "Scale API tier — prod",
    requestedBy: "oncall@team",
    policy: "two-person · prod",
  },
];

export default function ApprovalsPage() {
  return (
    <>
      <PageHeader
        title="Approvals"
        description="Human-in-the-loop gates for destructive or high-blast-radius changes. Decisions are written to the audit log."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <h2 className="text-sm font-semibold text-amber-200/90">Pending</h2>
          <ul className="mt-4 space-y-4">
            {pending.map((p) => (
              <li
                key={p.id}
                className="rounded-lg border border-border bg-background/60 p-4"
              >
                <p className="font-mono text-xs text-muted">{p.id}</p>
                <p className="mt-1 text-sm font-medium text-foreground">{p.action}</p>
                <p className="mt-1 text-xs text-muted">
                  {p.requestedBy} · {p.policy}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-md bg-emerald-600/90 py-2 text-xs font-medium text-white opacity-70"
                    disabled
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-md border border-border py-2 text-xs font-medium text-muted"
                    disabled
                  >
                    Deny
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-border bg-surface/80 p-5">
          <h2 className="text-sm font-semibold text-muted">Recent</h2>
          <p className="mt-4 text-sm text-muted">
            No completed approvals in this demo. Connect your policy engine and
            identity provider to populate this feed.
          </p>
        </section>
      </div>
    </>
  );
}
