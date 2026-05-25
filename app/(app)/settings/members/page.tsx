import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { appBody, appLabel, appMeta, appOverline } from "@/lib/app-typography";
import { getOrgContextForUser } from "@/lib/org/context";
import { listOrgMembers } from "@/lib/org/data";
import { canManageMembers, ORG_ROLES, roleLabel } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
  addOrganizationMemberAction,
  createOrganizationAction,
  removeOrganizationMemberAction,
  setActiveOrganizationAction,
  updateOrganizationMemberRoleAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Members & roles",
  description: "Organization members, delegated approvers, and security reviewer roles.",
};

export const dynamic = "force-dynamic";

const ASSIGNABLE_ROLES = ORG_ROLES.filter((r) => r !== "owner");

export default async function SettingsMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; member_added?: string }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Members & roles"
          description="Connect Supabase and sign in to create an organization and invite teammates."
        />
        <p className={`max-w-xl text-muted ${appBody}`}>Local mode does not support org RBAC.</p>
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/settings/members");
  }

  const sp = await searchParams;
  const err = typeof sp.error === "string" ? sp.error : undefined;
  const orgContext = await getOrgContextForUser(user.id);
  const members = orgContext.orgId ? await listOrgMembers(orgContext.orgId) : [];
  const canAdmin = orgContext.role ? canManageMembers(orgContext.role) : false;

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Members & roles"
        description="Shared workspaces with delegated approvers and security reviewers. Approvals and policy review respect org roles when an organization is active."
      />
      <p className={`-mt-4 mb-6 ${appBody}`}>
        <Link href="/settings" className="text-accent hover:underline">
          Settings hub
        </Link>
        {" · "}
        <Link href="/approvals" className="text-accent hover:underline">
          Approvals queue
        </Link>
      </p>

      {sp.created === "1" ? (
        <p className={`mb-4 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.08] px-4 py-3 text-emerald-100/90 ${appBody}`}>
          Organization created. You are the owner.
        </p>
      ) : null}
      {sp.member_added === "1" ? (
        <p className={`mb-4 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.08] px-4 py-3 text-emerald-100/90 ${appBody}`}>
          Member added.
        </p>
      ) : null}
      {err ? (
        <p className={`mb-4 rounded-xl border border-danger/25 bg-danger-dim/50 px-4 py-3 text-danger ${appBody}`}>
          {decodeURIComponent(err.replace(/\+/g, " "))}
        </p>
      ) : null}

      {orgContext.memberships.length === 0 ? (
        <PlaceholderCard title="Create organization">
          <p className={`mb-4 text-muted ${appBody}`}>
            Start a shared workspace to enable delegated approvers, security reviewers, and org-scoped
            approval queues.
          </p>
          <form action={createOrganizationAction} className="max-w-md space-y-3">
            <div>
              <label htmlFor="org-name" className={`mb-1 block ${appLabel}`}>
                Organization name
              </label>
              <input
                id="org-name"
                name="name"
                required
                maxLength={200}
                placeholder="Acme Security Operations"
                className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <button
              type="submit"
              className={`rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground ${appBody}`}
            >
              Create organization
            </button>
          </form>
        </PlaceholderCard>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Active org</p>
              <p className={`mt-1 font-semibold text-foreground ${appBody}`}>
                {orgContext.orgName ?? "—"}
              </p>
              <p className={`mt-1 text-muted ${appMeta}`}>
                Role: {orgContext.role ? roleLabel(orgContext.role) : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Members</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{members.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Your memberships</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {orgContext.memberships.length}
              </p>
            </div>
          </div>

          {orgContext.memberships.length > 1 ? (
            <PlaceholderCard title="Switch organization">
              <form action={setActiveOrganizationAction} className="flex flex-wrap gap-3">
                <select
                  name="org_id"
                  defaultValue={orgContext.orgId ?? undefined}
                  className={`h-10 min-w-[220px] rounded-lg border border-border bg-background px-3 ${appBody}`}
                >
                  {orgContext.memberships.map((m) => (
                    <option key={m.orgId} value={m.orgId}>
                      {m.orgName} ({roleLabel(m.role)})
                    </option>
                  ))}
                </select>
                <button type="submit" className={`rounded-lg border border-border px-4 py-2 ${appBody}`}>
                  Set active
                </button>
              </form>
            </PlaceholderCard>
          ) : null}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {canAdmin ? (
              <PlaceholderCard title="Invite member">
                <form action={addOrganizationMemberAction} className="space-y-3">
                  <div>
                    <label htmlFor="member-email" className={`mb-1 block ${appLabel}`}>
                      Email (must already have a Zentro account)
                    </label>
                    <input
                      id="member-email"
                      name="email"
                      type="email"
                      required
                      placeholder="teammate@company.com"
                      className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                    />
                  </div>
                  <div>
                    <label htmlFor="member-role" className={`mb-1 block ${appLabel}`}>
                      Role
                    </label>
                    <select
                      id="member-role"
                      name="role"
                      defaultValue="operator"
                      className={`h-10 w-full rounded-lg border border-border bg-background px-3 ${appBody}`}
                    >
                      {ASSIGNABLE_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {roleLabel(role)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className={`rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground ${appBody}`}
                  >
                    Add member
                  </button>
                </form>
                <p className={`mt-3 text-muted ${appMeta}`}>
                  Approver decides pending requests. Security reviewer handles high-risk (70+) and policy
                  review. Operator submits requests. Viewer is read-only.
                </p>
              </PlaceholderCard>
            ) : (
              <PlaceholderCard title="Member admin">
                <p className={`text-muted ${appBody}`}>
                  Only owners and admins can invite or change roles.
                </p>
              </PlaceholderCard>
            )}

            <PlaceholderCard title="Members">
              {members.length === 0 ? (
                <ConsoleEmptyState title="No members" description="Invite teammates to share approvals." />
              ) : (
                <ul className="divide-y divide-border">
                  {members.map((member) => (
                    <li key={member.userId} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className={`font-medium text-foreground ${appBody}`}>
                            {member.displayName ?? member.email ?? member.userId.slice(0, 8)}
                          </p>
                          <p className={`text-muted ${appMeta}`}>{member.email ?? member.userId}</p>
                        </div>
                        <span className={`text-xs uppercase tracking-wide text-accent ${appMeta}`}>
                          {roleLabel(member.role)}
                        </span>
                      </div>
                      {canAdmin && member.role !== "owner" ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <form action={updateOrganizationMemberRoleAction} className="flex gap-2">
                            <input type="hidden" name="member_user_id" value={member.userId} />
                            <select
                              name="role"
                              defaultValue={member.role}
                              className={`h-9 rounded-lg border border-border bg-background px-2 text-sm ${appBody}`}
                            >
                              {ASSIGNABLE_ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {roleLabel(role)}
                                </option>
                              ))}
                            </select>
                            <button
                              type="submit"
                              className={`rounded-lg border border-border px-3 py-1 text-sm ${appBody}`}
                            >
                              Update
                            </button>
                          </form>
                          {member.userId !== user.id ? (
                            <form action={removeOrganizationMemberAction}>
                              <input type="hidden" name="member_user_id" value={member.userId} />
                              <button
                                type="submit"
                                className={`rounded-lg border border-danger/30 px-3 py-1 text-sm text-danger ${appBody}`}
                              >
                                Remove
                              </button>
                            </form>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </PlaceholderCard>
          </div>
        </>
      )}
    </>
  );
}
