import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { appBody, appLabel, appMeta, appOverline } from "@/lib/app-typography";
import { listCertificatesForUser } from "@/lib/equipment/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { createCertificateAction, deleteCertificateAction } from "./actions";

export const metadata: Metadata = {
  title: "Certificates",
  description: "Track certificate inventory and expiry posture.",
};

export const dynamic = "force-dynamic";

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Certificates"
          description="Connect Supabase and sign in to manage certificate inventory and expiry posture."
        />
        <p className={`max-w-xl text-muted ${appBody}`}>
          Local mode does not persist certificate inventory.
        </p>
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/assets/certificates");
  }

  const rows = await listCertificatesForUser(user.id);
  const sp = await searchParams;
  const err = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Assets"
        title="Certificates"
        description="Inventory certificate ownership, issuer, and expiry windows before incidents happen."
      />
      {err ? (
        <p className={`mb-4 rounded-xl border border-danger/25 bg-danger-dim/50 px-4 py-3 text-danger ${appBody}`}>
          {err}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <ConsolePanel title="Add certificate">
          <form action={createCertificateAction} className="space-y-3">
            <div>
              <label htmlFor="cert-name" className={`mb-1 block ${appLabel}`}>
                Name
              </label>
              <input
                id="cert-name"
                name="name"
                required
                maxLength={200}
                placeholder="edge-tls-prod"
                className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="cert-env" className={`mb-1 block ${appLabel}`}>
                  Environment
                </label>
                <input
                  id="cert-env"
                  name="environment"
                  maxLength={120}
                  placeholder="production"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
              <div>
                <label htmlFor="cert-exp" className={`mb-1 block ${appLabel}`}>
                  Expires at
                </label>
                <input
                  id="cert-exp"
                  name="expires_at"
                  type="datetime-local"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="cert-cn" className={`mb-1 block ${appLabel}`}>
                  CN
                </label>
                <input
                  id="cert-cn"
                  name="cn"
                  maxLength={255}
                  placeholder="api.smohix.run"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
              <div>
                <label htmlFor="cert-issuer" className={`mb-1 block ${appLabel}`}>
                  Issuer
                </label>
                <input
                  id="cert-issuer"
                  name="issuer"
                  maxLength={200}
                  placeholder="Let's Encrypt"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
            </div>
            <div>
              <label htmlFor="cert-sans" className={`mb-1 block ${appLabel}`}>
                SANs (comma-separated)
              </label>
              <input
                id="cert-sans"
                name="sans"
                maxLength={1000}
                placeholder="api.smohix.run, *.smohix.run"
                className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <div>
              <label htmlFor="cert-owner" className={`mb-1 block ${appLabel}`}>
                Owner hint
              </label>
              <input
                id="cert-owner"
                name="owner_hint"
                maxLength={200}
                placeholder="Team: Platform"
                className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <label className={`inline-flex items-center gap-2 ${appBody}`}>
              <input type="checkbox" name="auto_renew" className="h-4 w-4 rounded border-border bg-background" />
              Auto-renew configured
            </label>
            <div>
              <label htmlFor="cert-notes" className={`mb-1 block ${appLabel}`}>
                Notes
              </label>
              <textarea
                id="cert-notes"
                name="notes"
                rows={3}
                maxLength={4000}
                placeholder="Runbook link, issuer account, renewal process..."
                className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <button
              type="submit"
              className={`h-10 rounded-lg bg-accent px-4 font-medium text-background hover:opacity-90 ${appBody}`}
            >
              Add certificate
            </button>
          </form>
        </ConsolePanel>

        <ConsolePanel title="Inventory">
          <h3 className={appOverline}>Tracked certificates</h3>
          {rows.length === 0 ? (
            <div className="mt-4">
              <ConsoleEmptyState
                title="No certificates yet"
                description="Track ownership and expiry before certificates become incident causes."
                ctas={[{ href: "#cert-name", label: "Add first certificate" }]}
              />
            </div>
          ) : (
            <ul className={`mt-3 space-y-2 ${appBody}`}>
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-foreground/90">{row.name}</p>
                    <p className={appMeta}>
                      {row.environment ?? "n/a"} · {row.issuer ?? "issuer n/a"}
                    </p>
                    <p className={appMeta}>
                      Expires: {row.expiresAt ? new Date(row.expiresAt).toLocaleString() : "not set"}
                    </p>
                    {row.ownerHint ? <p className={appMeta}>Owner: {row.ownerHint}</p> : null}
                  </div>
                  <form action={deleteCertificateAction}>
                    <input type="hidden" name="id" value={row.id} />
                    <button type="submit" className={`font-medium text-danger hover:underline ${appMeta}`}>
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </ConsolePanel>
      </div>
    </>
  );
}
