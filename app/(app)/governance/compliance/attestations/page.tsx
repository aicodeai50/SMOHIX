import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceControlTags } from "@/components/compliance/ComplianceControlTags";
import {
  assignControlAttestationAction,
  attestControlAction,
} from "./actions";
import { appBody, appLabel, appMeta, appOverline } from "@/lib/app-typography";
import {
  listAttestationTrailsForOrg,
  listControlAttestationBoard,
} from "@/lib/compliance/attestation/data";
import type { AttestationWorkflowStatus } from "@/lib/compliance/attestation/status";
import { getOrgContextForUser } from "@/lib/org/context";
import { listOrgMembers } from "@/lib/org/data";
import { canManageMembers, isReadOnlyAuditorRole } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Control attestations",
  description: "Owner assignments, due dates, and sign-off trails per SOC 2 and ISO 27001 control.",
};

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<AttestationWorkflowStatus, string> = {
  attested: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
  overdue: "border-danger/35 bg-danger-dim/40 text-danger",
  pending: "border-border bg-surface/40 text-muted",
};

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function ControlAttestationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; assigned?: string; attested?: string }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Control attestations"
          description="Sign in to manage control owners, due dates, and sign-off trails."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/attestations");
  }

  const sp = await searchParams;
  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = isReadOnlyAuditorRole(orgContext.role ?? "viewer");
  const canAdmin = orgContext.role ? canManageMembers(orgContext.role) : false;

  if (!orgContext.orgId) {
    return (
      <>
        <PageHeader title="Control attestations" description="Per-control owner and sign-off workflow." />
        <ConsoleEmptyState
          title="Organization required"
          description="Create or join an organization to assign control owners and record attestations."
          ctas={[{ href: "/settings/members", label: "Members & roles" }]}
        />
      </>
    );
  }

  const [board, members, trails] = await Promise.all([
    listControlAttestationBoard(user.id, orgContext.orgId, supabase),
    listOrgMembers(orgContext.orgId),
    listAttestationTrailsForOrg(orgContext.orgId, supabase),
  ]);

  const overdue = board.filter((r) => r.status === "overdue").length;
  const attested = board.filter((r) => r.status === "attested").length;
  const pending = board.filter((r) => r.status === "pending").length;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Control attestation workflows"
        description="Assign owners and due dates per control, link to audit evidence, and record sign-off with an append-only trail."
      />
      <p className={`-mt-4 mb-6 ${appBody}`}>
        <Link href="/governance/compliance" className="text-accent hover:underline">
          Compliance mapping
        </Link>
        {" · "}
        <Link href="/audit" className="text-accent hover:underline">
          Audit log
        </Link>
        {" · "}
        <Link href="/governance/compliance/type-ii" className="text-accent hover:underline">
          SOC 2 Type II
        </Link>
        {readOnly ? (
          <>
            {" · "}
            <span className="text-indigo-200">Auditor read-only</span>
          </>
        ) : null}
      </p>

      {sp.assigned === "1" ? (
        <p className={`mb-4 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.08] px-4 py-3 text-emerald-100/90 ${appBody}`}>
          Control assignment updated.
        </p>
      ) : null}
      {sp.attested === "1" ? (
        <p className={`mb-4 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.08] px-4 py-3 text-emerald-100/90 ${appBody}`}>
          Control attestation recorded.
        </p>
      ) : null}
      {sp.error ? (
        <p className={`mb-4 rounded-xl border border-danger/25 bg-danger-dim/50 px-4 py-3 text-danger ${appBody}`}>
          {decodeURIComponent(String(sp.error).replace(/\+/g, " "))}
        </p>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Attested</p>
          <p className={`mt-1 text-2xl font-semibold text-emerald-300 ${appBody}`}>{attested}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Pending</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{pending}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Overdue</p>
          <p className={`mt-1 text-2xl font-semibold text-danger ${appBody}`}>{overdue}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Controls tracked</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{board.length}</p>
        </div>
      </div>

      <PlaceholderCard title="Control attestation board">
        <div className="space-y-6">
          {board.map((row) => {
            const trail = trails.get(row.id) ?? [];
            const canAttest =
              !readOnly && (canAdmin || row.ownerUserId === user.id) && row.status !== "attested";
            const dueLocal = toDatetimeLocalValue(row.dueAt);

            return (
              <div
                key={row.id}
                className="rounded-xl border border-white/[0.08] bg-surface/20 px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <ComplianceControlTags
                      controls={[
                        {
                          id: row.control.id,
                          framework: row.control.framework,
                          ref: row.control.ref,
                        },
                      ]}
                      max={1}
                    />
                    <p className={`mt-1 font-medium text-foreground ${appBody}`}>{row.control.title}</p>
                    <p className={`${appMeta} text-muted`}>{row.control.domain}</p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLE[row.status]}`}
                  >
                    {row.status}
                  </span>
                </div>

                <dl className={`mt-3 grid gap-2 sm:grid-cols-3 ${appMeta} text-muted`}>
                  <div>
                    <dt className={appOverline}>Owner</dt>
                    <dd className="text-foreground">{row.ownerLabel ?? "Unassigned"}</dd>
                  </div>
                  <div>
                    <dt className={appOverline}>Due</dt>
                    <dd className="text-foreground">{new Date(row.dueAt).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className={appOverline}>Audit evidence (30d)</dt>
                    <dd>
                      <Link href={row.auditEvidenceHref} className="text-accent hover:underline">
                        {row.linkedAuditEvidenceCount} events
                      </Link>
                    </dd>
                  </div>
                </dl>

                {row.attestedAt ? (
                  <p className={`mt-2 ${appMeta} text-emerald-300`}>
                    Attested {new Date(row.attestedAt).toLocaleString()}
                    {row.attestationNote ? ` — ${row.attestationNote}` : ""}
                  </p>
                ) : null}

                {canAdmin && !readOnly ? (
                  <form action={assignControlAttestationAction} className="mt-4 flex flex-wrap items-end gap-3">
                    <input type="hidden" name="attestationId" value={row.id} />
                    <div>
                      <label className={appLabel} htmlFor={`owner-${row.id}`}>
                        Owner
                      </label>
                      <select
                        id={`owner-${row.id}`}
                        name="ownerUserId"
                        defaultValue={row.ownerUserId ?? ""}
                        className="mt-1 h-9 min-w-[12rem] rounded-lg border border-border bg-surface px-2 text-sm text-foreground"
                      >
                        <option value="">Unassigned</option>
                        {members.map((m) => (
                          <option key={m.userId} value={m.userId}>
                            {m.displayName ?? m.email ?? m.userId.slice(0, 8)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={appLabel} htmlFor={`due-${row.id}`}>
                        Due
                      </label>
                      <input
                        id={`due-${row.id}`}
                        name="dueAt"
                        type="datetime-local"
                        defaultValue={dueLocal}
                        required
                        className="mt-1 h-9 rounded-lg border border-border bg-surface px-2 text-sm text-foreground"
                      />
                    </div>
                    <button
                      type="submit"
                      className={`h-9 rounded-lg border border-accent/40 bg-accent/10 px-3 text-sm font-medium text-accent hover:bg-accent/15 ${appBody}`}
                    >
                      Save assignment
                    </button>
                  </form>
                ) : null}

                {canAttest ? (
                  <form action={attestControlAction} className="mt-3 flex flex-wrap items-end gap-3">
                    <input type="hidden" name="attestationId" value={row.id} />
                    <div className="min-w-[16rem] flex-1">
                      <label className={appLabel} htmlFor={`note-${row.id}`}>
                        Sign-off note (optional)
                      </label>
                      <input
                        id={`note-${row.id}`}
                        name="note"
                        type="text"
                        placeholder="Reviewed audit evidence for this control"
                        className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
                      />
                    </div>
                    <button
                      type="submit"
                      className={`h-9 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 text-sm font-medium text-emerald-200 hover:bg-emerald-400/15 ${appBody}`}
                    >
                      Attest control
                    </button>
                  </form>
                ) : null}

                {trail.length > 0 ? (
                  <details className="mt-4">
                    <summary className={`cursor-pointer ${appMeta} text-accent`}>
                      Sign-off trail ({trail.length})
                    </summary>
                    <ul className={`mt-2 space-y-2 ${appMeta}`}>
                      {trail.map((ev) => (
                        <li key={ev.id} className="rounded border border-white/[0.06] px-2 py-1.5">
                          <span className="font-mono text-foreground/80">{ev.eventType}</span>
                          {" · "}
                          <span className="text-muted">{new Date(ev.createdAt).toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </div>
            );
          })}
        </div>
      </PlaceholderCard>
    </>
  );
}
