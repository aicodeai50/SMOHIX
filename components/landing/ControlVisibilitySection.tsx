import Link from "next/link";

import {
  mBody,
  mCard,
  mCardTitle,
  mContainer,
  mH2,
  mLede,
  mSection,
  mSectionEnter,
  mStaggerGrid,
} from "@/lib/marketing-layout";

const ITEMS = [
  {
    title: "Incident snapshot",
    body: "Command center shows open vs resolved counts, severity mix, and recent rows — managers see posture without digging.",
    href: "/auth/sign-in?next=/overview",
  },
  {
    title: "Per-incident timeline",
    body: "Status and context updates flow into a single thread when audit append is configured — fewer scattered threads.",
    href: "/auth/sign-in?next=/incidents",
  },
  {
    title: "Automation history",
    body: "Dry-runs and approvals land in the same activity log as incidents — one timeline for reviewers.",
    href: "/auth/sign-in?next=/audit",
  },
  {
    title: "Operational metrics",
    body: "MTTR, automation success rate, and change dashboards are not shipped as first-class charts yet — snapshot counts today, deeper analytics on the roadmap.",
    href: "/integrations",
  },
] as const;

export function ControlVisibilitySection() {
  return (
    <section
      id="control"
      className={`${mSection} ${mSectionEnter}`}
      aria-labelledby="control-heading"
    >
      <div className={mContainer}>
        <h2 id="control-heading" className={mH2}>
          Control and visibility
        </h2>
        <p className={mLede}>
          We are not trying to replace your paging vendor on day one — we focus on the work after
          the page: safer change, clearer ownership, and evidence you can replay.
        </p>
        <ul className={`mt-10 grid gap-5 md:grid-cols-2 ${mStaggerGrid}`}>
          {ITEMS.map((item) => (
            <li key={item.title} className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6 ${mCard}`}>
              <div className="min-w-0">
                <h3 className={mCardTitle}>{item.title}</h3>
                <p className={`mt-2 ${mBody}`}>{item.body}</p>
              </div>
              <Link
                href={item.href}
                className="shrink-0 text-xs font-semibold text-accent hover:underline sm:pt-1"
              >
                Open in console →
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
