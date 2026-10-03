import Link from "next/link";

import { SmohixHorizon } from "@/components/architecture";
import {
  mBody,
  mContainer,
  mEyebrow,
  mFocusRing,
  mH1,
  mLede,
  mLinkInline,
  mSection,
  mSystemMeta,
} from "@/lib/marketing-layout";
import { SITE_COMPANY_NAME } from "@/lib/site-brand";
import { SMOHIX_WORKSPACE_URLS } from "@/lib/ecosystem-workspaces";

export function PlatformHero() {
  return (
    <section className={`${mSection} smohix-platform-page-hero`}>
      <div className={mContainer}>
        <div className="smohix-platform-page-hero__opening">
          <SmohixHorizon className="max-w-md" />
          <p className={`mt-3 ${mSystemMeta} text-muted/75`}>
            {SITE_COMPANY_NAME} HQ · operating core
          </p>
        </div>
        <p className={`${mEyebrow} mt-8 text-accent/80`}>Platform</p>
        <h1 className={`mt-2 max-w-3xl ${mH1}`}>Run operations with clarity and control.</h1>
        <p className={mLede}>
          Bring incidents, service ownership, guarded automation, approvals, and audit evidence into one
          operating workspace. Understand what needs attention, review the next action, and keep people
          in control of execution.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/auth/sign-in?next=/hub" className={`inline-flex min-h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-background ${mFocusRing}`}>
            Sign in to Hub
          </Link>
          <Link href="#platform-operations" className={`inline-flex min-h-11 items-center rounded-lg border border-border px-5 text-sm font-semibold ${mFocusRing}`}>
            Explore capabilities
          </Link>
          <Link href="/docs" className={`inline-flex min-h-11 items-center rounded-lg border border-border px-5 text-sm font-semibold ${mFocusRing}`}>
            Documentation
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link href="/developers" className={mLinkInline}>
            Developers →
          </Link>
          <Link href="/docs/api" className={mLinkInline}>
            API reference →
          </Link>
          <Link href="/trust" className={mLinkInline}>
            Trust center →
          </Link>
          <Link href="/pilot" className={mLinkInline}>
            Pilot →
          </Link>
        </div>
        <p className={`mt-4 ${mBody}`}>
          Your organization’s records and controls are available after sign-in. Part of the{" "}
          <Link href="/products" className="font-medium text-accent hover:underline">
            Smohix product ecosystem
          </Link>
          . For general AI assistance, open{" "}
          <a
            href={SMOHIX_WORKSPACE_URLS.ai}
            className="font-medium text-accent hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Smohix AI ↗
          </a>{" "}
          .
        </p>
        <ol aria-label="Operational workflow" className="mt-10 grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
          {[
            ['01', 'Understand the signal', 'Connect an alert to a service, owner, and incident.'],
            ['02', 'Review the action', 'Use runbooks and dry-runs before requesting approval.'],
            ['03', 'Keep the evidence', 'Follow the decision and its execution in the audit trail.'],
          ].map(([number, title, description]) => <li key={number}>
            <span className={`${mSystemMeta} text-accent`}>{number}</span>
            <h2 className="mt-2 text-base font-semibold">{title}</h2>
            <p className={`mt-2 ${mBody}`}>{description}</p>
          </li>)}
        </ol>
      </div>
    </section>
  );
}
