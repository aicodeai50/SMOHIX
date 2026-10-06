import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/app/PageHeader";
import { RunbookChecklist } from "@/components/automations/RunbookChecklist";
import { appBody, appPanelTitle } from "@/lib/app-typography";
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
      <PageHeader
        title={r.title}
        description={`Version ${r.version} · ${r.steps} checklist steps`}
      />
      <div className="mt-6 space-y-6">
        <section className="rounded-xl border border-border bg-surface/80 p-5">
          <h2 className={`${appPanelTitle} text-muted`}>Overview</h2>
          <p className={`mt-3 text-foreground/90 ${appBody}`}>{r.body}</p>
          <p className={`mt-3 text-muted ${appBody}`}>{r.summary}</p>
        </section>
        <RunbookChecklist key={`${r.slug}-${r.version}`} steps={r.checklist} />
      </div>
    </>
  );
}
