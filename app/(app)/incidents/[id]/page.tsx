import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { updateIncidentPostmortemAction, updateIncidentStatusAction } from "./actions";

import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { getIncidentForUser } from "@/lib/incidents/data";
import { getIncidentTimeline } from "@/lib/incidents/timeline";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Incident ${id}`,
  };
}

export default async function IncidentDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const err = typeof sp.error === "string" ? sp.error : undefined;

  let userId = "";
  let devTenantKey: string | null = null;
  if (hasSupabaseAuth()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect(`/auth/sign-in?next=/incidents/${encodeURIComponent(id)}`);
    }
    userId = user.id;
  } else {
    devTenantKey = (await cookies()).get("shynvo_dev_tid")?.value ?? "anon";
  }

  const resolved = await getIncidentForUser(userId, id, devTenantKey);
  if (!resolved) {
    notFound();
  }

  const { row, source } = resolved;

  const timeline = await getIncidentTimeline({
    source,
    userId,
    incidentId: id,
    devTenantKey,
  });

  return (
    <>
      {source === "session" ? (
        <p className="shynvo-glass-subtle mb-4 rounded-xl px-4 py-3 text-xs leading-relaxed text-muted">
          Session-scoped incident. The timeline below records opens and status changes from this
          browser session; connect Supabase and integrations for shared history and external
          events.
        </p>
      ) : (
        <p className="shynvo-glass-subtle mb-4 rounded-xl px-4 py-3 text-xs leading-relaxed text-muted">
          Timeline entries come from your <span className="font-mono">audit_log</span> (
          <span className="font-mono">incident.status_updated</span>) when the service role can
          append audits.
        </p>
      )}
      <PageHeader
        title={row.title}
        description={`${row.id} · ${row.severity} · ${row.status} · updated ${row.updated}${
          row.serviceName ? ` · ${row.serviceName}` : ""
        }`}
      />
      {source === "database" && row.serviceId ? (
        <p className="mb-4 text-sm text-muted">
          Linked service:{" "}
          <Link href="/services" className="font-medium text-accent hover:underline">
            {row.serviceName ?? "Open catalog"}
          </Link>
        </p>
      ) : null}
      {err ? (
        <p className="mb-4 rounded-xl border border-red-400/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-200/90 backdrop-blur-sm">
          {err}
        </p>
      ) : null}
      {(source === "database" && hasSupabaseAuth()) ||
      (source === "session" && !hasSupabaseAuth()) ? (
        <form
          action={updateIncidentStatusAction}
          className="shynvo-glass mb-6 flex flex-wrap items-end gap-3 rounded-2xl p-4 md:p-5"
        >
          <input type="hidden" name="id" value={row.id} />
          <div>
            <label htmlFor="status" className="mb-1 block text-xs font-medium text-muted">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={row.status}
              className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-foreground outline-none ring-accent/25 focus:border-accent/40 focus:ring-2"
            >
              <option value="investigating">Investigating</option>
              <option value="mitigated">Mitigated</option>
              <option value="resolved">Resolved</option>
              <option value="monitoring">Monitoring</option>
            </select>
          </div>
          <button
            type="submit"
            className="h-10 rounded-xl bg-accent px-5 text-sm font-semibold text-background shadow-[0_0_28px_-8px_rgba(94,225,255,0.45)] transition-[opacity,box-shadow] hover:opacity-95 hover:shadow-[0_0_36px_-6px_rgba(94,225,255,0.55)]"
          >
            Save status
          </button>
        </form>
      ) : null}
      {source === "database" && hasSupabaseAuth() ? (
        <PlaceholderCard title="Postmortem & notes">
          <form action={updateIncidentPostmortemAction} className="space-y-3">
            <input type="hidden" name="id" value={row.id} />
            <label htmlFor="postmortem" className="block text-xs font-medium text-muted">
              Blameless summary, timeline, root cause, action items
            </label>
            <textarea
              id="postmortem"
              name="postmortem"
              rows={10}
              maxLength={24000}
              defaultValue={row.postmortem ?? ""}
              placeholder="What happened, what we learned, what we will change…"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-foreground outline-none ring-accent/25 focus:border-accent/40 focus:ring-2"
            />
            <button
              type="submit"
              className="h-10 rounded-xl bg-accent px-5 text-sm font-semibold text-background hover:opacity-95"
            >
              Save notes
            </button>
          </form>
        </PlaceholderCard>
      ) : null}
      <PlaceholderCard title="Timeline">
        {timeline.length === 0 ? (
          <p className="text-sm leading-relaxed text-muted">
            {source === "database"
              ? "No status changes in audit yet. Updates appear here after each successful save (requires audit append in production)."
              : "No events recorded yet."}
          </p>
        ) : (
          <ul className="space-y-3 font-mono text-sm">
            {timeline.map((e, i) => (
              <li
                key={`${e.at}-${i}-${e.label.slice(0, 24)}`}
                className="flex gap-4 border-b border-white/[0.05] pb-3 last:border-0 last:pb-0"
              >
                <span className="shrink-0 text-xs text-muted">{e.at} UTC</span>
                <span className="text-foreground/90">{e.label}</span>
              </li>
            ))}
          </ul>
        )}
      </PlaceholderCard>
    </>
  );
}
