import Link from "next/link";
import type { ReactNode } from "react";

import { SmohixHorizon } from "@/components/architecture";
import { mBody, mBodySm, mFocusRing, mSystemMeta } from "@/lib/marketing-layout";
import { SMOHIX_WORKSPACE_URLS } from "@/lib/ecosystem-workspaces";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

type Capability = {
  title: string;
  body: string;
  href: string;
  cta: string;
  external?: boolean;
};

const OPERATIONS: Capability[] = [
  {
    title: "Connectors",
    body: "Alert ingest and connector health checks.",
    href: "/auth/sign-in?next=/settings/connectors",
    cta: "Open connectors",
  },
  {
    title: "Services Catalog",
    body: "Track service ownership, context, and incident linkage.",
    href: "/auth/sign-in?next=/services",
    cta: "Open services",
  },
  {
    title: "Incidents",
    body: "Open, triage, link actions, resolve.",
    href: "/auth/sign-in?next=/incidents",
    cta: "Open incidents",
  },
  {
    title: "Automations",
    body: "Dry-run first, then approve and execute.",
    href: "/auth/sign-in?next=/automations",
    cta: "Open automations",
  },
  {
    title: "Runbooks",
    body: "Structured procedures for live operations.",
    href: "/auth/sign-in?next=/runbooks",
    cta: "Browse runbooks",
  },
  {
    title: "Approvals",
    body: "Approval-first gate for high-impact changes.",
    href: "/auth/sign-in?next=/approvals",
    cta: "Open approvals",
  },
];

const INTELLIGENCE: Capability[] = [
  {
    title: "Reasoning",
    body: "Contextual suggestions for safer next steps via Copilot in the signed-in console.",
    href: "/auth/sign-in?next=/copilot",
    cta: "Open reasoning",
  },
];

const GOVERNANCE: Capability[] = [
  {
    title: "Audit",
    body: "One evidence stream for key actions.",
    href: "/auth/sign-in?next=/audit",
    cta: "Open audit",
  },
  {
    title: "Access governance",
    body: "MFA posture, policy rules, and high-risk execution blocks.",
    href: "/auth/sign-in?next=/governance/access",
    cta: "Open governance",
  },
  {
    title: "Network & exposure",
    body: "Devices, config drift, certificates, and secrets inventory.",
    href: "/auth/sign-in?next=/assets/network",
    cta: "Open assets",
  },
];

const DEVELOPER_INTEGRATION: Capability[] = [
  {
    title: "API Docs",
    body: "Integration-facing routes and capability reference.",
    href: "/docs/api",
    cta: "View API docs",
  },
  {
    title: "API Keys",
    body: "Manage operator credentials for proxy-backed calls.",
    href: "/auth/sign-in?next=/settings/api-keys",
    cta: "Manage keys",
  },
  {
    title: "Connectors Health",
    body: "Check reasoning and robot endpoint reachability.",
    href: "/auth/sign-in?next=/settings/connectors",
    cta: "Check connectors",
  },
  {
    title: "System Status",
    body: "Public platform posture and reliability communication.",
    href: "/status",
    cta: "Open status",
  },
  {
    title: "Settings & keys",
    body: "API keys, billing, connectors, and execution posture.",
    href: "/auth/sign-in?next=/settings",
    cta: "Open settings",
  },
  {
    title: "Billing Control",
    body: "Plan state, checkout path, and subscription visibility.",
    href: "/auth/sign-in?next=/settings/billing",
    cta: "Open billing",
  },
];

function CapabilityPlane({ item }: { item: Capability }) {
  const className = "smohix-platform-capability-plane group block";
  const inner = (
    <>
      <span className="smohix-platform-capability-plane__title">{item.title}</span>
      <span className="smohix-platform-capability-plane__body">{item.body}</span>
      <span className="smohix-platform-capability-plane__cta">{item.cta} →</span>
    </>
  );
  if (item.external) {
    return (
      <a href={item.href} className={className} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return (
    <Link href={item.href} className={`${className} ${mFocusRing}`}>
      {inner}
    </Link>
  );
}

function PlatformLayer({
  id,
  label,
  title,
  description,
  items,
  variant = "standard",
  footer,
}: {
  id: string;
  label: string;
  title: string;
  description: string;
  items: Capability[];
  variant?: "primary" | "institutional" | "standard";
  footer?: ReactNode;
}) {
  return (
    <section
      className={`smohix-platform-layer smohix-platform-layer--${variant}`}
      aria-labelledby={`platform-layer-${id}`}
      data-layer={id}
    >
      <div className="smohix-platform-layer__header">
        <p className={`${mSystemMeta} text-muted/70`}>{label}</p>
        <h2 id={`platform-layer-${id}`} className="smohix-platform-layer__title">
          {title}
        </h2>
        <p className={`mt-2 ${mBodySm} text-muted/85`}>{description}</p>
      </div>
      <ul className="smohix-platform-layer__grid">
        {items.map((item) => (
          <li key={item.title}>
            <CapabilityPlane item={item} />
          </li>
        ))}
      </ul>
      {footer ? <div className="smohix-platform-layer__footer">{footer}</div> : null}
    </section>
  );
}

/** Platform core field — layered operating architecture, not equal card grid. */
export function PlatformCoreField() {
  return (
    <div className="smohix-platform-core-field">
      <div className="smohix-platform-core-field__spine" aria-hidden>
        <SmohixHorizon className="mx-auto max-w-md" />
        <p className={`mt-3 text-center ${mSystemMeta} text-muted/75`}>Platform architecture · one console</p>
        <div className="smohix-platform-core-field__axis" aria-hidden />
      </div>

      <div className="smohix-platform-core-field__operating-plane smohix-surface smohix-surface--active">
        <p className={`${mSystemMeta} text-accent/75`}>Operating core</p>
        <h2 className="smohix-platform-core-field__headline">Operational surfaces — one console</h2>
        <p className={`mt-3 max-w-3xl ${mBody}`}>
          {SITE_BRAND_NAME} is a controlled operations console: incidents, automations, approvals, audit,
          runbooks, connectors, governance, and reasoning in one place.
        </p>
        <p className={`mt-2 max-w-3xl ${mBodySm} text-muted/85`}>
          Start here: open an incident, connect alert ingest, run your first dry-run.
        </p>
      </div>

      <div className="smohix-platform-core-field__layers">
        <PlatformLayer
          id="operations"
          label="Operations layer"
          title="Run production systems"
          description="Services, incidents, automations, approvals, and runbooks as one operational system."
          items={OPERATIONS}
          variant="primary"
        />

        <PlatformLayer
          id="intelligence"
          label="Intelligence layer"
          title="Assisted reasoning in console"
          description="Copilot and reasoning routes inside the signed-in workspace — separate from the Smohix AI product."
          items={INTELLIGENCE}
          footer={
            <p className={`${mBodySm} text-muted/80`}>
              Flagship product:{" "}
              <a
                href={SMOHIX_WORKSPACE_URLS.ai}
                className="font-medium text-accent hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Smohix AI ↗
              </a>{" "}
              · Console Copilot uses Platform API routes, not the standalone AI app API.
            </p>
          }
        />

        <PlatformLayer
          id="governance"
          label="Governance layer"
          title="Authority, evidence, and control"
          description="Audit trails, access governance, and exposure inventory for accountable operations."
          items={GOVERNANCE}
          variant="institutional"
        />

        <PlatformLayer
          id="developers"
          label="Developers & integrations"
          title="APIs, keys, and connectors"
          description="Integration surfaces, documentation, and operator credentials for teams building on Smohix."
          items={DEVELOPER_INTEGRATION}
          footer={
            <p className={`${mBodySm} text-muted/80`}>
              <Link href="/developers" className="font-medium text-accent hover:underline">
                Developer hub →
              </Link>
              {" · "}
              <Link href="/integrations" className="font-medium text-accent hover:underline">
                Integrations roadmap →
              </Link>
            </p>
          }
        />
      </div>
    </div>
  );
}
