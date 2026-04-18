import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/app/PageHeader";
import { getRunbookBySlug } from "@/lib/runbooks/catalog";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = getRunbookBySlug(slug);
  return { title: r ? r.title : "Runbook" };
}

export default async function RunbookDetailPage({ params }: Props) {
  const { slug } = await params;
  const r = getRunbookBySlug(slug);
  if (!r) {
    notFound();
  }

  return (
    <>
      <div className="mb-6">
        <Link href="/runbooks" className="text-sm text-muted hover:text-foreground">
          ← Runbooks
        </Link>
      </div>
      <PageHeader
        title={r.title}
        description={`Version ${r.version} · ${r.steps} checklist steps`}
      />
      <div className="mt-6 space-y-6">
        <section className="rounded-xl border border-border bg-surface/80 p-5">
          <h2 className="text-sm font-semibold text-muted">Overview</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/90">{r.body}</p>
          <p className="mt-3 text-sm text-muted">{r.summary}</p>
        </section>
        <section className="rounded-xl border border-border bg-surface/80 p-5">
          <h2 className="text-sm font-semibold text-muted">Step checks</h2>
          <ol className="mt-4 space-y-4">
            {r.checklist.map((step, i) => (
              <li
                key={step.id}
                className="flex gap-4 rounded-lg border border-border/60 bg-background/40 p-4"
              >
                <span className="font-mono text-sm text-accent">{i + 1}</span>
                <div>
                  <p className="font-medium text-foreground">{step.title}</p>
                  <p className="mt-1 text-sm text-muted">{step.check}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
