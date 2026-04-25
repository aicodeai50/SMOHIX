import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/app/PageHeader";
import { appBody, appMeta, appOverline, appPanelTitle } from "@/lib/app-typography";
import { listPolicySuggestionsForUser } from "@/lib/approvals/policy-suggestions";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { reviewPolicySuggestionAction } from "./actions";

export const metadata: Metadata = {
  title: "Policy review",
  description: "Review and decide decision-intelligence policy suggestions.",
};

export const dynamic = "force-dynamic";

export default async function GovernancePoliciesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          eyebrow="Governance"
          title="Policy review"
          description="Sign in with Supabase to review and persist policy suggestions."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/policies");
  }

  const sp = await searchParams;
  const statusRaw = typeof sp.status === "string" ? sp.status.trim().toLowerCase() : "proposed";
  const status = ["all", "proposed", "reviewed", "accepted", "rejected"].includes(statusRaw)
    ? (statusRaw as "all" | "proposed" | "reviewed" | "accepted" | "rejected")
    : "proposed";
  const suggestions = await listPolicySuggestionsForUser(supabase, user.id, status);

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Policy suggestion review"
        description="Decision intelligence proposes candidate policy promotions. Review and accept or reject with notes."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {(["proposed", "reviewed", "accepted", "rejected", "all"] as const).map((s) => (
          <a
            key={s}
            href={s === "proposed" ? "/governance/policies" : `/governance/policies?status=${s}`}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              s === status
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-white/[0.14] text-foreground/75 hover:border-accent/35 hover:text-foreground"
            }`}
          >
            {s}
          </a>
        ))}
      </div>
      <section className="shynvo-glass rounded-2xl p-5 md:p-6">
        <h2 className={appPanelTitle}>Suggestions</h2>
        {suggestions.length === 0 ? (
          <p className={`mt-3 ${appBody} text-muted`}>No suggestions for this filter.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {suggestions.map((s) => (
              <li key={s.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className={`${appBody} font-medium text-foreground/90`}>{s.label}</p>
                  <span className={`rounded-full border border-white/[0.12] px-2 py-0.5 ${appMeta}`}>
                    {s.status}
                  </span>
                </div>
                <p className={`mt-1 ${appMeta}`}>
                  Playbook: {s.playbookId} · Confidence: {s.confidenceScore}
                </p>
                <p className={`mt-2 ${appBody} text-muted`}>{s.reason}</p>
                {s.guardrails.length ? (
                  <div className="mt-2">
                    <p className={appOverline}>Guardrails</p>
                    <ul className={`mt-1 list-inside list-disc space-y-1 ${appMeta}`}>
                      {s.guardrails.map((g) => (
                        <li key={g}>{g}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {s.status === "proposed" || s.status === "reviewed" ? (
                  <form action={reviewPolicySuggestionAction} className="mt-3 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={s.id} />
                    <input
                      name="notes"
                      maxLength={280}
                      placeholder="Reviewer notes"
                      className={`h-9 min-w-[14rem] flex-1 rounded-lg border border-white/[0.1] bg-white/[0.02] px-3 text-foreground ${appMeta}`}
                    />
                    <button
                      type="submit"
                      name="decision"
                      value="accepted"
                      className={`h-9 rounded-lg border border-emerald-400/40 bg-emerald-500/[0.12] px-3 font-medium text-emerald-200 ${appMeta}`}
                    >
                      Accept
                    </button>
                    <button
                      type="submit"
                      name="decision"
                      value="rejected"
                      className={`h-9 rounded-lg border border-danger/40 bg-danger-dim/30 px-3 font-medium text-danger ${appMeta}`}
                    >
                      Reject
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
