import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app/PageHeader";
import { listRunbooks } from "@/lib/runbooks/catalog";

export const metadata: Metadata = {
  title: "Runbooks",
  description: "Versioned operational procedures.",
};

export default function RunbooksIndexPage() {
  const books = listRunbooks();

  return (
    <>
      <PageHeader
        title="Runbook intelligence"
        description="Living procedures with version labels and step-level checks. Stored in-repo for now — wire to your doc store or Git when you connect backends."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {books.map((b) => (
          <Link
            key={b.slug}
            href={`/runbooks/${b.slug}`}
            className="rounded-xl border border-border bg-surface/80 p-5 transition-colors hover:border-accent/40 hover:bg-surface-elevated/50"
          >
            <p className="font-mono text-[10px] uppercase tracking-wide text-muted">
              v{b.version} · {b.steps} steps
            </p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">{b.title}</h2>
            <p className="mt-2 text-sm text-muted">{b.summary}</p>
            <span className="mt-4 inline-block text-sm font-medium text-accent">Open →</span>
          </Link>
        ))}
      </div>
    </>
  );
}
