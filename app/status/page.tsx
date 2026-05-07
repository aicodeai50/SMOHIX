import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { mArticle, mBody, mH1, mPanelShell } from "@/lib/marketing-layout";
import { SITE_BRAND_NAME } from "@/lib/site-brand";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Status",
  description: `${SITE_BRAND_NAME} API health check for the configured deployment.`,
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

async function fetchHealth(): Promise<Record<string, unknown> | null> {
  const base = getSiteUrl();
  try {
    const res = await fetch(`${base}/api/health`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export default async function StatusPage() {
  const health = await fetchHealth();
  const ok = health?.ok === true;
  const statusView = health
    ? {
        ok: health.ok === true,
        service: typeof health.service === "string" ? health.service : "zentro-web",
        uptime_s:
          typeof health.uptime_s === "number" && Number.isFinite(health.uptime_s)
            ? Math.max(0, Math.round(health.uptime_s))
            : null,
      }
    : null;

  return (
    <>
      <Header />
      <main className="flex-1 border-b border-white/[0.06]">
        <div className={mArticle}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent/90">
            {SITE_BRAND_NAME}
          </p>
          <h1 className={`mt-2 ${mH1}`}>Service status</h1>
          <p className={`mt-4 ${mBody}`}>
            Lightweight signal from <code className="font-mono text-xs text-accent/90">GET /api/health</code> on
            the canonical deployment (<span className="font-mono text-xs">{getSiteUrl()}</span>). This is not a
            full incident history page — it answers &ldquo;is the web tier up?&rdquo;
          </p>

          <div
            className={`mt-8 overflow-hidden p-6 ${mPanelShell} ${
              ok
                ? "border-emerald-500/30 bg-emerald-500/[0.08]"
                : "border-amber-500/30 bg-amber-500/[0.08]"
            }`}
          >
            <p className="text-sm font-semibold text-foreground">
              {ok ? "Operational" : "Check failed or unreachable"}
            </p>
            {statusView ? (
              <pre className="mt-4 overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40 p-4 font-mono text-xs text-foreground/85">
                {JSON.stringify(statusView, null, 2)}
              </pre>
            ) : (
              <p className={`mt-4 ${mBody}`}>
                Could not reach the health endpoint from this server build. Try{" "}
                <a href="/api/health" className="text-accent hover:underline">
                  /api/health
                </a>{" "}
                in the browser on the same host you are testing.
              </p>
            )}
          </div>

          <p className={`mt-10 ${mBody}`}>
            Maintenance windows and dependency incidents will move to a richer status system as the
            product matures. For now, see also{" "}
            <Link href="/changelog" className="font-medium text-accent hover:underline">
              Changelog
            </Link>
            .
          </p>
          <p className={`mt-6 ${mBody}`}>
            <Link href="/" className="font-medium text-accent hover:underline">
              ← Home
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
