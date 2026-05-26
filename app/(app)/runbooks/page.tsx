import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app/PageHeader";
import { ConsoleAmbientBanner } from "@/components/console/ConsoleAmbientBanner";
import { appBody, appMeta, appPanelTitle } from "@/lib/app-typography";
import { loadConsoleAmbientSnapshot } from "@/lib/console/load-ambient-status";
import { listRunbooks } from "@/lib/runbooks/catalog";

export const metadata: Metadata = {
  title: "Runbooks",
  description: "Versioned operational procedures.",
};

export const dynamic = "force-dynamic";

export default async function RunbooksIndexPage() {
  const [books, ambient] = await Promise.all([
    Promise.resolve(listRunbooks()),
    loadConsoleAmbientSnapshot({ context: "runbooks" }),
  ]);

  return (
    <>
      <PageHeader
        title="Runbook intelligence"
        description="Living procedures with version labels and step-level checks. Stored in-repo for now — wire to your doc store or Git when you connect backends."
      />
      <ConsoleAmbientBanner snapshot={ambient} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {books.map((b) => (
          <Link
            key={b.slug}
            href={`/runbooks/${b.slug}`}
            className="rounded-xl border border-border bg-surface/80 p-5 transition-colors hover:border-accent/40 hover:bg-surface-elevated/50"
          >
            <p className={`font-mono uppercase tracking-wide ${appMeta}`}>
              v{b.version} · {b.steps} steps
            </p>
            <h2 className={`mt-2 ${appPanelTitle}`}>{b.title}</h2>
            <p className={`mt-2 text-muted ${appBody}`}>{b.summary}</p>
            <span className={`mt-4 inline-block font-medium text-accent ${appBody}`}>Open →</span>
          </Link>
        ))}
      </div>
    </>
  );
}
