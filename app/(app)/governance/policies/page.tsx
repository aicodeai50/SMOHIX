import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/app/PageHeader";
import { appBody, appMeta, appOverline, appPanelTitle } from "@/lib/app-typography";
import {
  policyBlockReasonLabel,
  type PolicyBlockReasonCode,
} from "@/lib/approvals/policy-block-reasons";
import {
  listAcceptedPolicyGuardrailsByPlaybook,
  listPolicySuggestionsForUser,
} from "@/lib/approvals/policy-suggestions";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { PolicyBlockAnalyticsPanel } from "./PolicyBlockAnalyticsPanel";
import { PolicyReviewerNotesField } from "./PolicyReviewerNotesField";
import { reviewPolicySuggestionAction } from "./actions";

export const metadata: Metadata = {
  title: "Policy review",
  description: "Review and decide decision-intelligence policy suggestions.",
};

export const dynamic = "force-dynamic";

export default async function GovernancePoliciesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    error?: string;
    sid?: string;
    notes?: string;
    seed_reason?: string;
    seed_note?: string;
  }>;
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
  const acceptedGuardrailsByPlaybook = await listAcceptedPolicyGuardrailsByPlaybook(supabase, user.id);
  const errorCode = typeof sp.error === "string" ? sp.error.trim().toLowerCase() : "";
  const failedSuggestionId = typeof sp.sid === "string" ? sp.sid.trim() : "";
  const failedNotes = typeof sp.notes === "string" ? sp.notes : "";
  const seedReasonRaw = typeof sp.seed_reason === "string" ? sp.seed_reason.trim().toLowerCase() : "";
  const seedReason = (
    ["dry_run_fresh_required", "change_window_required", "blast_radius_exceeded", "unknown"].includes(
      seedReasonRaw,
    )
      ? seedReasonRaw
      : "unknown"
  ) as PolicyBlockReasonCode;
  const seedNote = typeof sp.seed_note === "string" ? sp.seed_note.trim() : "";

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Policy suggestion review"
        description="Decision intelligence proposes candidate guardrails. Review, annotate, and accept or reject each recommendation. Accepted policies map to SOC 2 / ISO 27001 controls."
      />
      <p className={`-mt-4 mb-4 ${appBody}`}>
        <Link href="/governance/compliance" className="text-accent hover:underline">
          Compliance control mapping
        </Link>
      </p>
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
      {errorCode === "invalid_max_blast" ? (
        <p className={`mb-4 rounded-xl border border-danger/45 bg-danger-dim/35 px-4 py-3 ${appMeta} text-danger`}>
          Could not accept policy suggestion: invalid max blast scope. Use{" "}
          <span className="font-mono text-danger">max-blast: service|cluster|region|global</span>.
        </p>
      ) : null}
      {errorCode === "not_found" ? (
        <p className={`mb-4 rounded-xl border border-danger/45 bg-danger-dim/35 px-4 py-3 ${appMeta} text-danger`}>
          Could not update policy suggestion. It may have already been reviewed or is no longer available.
        </p>
      ) : null}
      {seedNote ? (
        <p className={`mb-4 rounded-xl border border-accent/30 bg-accent/[0.08] px-4 py-3 ${appMeta} text-foreground/90`}>
          Recommended from policy-block trend ({policyBlockReasonLabel(seedReason)}):{" "}
          <span className="font-mono text-foreground/95">{seedNote}</span>
        </p>
      ) : null}
      <PolicyBlockAnalyticsPanel />
      <section className="shynvo-glass rounded-2xl p-5 md:p-6">
        <h2 className={appPanelTitle}>Suggestions</h2>
        {suggestions.length === 0 ? (
          <p className={`mt-3 ${appBody} text-muted`}>No suggestions for this filter.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {suggestions.map((s, index) => (
              <li key={s.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                {(() => {
                  const effective = acceptedGuardrailsByPlaybook[s.playbookId];
                  const chips: string[] = [];
                  if (effective?.requireDryRunFresh) chips.push("fresh dry-run");
                  if (effective?.requireChangeWindow) chips.push("change window");
                  if (effective?.maxBlastRadius) chips.push(`max blast: ${effective.maxBlastRadius}`);
                  if (chips.length === 0) return null;
                  return (
                    <p className={`mb-2 rounded-md border border-accent/20 bg-accent/[0.07] px-2.5 py-1.5 ${appMeta}`}>
                      Effective enforcement: {chips.join(" · ")}
                    </p>
                  );
                })()}
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
                    <PolicyReviewerNotesField
                      fieldId={s.id}
                      initialValue={
                        errorCode === "invalid_max_blast" && failedSuggestionId === s.id
                          ? failedNotes
                          : seedNote && index === 0 && (s.status === "proposed" || s.status === "reviewed")
                            ? seedNote
                            : ""
                      }
                      clearValidationParamsOnEdit={
                        errorCode === "invalid_max_blast" && failedSuggestionId === s.id
                      }
                      className={`h-9 min-w-[14rem] flex-1 rounded-lg border border-white/[0.1] bg-white/[0.02] px-3 text-foreground ${appMeta}`}
                      helperClassName={appMeta}
                      acceptButtonClassName={`h-9 rounded-lg border border-emerald-400/40 bg-emerald-500/[0.12] px-3 font-medium text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50 ${appMeta}`}
                      rejectButtonClassName={`h-9 rounded-lg border border-danger/40 bg-danger-dim/30 px-3 font-medium text-danger ${appMeta}`}
                    />
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
