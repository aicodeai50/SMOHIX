import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/app/PageHeader";
import { listServicesForUser } from "@/lib/services/data";
import { createIncidentAction } from "../actions";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "New incident",
};

export const dynamic = "force-dynamic";

export default async function NewIncidentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  let services: Awaited<ReturnType<typeof listServicesForUser>> = [];
  if (hasSupabaseAuth()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/auth/sign-in?next=/incidents/new");
    }
    services = await listServicesForUser(user.id);
  }

  const { error } = await searchParams;

  return (
    <>
      <PageHeader
        title="New incident"
        description={
          hasSupabaseAuth()
            ? "Creates a row in your Supabase incidents table when the migration is applied."
            : "Creates a session-scoped incident for this browser. Connect Supabase for persistent, per-account incidents."
        }
      />
      {error ? (
        <p
          className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-200/90"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <form action={createIncidentAction} className="max-w-lg space-y-4">
        <div>
          <label htmlFor="title" className="mb-1.5 block text-xs font-medium text-muted">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            maxLength={500}
            placeholder="Short description for responders"
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none ring-ring/50 focus:ring-2"
          />
        </div>
        {hasSupabaseAuth() && services.length > 0 ? (
          <div>
            <label htmlFor="service_id" className="mb-1.5 block text-xs font-medium text-muted">
              Service (optional)
            </label>
            <select
              id="service_id"
              name="service_id"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none ring-ring/50 focus:ring-2"
              defaultValue=""
            >
              <option value="">— None —</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.environment ? ` (${s.environment})` : ""}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div>
          <label htmlFor="severity" className="mb-1.5 block text-xs font-medium text-muted">
            Severity
          </label>
          <select
            id="severity"
            name="severity"
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none ring-ring/50 focus:ring-2"
            defaultValue="medium"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label htmlFor="status" className="mb-1.5 block text-xs font-medium text-muted">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none ring-ring/50 focus:ring-2"
            defaultValue="investigating"
          >
            <option value="investigating">Investigating</option>
            <option value="mitigated">Mitigated</option>
            <option value="resolved">Resolved</option>
            <option value="monitoring">Monitoring</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-medium text-background hover:opacity-90"
          >
            Create incident
          </button>
          <Link
            href="/incidents"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-5 text-sm text-muted hover:text-foreground"
          >
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
