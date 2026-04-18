import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app/PageHeader";
import { getBillingPlanForUser } from "@/lib/billing/plan";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Automations",
  description: "Playbooks and execution via your automation service.",
};

export const dynamic = "force-dynamic";

const rows = [
  {
    name: "Restart stuck workers",
    env: "staging",
    lastRun: "ok · 3m ago",
    risk: "low",
  },
  {
    name: "Scale API tier",
    env: "production",
    lastRun: "dry-run",
    risk: "high",
  },
];

export default async function AutomationsPage() {
  let showUpgrade = false;
  if (hasSupabaseAuth()) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const plan = await getBillingPlanForUser(supabase, user.id);
        showUpgrade = plan === "free";
      }
    } catch {
      // Auth client unavailable — show page without billing banner.
    }
  }

  return (
    <>
      <PageHeader
        title="Automations"
        description="Workflows executed by your automation service with policy checks. High-risk steps require approvals from the Approvals view."
      />
      {showUpgrade ? (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-surface-elevated/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            <span className="font-medium text-foreground">Free plan.</span> Upgrade to unlock paid
            automation features when you are ready.
          </p>
          <Link
            href="/settings/billing"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-background hover:opacity-90"
          >
            Billing & upgrade
          </Link>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface/80 font-mono text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Playbook</th>
              <th className="px-4 py-3">Environment</th>
              <th className="px-4 py-3">Last run</th>
              <th className="px-4 py-3">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.name} className="hover:bg-surface-elevated/40">
                <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                <td className="px-4 py-3 capitalize text-muted">{row.env}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted">{row.lastRun}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      row.risk === "high"
                        ? "text-amber-400/90"
                        : "text-emerald-400/90"
                    }
                  >
                    {row.risk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
