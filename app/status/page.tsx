import type { Metadata } from "next";
import Link from "next/link";

import { RealStatusPanel } from "@/components/status/RealStatusPanel";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { fetchSiteHealthView } from "@/lib/status/adapters";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mArticle, mBody, mH1, mLinkInline, mPanelShell } from "@/lib/marketing-layout";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Status",
  description: "Real-time product and service status for Smohix Technologies — server-side health probes only.",
  path: "/status",
});

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const statusView = await fetchSiteHealthView();
  const ok = statusView?.ok === true;

  return (
    <>
      <Header />
      <main className="flex-1 border-b border-white/[0.06]">
        <div className={mArticle}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent/90">
            Service status
          </p>
          <h1 className={`mt-2 ${mH1}`}>Product &amp; service status</h1>
          <p className={`mt-4 ${mBody}`}>
            Server-side health probes against allowlisted public endpoints. We do not publish uptime
            percentages without stored historical data.
          </p>

          <div
            className={`mt-8 p-5 ${mPanelShell} ${
              ok
                ? "border-emerald-500/30 bg-emerald-500/[0.08]"
                : "border-amber-500/30 bg-amber-500/[0.08]"
            }`}
          >
            <p className="text-sm font-semibold text-foreground">
              {ok ? "smohix.run health endpoint operational" : "Health check failed or unreachable"}
            </p>
            <p className={`mt-2 ${mBody}`}>
              Canonical host: <span className="font-mono text-xs">{getSiteUrl()}</span>
            </p>
            {statusView ? (
              <pre className="mt-4 overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40 p-4 font-mono text-xs text-foreground/85">
                {JSON.stringify(statusView, null, 2)}
              </pre>
            ) : (
              <p className={`mt-4 ${mBody}`}>
                Could not reach{" "}
                <a href="/api/health" className="text-accent hover:underline">
                  /api/health
                </a>{" "}
                from this build.
              </p>
            )}
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
