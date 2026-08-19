import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { appBody, appLabel, appMeta } from "@/lib/app-typography";
import { ASSESSOR_API_KEY_PREFIX } from "@/lib/api-keys/token";
import { listComplianceAssessorApiTokens } from "@/lib/compliance/assessor-api-token";
import { ASSESSOR_API_RESOURCES } from "@/lib/compliance/assessor-api-serve";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { createAssessorApiTokenAction, revokeAssessorApiTokenAction } from "./actions";

export const metadata: Metadata = {
  title: "Assessor API tokens",
  description: "Org-scoped read-only API keys for external auditors to pull live compliance exports.",
};

export const dynamic = "force-dynamic";

export default async function AssessorApiPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    created?: string;
    revoked?: string;
    key?: string;
    id?: string;
  }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Assessor API"
          description="Sign in to issue org-scoped assessor API tokens."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/assessor-api");
  }

  const sp = await searchParams;
  const orgContext = await getOrgContextForUser(user.id);
  const canEdit = orgContext.role ? canManageMembers(orgContext.role) : false;
  const tokens = orgContext.orgId
    ? await listComplianceAssessorApiTokens(orgContext.orgId, supabase)
    : [];

  const err = typeof sp.error === "string" ? sp.error : undefined;
  const siteUrl = (process.env.SMOHIX_SITE_URL ?? process.env.ZENTRO_SITE_URL)?.replace(/\/$/, "") ?? "https://smohix.run";

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Assessor-scoped compliance API"
        description="Issue read-only tokens (smohix_ca_*) for external auditors. Tokens call live export builders against your org audit_log and policies — same data as the console, without full UI access."
      />
      <p className={`-mt-4 mb-6 ${appBody}`}>
        <Link href="/governance/compliance/bundles" className="text-accent hover:underline">
          Evidence bundles
        </Link>
        {" · "}
        <Link href="/governance/compliance/workbook" className="text-accent hover:underline">
          Assessor workbook
        </Link>
        {" · "}
        <Link href="/settings/members" className="text-accent hover:underline">
          Members
        </Link>
      </p>

      {sp.created === "1" && sp.key ? (
        <div className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3">
          <p className={`font-medium text-emerald-200 ${appBody}`}>Token created — copy now</p>
          <p className={`mt-2 font-mono text-[11px] break-all text-foreground ${appBody}`}>{sp.key}</p>
          <p className={`mt-2 ${appMeta} text-muted`}>
            This secret is shown once. Requires <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> on
            the server to resolve hashes.
          </p>
        </div>
      ) : null}
      {sp.revoked === "1" ? (
        <p className={`mb-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-emerald-200 ${appBody}`}>
          Token revoked.
        </p>
      ) : null}
      {err ? (
        <p className={`mb-4 rounded-xl border border-danger/25 bg-danger-dim/50 px-4 py-3 text-danger ${appBody}`}>
          {err === "rbac"
            ? "Only org owners and admins can manage assessor API tokens."
            : err}
        </p>
      ) : null}

      {!orgContext.orgId ? (
        <ConsoleEmptyState
          title="Organization required"
          description="Create an organization before issuing assessor API tokens."
          ctas={[{ href: "/settings/members", label: "Members & roles" }]}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <ConsolePanel title={canEdit ? "Create token" : "View only"}>
            {canEdit ? (
              <form action={createAssessorApiTokenAction} className="space-y-3">
                <label className={appLabel} htmlFor="assessor_token_name">
                  Token label
                </label>
                <input
                  id="assessor_token_name"
                  name="name"
                  type="text"
                  defaultValue="External auditor — Q2"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 ${appBody}`}
                />
                <button
                  type="submit"
                  className={`h-10 rounded-lg bg-accent px-4 font-medium text-background hover:opacity-90 ${appBody}`}
                >
                  Create assessor token
                </button>
              </form>
            ) : (
              <p className={`${appMeta} text-muted`}>Owners and admins can create tokens.</p>
            )}
          </ConsolePanel>

          <ConsolePanel title="How to call the API">
            <p className={`${appMeta} text-muted`}>
              Prefix: <span className="font-mono text-foreground/90">{ASSESSOR_API_KEY_PREFIX}…</span>
            </p>
            <p className={`mt-2 ${appMeta} text-muted`}>
              Example:
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-background/60 p-3 font-mono text-[11px] text-foreground/90">
{`curl -H "Authorization: Bearer <token>" \\
  "${siteUrl}/api/governance/compliance/assessor/evidence-export?format=csv"`}
            </pre>
            <p className={`mt-3 ${appMeta} text-muted`}>
              Allowed paths: <span className="font-mono">/api/governance/compliance/assessor/&lt;resource&gt;</span>
            </p>
          </ConsolePanel>
        </div>
      )}

      <div className="mt-6">
        <ConsolePanel title="Allowed resources">
          <p className={`mb-3 ${appMeta} text-muted`}>
            {ASSESSOR_API_RESOURCES.join(", ")}
          </p>
        </ConsolePanel>
      </div>

      <div className="mt-6">
        <ConsolePanel title="Active tokens">
          {tokens.length === 0 ? (
            <p className={`${appMeta} text-muted`}>No assessor tokens yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className={`w-full text-left ${appBody}`}>
                <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Prefix</th>
                    <th className="px-3 py-2">Last used</th>
                    <th className="px-3 py-2">Status</th>
                    {canEdit ? <th className="px-3 py-2">Actions</th> : null}
                  </tr>
                </thead>
                <tbody className={`divide-y divide-border ${appMeta}`}>
                  {tokens.map((t) => (
                    <tr key={t.id}>
                      <td className="px-3 py-3">{t.name}</td>
                      <td className="px-3 py-3 font-mono text-[11px]">{t.keyPrefix}</td>
                      <td className="px-3 py-3 text-muted">
                        {t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-3 py-3 capitalize">
                        {t.revokedAt ? "revoked" : "active"}
                      </td>
                      {canEdit ? (
                        <td className="px-3 py-3">
                          {!t.revokedAt ? (
                            <form action={revokeAssessorApiTokenAction}>
                              <input type="hidden" name="token_id" value={t.id} />
                              <button
                                type="submit"
                                className="text-danger hover:underline"
                              >
                                Revoke
                              </button>
                            </form>
                          ) : (
                            "—"
                          )}
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ConsolePanel>
      </div>
    </>
  );
}
