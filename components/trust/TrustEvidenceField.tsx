import Link from "next/link";

import { SmohixHorizon, SystemLabel } from "@/components/architecture";
import { CommercialPaths } from "@/components/marketing/CommercialPaths";
import { AssuranceRail } from "@/components/trust/AssuranceRail";
import { getMailtoHref } from "@/lib/billing";
import {
  TRUST_AI,
  TRUST_MATURITY,
  TRUST_NOT_CLAIMED,
  TRUST_PRIVACY,
  TRUST_SECURITY,
  type TrustItem,
  type TrustStatus,
} from "@/lib/trust-center";
import { mBody, mBodySm, mFocusRing, mH1, mLede, mLinkInline, mSystemMeta } from "@/lib/marketing-layout";
import { SITE_PUBLIC_BRAND } from "@/lib/site-brand";

const CONTROL_SURFACES = [
  {
    title: "Audit trail",
    body: "Operational events — API keys, billing webhooks, approvals, automation activity — are designed to land in one append-oriented log you can export and walk through with auditors.",
    href: "/auth/sign-in?next=/audit",
    cta: "Audit log",
  },
  {
    title: "Approvals",
    body: "High-impact automation waits for an explicit approval record before execution. The queue is a first-class route, not a side channel.",
    href: "/auth/sign-in?next=/approvals",
    cta: "Approvals",
  },
  {
    title: "Connectors",
    body: "Optional HTTP backends for reasoning, robot-style automation, and health checks. Nothing runs against your stack until you configure endpoints and credentials.",
    href: "/auth/sign-in?next=/settings/connectors",
    cta: "Connectors",
  },
  {
    title: "API access & keys",
    body: "Scripts and integrations authenticate with scoped keys. Keys are created and rotated from Settings; usage flows through the same-origin API surface documented in the reference.",
    href: "/auth/sign-in?next=/settings/api-keys",
    cta: "API keys",
  },
] as const;

function evidenceStateLabel(status: TrustStatus): string {
  if (status === "current") return "Documented";
  if (status === "in-progress") return "In development";
  return "Planned";
}

function EvidenceBand({
  id,
  title,
  description,
  items,
}: {
  id: string;
  title: string;
  description: string;
  items: readonly TrustItem[];
}) {
  return (
    <section className="smohix-trust-evidence-band" aria-labelledby={`trust-band-${id}`}>
      <div className="smohix-trust-evidence-band__header">
        <p className={`${mSystemMeta} text-muted/65`}>Evidence band</p>
        <h2 id={`trust-band-${id}`} className="smohix-trust-section-title">
          {title}
        </h2>
        <p className={`mt-2 max-w-2xl ${mBodySm} text-muted/85`}>{description}</p>
      </div>
      <ul className="smohix-trust-evidence-list">
        {items.map((item) => (
          <li key={item.title} className="smohix-trust-evidence-item">
            <div className="smohix-trust-evidence-item__top">
              <h3 className="smohix-trust-evidence-item__title">{item.title}</h3>
              <span className="smohix-trust-evidence-state" data-state={item.status}>
                {evidenceStateLabel(item.status)}
              </span>
            </div>
            <p className={`mt-2 ${mBodySm}`}>{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Trust as evidence architecture — separate from Security boundaries. */
export function TrustEvidenceField() {
  return (
    <div className="smohix-trust-evidence-field">
      <div className="smohix-trust-evidence-field__opening">
        <SmohixHorizon className="max-w-md" />
        <p className={`mt-3 ${mSystemMeta} text-muted/70`}>
          Evidence · maturity honesty · non-claims
        </p>
        <SystemLabel className="mt-6">Trust center</SystemLabel>
        <h1 className={`mt-2 ${mH1}`}>Trust &amp; governance</h1>
        <p className={mLede}>
          {SITE_PUBLIC_BRAND} is built for teams accountable for operational changes. This page
          states what is current, in progress, or planned — without unverified certification claims.
        </p>
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link href="/security" className={mLinkInline}>
            Security boundaries →
          </Link>
          <Link href="/status" className={mLinkInline}>
            Service status →
          </Link>
          <Link href="/privacy" className={mLinkInline}>
            Privacy →
          </Link>
          <Link href="/products" className={mLinkInline}>
            Product maturity →
          </Link>
        </div>
        <div className="mt-8">
          <AssuranceRail active="trust" />
        </div>
      </div>

      <section className="smohix-trust-control-surfaces" aria-labelledby="control-surfaces-heading">
        <p className={`${mSystemMeta} text-muted/65`}>Verifiable control surfaces</p>
        <h2 id="control-surfaces-heading" className="smohix-trust-section-title">
          Where operators can inspect controls
        </h2>
        <p className={`mt-2 max-w-2xl ${mBodySm} text-muted/85`}>
          These surfaces exist in the signed-in product. Links require authentication where noted.
        </p>
        <ul className="smohix-trust-control-grid">
          {CONTROL_SURFACES.map((item) => (
            <li key={item.title} className="smohix-trust-control-plane">
              <h3 className="smohix-trust-control-plane__title">{item.title}</h3>
              <p className={`mt-2 ${mBodySm}`}>{item.body}</p>
              <Link href={item.href} className={`mt-4 inline-block text-sm font-medium text-accent hover:underline ${mFocusRing}`}>
                {item.cta} →
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <EvidenceBand
        id="security"
        title="Security principles"
        description="Technical controls documented as current, in progress, or planned — not certification badges."
        items={TRUST_SECURITY}
      />
      <EvidenceBand
        id="privacy"
        title="Privacy principles"
        description="Data boundaries and privacy surfaces customers can review today."
        items={TRUST_PRIVACY}
      />
      <EvidenceBand
        id="ai"
        title="Responsible AI"
        description="How Copilot assistance relates to human approval and grounded same-origin context."
        items={TRUST_AI}
      />

      <section className="smohix-trust-maturity" aria-labelledby="maturity-heading">
        <p className={`${mSystemMeta} text-muted/65`}>Maturity disclosure</p>
        <h2 id="maturity-heading" className="smohix-trust-section-title">
          {TRUST_MATURITY.title}
        </h2>
        <p className={`mt-3 max-w-3xl ${mBody}`}>{TRUST_MATURITY.body}</p>
        <Link href="/products" className={`mt-4 inline-block text-sm ${mLinkInline}`}>
          View product maturity labels →
        </Link>
      </section>

      <section className="smohix-trust-nonclaims" aria-labelledby="not-claimed-heading">
        <p className={`${mSystemMeta} text-muted/65`}>Evidence state · not claimed</p>
        <h2 id="not-claimed-heading" className="smohix-trust-section-title">
          What we do not claim
        </h2>
        <p className={`mt-2 max-w-2xl ${mBodySm} text-muted/85`}>
          Explicit non-claims increase credibility. Absence of a certification is stated plainly —
          not implied by decorative badges.
        </p>
        <ul className="smohix-trust-nonclaims__list">
          {TRUST_NOT_CLAIMED.map((item) => (
            <li key={item} className="smohix-trust-nonclaims__item">
              <span className="smohix-trust-evidence-state" data-state="not-claimed">
                Not claimed
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="smohix-trust-reporting" aria-labelledby="report-heading">
        <p className={`${mSystemMeta} text-muted/65`}>Reporting &amp; status</p>
        <h2 id="report-heading" className="smohix-trust-section-title">
          Vulnerability reporting &amp; status
        </h2>
        <p className={`mt-3 max-w-3xl ${mBody}`}>
          Report security issues via{" "}
          <a href={getMailtoHref("security")} className="text-accent hover:underline">
            security contact
          </a>
          . For runtime availability see{" "}
          <Link href="/status" className="text-accent hover:underline">
            service status
          </Link>
          . Read{" "}
          <Link href="/security" className="text-accent hover:underline">
            Security
          </Link>{" "}
          for disclosure expectations.
        </p>
      </section>

      <div className="mt-10">
        <CommercialPaths compact />
      </div>
    </div>
  );
}
