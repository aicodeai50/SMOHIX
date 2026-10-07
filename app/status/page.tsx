import type { Metadata } from "next";
import Link from "next/link";

import { SmohixHorizon, SystemLabel } from "@/components/architecture";
import { RealStatusPanel } from "@/components/status/RealStatusPanel";
import { AssuranceRail } from "@/components/trust/AssuranceRail";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { fetchSiteHealthView } from "@/lib/status/adapters";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mArticle, mBody, mH1, mLinkInline, mPanelShell, mSystemMeta } from "@/lib/marketing-layout";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Status",
  description: "Current product and service availability for Smohix Technologies.",
  path: "/status",
});

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const statusView = await fetchSiteHealthView();
  const ok = statusView?.ok === true;

  return (
    <>
      <Header />
      <main className="smohix-trust-authority flex-1 border-b border-white/[0.06]">
        <div className={mArticle}>
          <SmohixHorizon className="max-w-md" />
          <p className={`mt-3 ${mSystemMeta} text-muted/70`}>
            Current service availability
          </p>
          <SystemLabel className="mt-6">Service status</SystemLabel>
          <h1 className={`mt-2 ${mH1}`}>Product &amp; service status</h1>
          <p className={`mt-4 ${mBody}`}>
            Current availability across the Smohix ecosystem. Individual features may have separate availability.
          </p>
          <div className="mt-6">
            <AssuranceRail active="status" />
          </div>

          <div
            className={`mt-8 p-5 ${mPanelShell} ${
              ok
                ? "border-emerald-500/30 bg-emerald-500/[0.08]"
                : "border-amber-500/30 bg-amber-500/[0.08]"
            }`}
          >
            <p className="text-sm font-semibold text-foreground">
              {ok ? "Smohix HQ is available" : "Smohix HQ availability could not be confirmed"}
            </p>
            <p className={`mt-2 ${mBody}`}>
              {ok ? "The latest service check completed successfully." : "Please try again shortly for an updated status."}
            </p>
          </div>

          <section className="mt-10" aria-labelledby="products-status-heading">
            <h2 id="products-status-heading" className="text-xl font-semibold text-foreground">
              Products
            </h2>
            <div className="mt-6">
              <RealStatusPanel />
            </div>
          </section>

          <p className={`mt-10 ${mBody}`}>
            <Link href="/security" className={mLinkInline}>
              Security →
            </Link>
            {" · "}
            <Link href="/trust" className={mLinkInline}>
              Trust →
            </Link>
            {" · "}
            <Link href="/products" className={mLinkInline}>
              Product Access →
            </Link>
            {" · "}
            <Link href="/changelog" className={mLinkInline}>
              Changelog →
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
