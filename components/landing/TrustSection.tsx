import Link from "next/link";

import {
  mContainer,
  mH2,
  mLede,
  mPanelShell,
  mSection,
  mSectionEnter,
} from "@/lib/marketing-layout";

const links = [
  {
    href: "/audit",
    title: "Audit log",
    line: "Billing sync, API keys, approvals, and automation events in one append-only log.",
    action: "View",
    actionAria: "View audit log",
  },
  {
    href: "/approvals",
    title: "Approvals",
    line: "Review and record decisions before high-risk changes proceed.",
    action: "Open",
    actionAria: "Open approvals",
  },
  {
    href: "/settings",
    title: "Settings",
    line: "API keys, connectors, billing, and organization options.",
    action: "Configure",
    actionAria: "Open settings",
  },
] as const;

export function TrustSection() {
  return (
    <section id="trust" className={`${mSection} ${mSectionEnter}`}>
      <div className={mContainer}>
        <h2 className={mH2}>Governance and access</h2>
        <p className={mLede}>
          Evidence, authorization, and credentials — alongside the modules above, not bolted on as
          an afterthought.
        </p>

        <div className={`mt-8 overflow-hidden ${mPanelShell}`}>
          <ul className="divide-y divide-white/[0.06] px-6">
            {links.map((item) => (
              <li
                key={item.href}
                className="flex flex-col gap-2 py-4 first:pt-5 last:pb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
              >
                <div className="min-w-0 sm:flex-1">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{item.line}</p>
                </div>
                <Link
                  href={item.href}
                  aria-label={item.actionAria}
                  className="shrink-0 text-sm font-medium text-accent/95 underline-offset-4 hover:text-accent hover:underline"
                >
                  {item.action}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
