import Link from "next/link";

import { SmohixHorizon } from "@/components/architecture";
import { Button } from "@/components/ui/Button";
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
        <h1 className={`mt-2 ${mH1}`}>Platform overview — then Hub when you sign in</h1>
        <p className={mLede}>
          <strong className="font-medium text-foreground">/platform</strong> explains Smohix Platform
          capabilities. <strong className="font-medium text-foreground">/hub</strong> is the authenticated
          working console (incidents, automation, governance, settings). Same product — public overview
          versus signed-in workspace.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/auth/sign-in?next=/hub" className={mFocusRing}>
            <Button size="lg">Sign in to Hub</Button>
          </Link>
          <Link href="/products/smohix-platform" className={mFocusRing}>
            <Button size="lg" variant="secondary">
              Product overview
            </Button>
          </Link>
          <Link href="/docs" className={mFocusRing}>
            <Button size="lg" variant="secondary">
              Documentation
            </Button>
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
        <p className={`mt-4 ${mBody} text-muted/80`}>
          Operating core of the{" "}
          <Link href="/products" className="font-medium text-accent hover:underline">
            Smohix product ecosystem
          </Link>
          . Smohix AI lives at{" "}
          <a
            href={SMOHIX_WORKSPACE_URLS.ai}
            className="font-medium text-accent hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            ai.smohix.run
          </a>{" "}
          — a separate flagship product, not the same surface as Platform Copilot routes.
        </p>
      </div>
    </section>
  );
}
