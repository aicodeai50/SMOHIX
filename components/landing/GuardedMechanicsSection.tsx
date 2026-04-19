import Link from "next/link";

import { mCard, mContainer, mH2, mLede, mSection } from "@/lib/marketing-layout";

const MECHANICS = [
  {
    title: "Dry-run mode",
    status: "In console",
    body: "Run playbooks in simulation first so responders see intent and blast radius before any production call.",
    href: "/auth/sign-in?next=/automations",
  },
  {
    title: "Approval gates",
    status: "In console",
    body: "Record an explicit decision before high-risk automation proceeds — not a Slack thread that disappears.",
    href: "/auth/sign-in?next=/approvals",
  },
  {
    title: "Execution & activity log",
    status: "In console",
    body: "Status changes, ingest, keys, billing sync, and automation-related events in one append-oriented trail.",
    href: "/auth/sign-in?next=/audit",
  },
  {
    title: "Incidents & timeline",
    status: "In console",
    body: "Open incidents, attach owner and runbook, update status; timeline reflects audit when append is enabled.",
    href: "/auth/sign-in?next=/incidents",
  },
  {
    title: "Team roles beyond owner",
    status: "Roadmap",
    body: "Today isolation is per Supabase user with RLS; delegated approvers and scoped roles are planned next.",
    href: "/integrations",
  },
  {
    title: "Policy DSL & automatic rollback",
    status: "Roadmap",
    body: "Flows are opinionated today; configurable policies and automated rollback hooks ship as the stack matures.",
    href: "/integrations",
  },
] as const;

export function GuardedMechanicsSection() {
  return (
    <section id="guarded-mechanics" className={mSection} aria-labelledby="guarded-heading">
      <div className={mContainer}>
        <h2 id="guarded-heading" className={mH2}>
          Guarded automation — the mechanics
        </h2>
        <p className={mLede}>
          Every line here maps to a console screen or a labeled roadmap item. We do not claim
          PagerDuty-scale paging or ServiceNow ITSM — we claim a safety layer for change you
          trigger from this console.
        </p>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MECHANICS.map((m) => (
            <li key={m.title} className={`flex flex-col ${mCard}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">{m.title}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    m.status === "In console"
                      ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300/95"
                      : "border border-white/[0.12] bg-white/[0.04] text-muted"
                  }`}
                >
                  {m.status}
                </span>
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{m.body}</p>
              <Link
                href={m.href}
                className="mt-4 text-xs font-semibold text-accent hover:underline"
              >
                {m.status === "Roadmap" ? "See roadmap →" : "Open in console →"}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
