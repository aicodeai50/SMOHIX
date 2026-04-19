import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Status",
  description: "Shynvo API health check for the configured deployment.",
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

  return (
    <>
      <Header />
      <main className="flex-1 border-b border-white/[0.06]">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Service status
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Lightweight signal from <code className="font-mono text-xs text-accent/90">GET /api/health</code> on
            the canonical deployment (<span className="font-mono text-xs">{getSiteUrl()}</span>). This is not a
            full incident history page — it answers &ldquo;is the web tier up?&rdquo;
          </p>

          <div
            className={`mt-8 rounded-2xl border p-6 ${
              ok
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-amber-500/30 bg-amber-500/10"
            }`}
          >
            <p className="text-sm font-semibold text-foreground">
              {ok ? "Operational" : "Check failed or unreachable"}
            </p>
            {health ? (
              <pre className="mt-4 overflow-x-auto rounded-lg bg-black/40 p-3 font-mono text-xs text-foreground/85">
                {JSON.stringify(health, null, 2)}
              </pre>
            ) : (
              <p className="mt-4 text-sm text-muted">
                Could not reach the health endpoint from this server build. Try{" "}
                <a href="/api/health" className="text-accent hover:underline">
                  /api/health
                </a>{" "}
                in the browser on the same host you are testing.
              </p>
            )}
          </div>

          <p className="mt-10 text-sm text-muted">
            Maintenance windows and dependency incidents will move to a richer status system as the
            product matures. For now, see also{" "}
            <Link href="/changelog" className="font-medium text-accent hover:underline">
              Changelog
            </Link>
            .
          </p>
          <p className="mt-6 text-sm">
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
