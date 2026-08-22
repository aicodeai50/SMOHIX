import Link from "next/link";

import { SmohixHorizon, SystemLabel } from "@/components/architecture";
import { ContactEmail } from "@/components/legal/ContactEmail";
import { AssuranceRail } from "@/components/trust/AssuranceRail";
import { mBody, mBodySm, mFocusRing, mH1, mLede, mLinkInline, mSystemMeta } from "@/lib/marketing-layout";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

const BOUNDARY_PLANES = [
  {
    id: "identity",
    label: "Identity boundary",
    title: "Access & credentials",
    what: "Who can reach console routes and programmatic APIs.",
    how: "Supabase Auth for console sessions. Smohix API keys and ingest tokens for scoped machine access.",
    verify: "/developers",
    verifyLabel: "Developer authentication →",
  },
  {
    id: "data",
    label: "Data boundary",
    title: "Secrets & workspace scope",
    what: "Where credentials and tenant data are allowed to live.",
    how: "Server-side environment secrets only. Workspace data scoped by Supabase RLS and org membership.",
    verify: "/trust",
    verifyLabel: "Trust evidence →",
  },
  {
    id: "execution",
    label: "Execution boundary",
    title: "Controlled operations",
    what: "What high-impact automation can do before a human decides.",
    how: "Approval checkpoints, dry-run context, and policy checks before guarded execution.",
    verify: "/auth/sign-in?next=/approvals",
    verifyLabel: "Approvals (signed in) →",
  },
  {
    id: "authority",
    label: "Human authority",
    title: "Human-in-the-loop control",
    what: "Where people remain accountable for consequential change.",
    how: "High-impact automation waits for an explicit approval record — Copilot assists; it does not bypass governance.",
    verify: "/platform",
    verifyLabel: "Platform overview →",
  },
  {
    id: "audit",
    label: "Audit boundary",
    title: "Traceability",
    what: "What operational history is retained for review.",
    how: "Auditable incident, approval, and automation event history designed for exportable review.",
    verify: "/auth/sign-in?next=/audit",
    verifyLabel: "Audit log (signed in) →",
  },
  {
    id: "api",
    label: "API boundary",
    title: "Endpoint hardening",
    what: "How public and operational HTTP surfaces are constrained.",
    how: "Security headers, restricted indexing, no-store/noindex for sensitive runtime metadata, rate limits on sensitive routes.",
    verify: "/docs/api#security",
    verifyLabel: "API security docs →",
  },
] as const;

/** Security as institutional boundaries — not a shield-icon card grid. */
export function SecurityBoundaryField() {
  return (
    <div className="smohix-security-boundary-field">
      <div className="smohix-security-boundary-field__opening">
        <SmohixHorizon className="max-w-md" />
        <p className={`mt-3 ${mSystemMeta} text-muted/70`}>
          Security boundary · human authority · auditability
        </p>
        <SystemLabel className="mt-6">Smohix Security</SystemLabel>
        <h1 className={`mt-2 ${mH1}`}>Security posture</h1>
        <p className={mLede}>
          {SITE_BRAND_NAME} is designed so control evidence, approvals, and automation safeguards stay
          visible by default — a controlled operations model, not unrestricted execution.
        </p>
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link href="/trust" className={mLinkInline}>
            Trust evidence →
          </Link>
          <Link href="/status" className={mLinkInline}>
            Service status →
          </Link>
          <Link href="/docs/api#security" className={mLinkInline}>
            API security →
          </Link>
          <Link href="/developers" className={mLinkInline}>
            Developers →
          </Link>
        </div>
        <div className="mt-8">
          <AssuranceRail active="security" />
        </div>
      </div>

      <div className="smohix-security-boundary-field__core smohix-surface smohix-surface--active" aria-labelledby="security-core-heading">
        <p className={`${mSystemMeta} text-accent/75`}>Trust boundary</p>
        <h2 id="security-core-heading" className="smohix-security-boundary-field__core-title">
          Controlled operations model
        </h2>
        <p className={`mt-3 max-w-3xl ${mBody}`}>
          High-impact changes require explicit approvals, dry-run context, and policy checks before
          execution. This reduces unsafe direct execution paths and supports stronger operational review.
        </p>
        <ul className={`mt-4 grid list-none gap-2 p-0 sm:grid-cols-2 ${mBodySm} text-muted/90`}>
          <li className="smohix-security-boundary-field__guard">Approval checkpoints for high-risk actions</li>
          <li className="smohix-security-boundary-field__guard">Dry-run and policy enforcement before automation</li>
          <li className="smohix-security-boundary-field__guard">Auditable incident, approval, and automation history</li>
          <li className="smohix-security-boundary-field__guard">Connector health visibility before workflows proceed</li>
        </ul>
      </div>

      <section aria-labelledby="security-planes-heading">
        <p className={`${mSystemMeta} text-muted/65`}>Control planes</p>
        <h2 id="security-planes-heading" className="smohix-security-section-title">
          Boundaries you can inspect
        </h2>
        <p className={`mt-2 max-w-2xl ${mBodySm} text-muted/85`}>
          Each plane summarizes an existing control area. Claims stay limited to what Smohix actually
          ships — formal certifications are not asserted here.
        </p>
        <ul className="smohix-security-plane-grid">
          {BOUNDARY_PLANES.map((plane) => (
            <li key={plane.id} className={`smohix-security-plane smohix-security-plane--${plane.id}`}>
              <p className={`${mSystemMeta} text-muted/65`}>{plane.label}</p>
              <h3 className="smohix-security-plane__title">{plane.title}</h3>
              <dl className="smohix-security-plane__meta">
                <div>
                  <dt>Protected</dt>
                  <dd>{plane.what}</dd>
                </div>
                <div>
                  <dt>Control</dt>
                  <dd>{plane.how}</dd>
                </div>
              </dl>
              <Link href={plane.verify} className={`mt-4 inline-block text-sm font-medium text-accent hover:underline ${mFocusRing}`}>
                {plane.verifyLabel}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="smohix-security-transport" aria-labelledby="transport-heading">
        <p className={`${mSystemMeta} text-muted/65`}>Transport &amp; disclosure</p>
        <h2 id="transport-heading" className="smohix-security-section-title">
          Domain posture and reporting
        </h2>
        <div className="smohix-security-transport__grid">
          <article className="smohix-security-transport__plane">
            <h3 className="smohix-security-plane__title">Domain and transport</h3>
            <p className={`mt-2 ${mBodySm}`}>
              Production metadata and canonical links are anchored to the apex domain{" "}
              <strong className="text-foreground/90">smohix.run</strong>. Requests to{" "}
              <code className="font-mono text-xs">www</code> hosts redirect to the canonical apex to
              avoid split-origin behavior.
            </p>
          </article>
          <article className="smohix-security-transport__plane">
            <h3 className="smohix-security-plane__title">Vulnerability disclosure</h3>
            <p className={`mt-2 ${mBodySm}`}>
              If you believe you identified a vulnerability, report it privately to{" "}
              <ContactEmail topic="security" />. Include reproduction steps, affected endpoints, and
              potential impact. We triage reports promptly and coordinate remediation and customer
              communication as needed.
            </p>
          </article>
        </div>
        <p className={`mt-6 ${mBodySm} text-muted/85`}>
          Additional assurance detail:{" "}
          <Link href="/trust" className="font-medium text-accent hover:underline">
            Trust &amp; governance
          </Link>
          {" · "}
          repository <code className="font-mono text-xs">SECURITY.md</code>
        </p>
      </section>
    </div>
  );
}
