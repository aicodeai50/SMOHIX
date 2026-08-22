import Link from "next/link";

import { SmohixHorizon, StateBeacon } from "@/components/architecture";
import { TrackableLink } from "@/components/marketing/TrackableLink";
import { mBody, mBodySm, mFocusRing, mSystemMeta } from "@/lib/marketing-layout";
import {
  DEVELOPER_AUTH,
  DEVELOPER_CAPABILITIES,
  DEVELOPER_QUICK_START,
  DEVELOPER_RATE_LIMITS,
  DEVELOPER_SDKS,
  DEVELOPER_SECURITY_GUIDANCE,
  DEVELOPER_VERSIONING,
  sdkStatusLabel,
  type SdkStatus,
} from "@/lib/developer-journey";

function sdkBeaconTone(status: SdkStatus): "verified" | "attention" | "aware" | "dormant" {
  if (status === "available") return "verified";
  if (status === "preview") return "attention";
  if (status === "coming-soon") return "aware";
  return "dormant";
}

/** Featured endpoints from the real catalog — not invented. */
const FEATURED_ENDPOINTS = [
  {
    method: "GET",
    path: "/api/health",
    auth: "Public",
    purpose: "Liveness and uptime for load balancers.",
  },
  {
    method: "POST",
    path: "/api/integrations/alerts",
    auth: "Ingest token",
    purpose: "Alert ingest opens or deduplicates incidents.",
  },
  {
    method: "GET|POST",
    path: "/api/reasoning/*",
    auth: "Session or smohix_sk_",
    purpose: "Reasoning connector proxy — API-key eligible.",
  },
  {
    method: "GET|POST",
    path: "/api/robot/*",
    auth: "Session or smohix_sk_",
    purpose: "Robot connector proxy — API-key eligible.",
  },
] as const;

const LIFECYCLE = [
  {
    id: "01",
    label: "Access",
    title: "Enter the developer surface",
    detail: "Open API docs, then sign in to mint keys or ingest tokens.",
    href: "/docs/api",
  },
  {
    id: "02",
    label: "Authenticate",
    title: "Choose the correct credential",
    detail: "Session cookies, smohix_sk_ keys, ingest tokens, and provider signatures are not interchangeable.",
    href: "/docs/api#authentication",
  },
  {
    id: "03",
    label: "Request",
    title: "Call a documented route",
    detail: "Use the catalog — only routes implemented under app/api are claimed.",
    href: "/docs/api#endpoints",
  },
  {
    id: "04",
    label: "Route",
    title: "Match auth to the handler",
    detail: "API keys authenticate reasoning/robot proxies — not every console session route.",
    href: "/docs/api#proxy",
  },
  {
    id: "05",
    label: "Response",
    title: "Handle status and bodies",
    detail: "Expect 401/403 for auth, 429 when limited, and JSON error fields where implemented.",
    href: "/docs/api#errors",
  },
  {
    id: "06",
    label: "Observe",
    title: "Status, limits, and audit",
    detail: "Public status, documented rate limits, and console audit for operational evidence.",
    href: "/status",
  },
] as const;

const AUTH_PLANES = [
  {
    id: "session",
    label: "Human session",
    title: "Supabase Auth cookies",
    detail: "Console and most product API routes use browser sessions after sign-in.",
  },
  {
    id: "programmatic",
    label: "Programmatic access",
    title: "smohix_sk_ API keys",
    detail: "Bearer or X-Smohix-Api-Key for /api/reasoning/* and /api/robot/* only.",
  },
  {
    id: "ingest",
    label: "Ingest / machine access",
    title: "smohix_ingest_ and smohix_ca_",
    detail: "Alert/vuln ingest tokens and compliance assessor tokens — separate from API keys.",
  },
  {
    id: "provider",
    label: "Signed provider events",
    title: "Webhook signatures",
    detail: "PayPal, Lemon Squeezy, and Slack verify signatures — never expose signing secrets in clients.",
  },
] as const;

const WEBHOOK_BOUNDARIES = [
  {
    title: "Inbound ingest",
    detail: "Alert and vulnerability ingest with Bearer ingest tokens (optional HMAC).",
    muted: false,
  },
  {
    title: "Billing / provider callbacks",
    detail: "Signature-verified billing webhooks where configured.",
    muted: false,
  },
  {
    title: "Slack approvals",
    detail: "Approval callbacks for guarded operational workflows.",
    muted: false,
  },
  {
    title: "General outbound subscriptions",
    detail: "Not available — there is no general developer “subscribe to events” webhook API.",
    muted: true,
  },
] as const;

export function EndpointRail({
  method,
  path,
  auth,
  purpose,
}: {
  method: string;
  path: string;
  auth: string;
  purpose: string;
}) {
  return (
    <article className="smohix-endpoint-rail">
      <span className="smohix-endpoint-rail__method" data-method={method.split("|")[0]}>
        {method}
      </span>
      <code className="smohix-endpoint-rail__path">{path}</code>
      <span className="smohix-endpoint-rail__auth">{auth}</span>
      <p className="smohix-endpoint-rail__purpose">{purpose}</p>
    </article>
  );
}

/** Developer core field — technical architecture, not documentation-card grid. */
export function DeveloperCoreField() {
  return (
    <div className="smohix-developer-core-field">
      <div className="smohix-developer-core-field__spine" aria-hidden>
        <SmohixHorizon className="mx-auto max-w-md" />
        <p className={`mt-3 text-center ${mSystemMeta} text-muted/75`}>
          Developer system · access → request → observe
        </p>
        <div className="smohix-developer-core-field__axis" aria-hidden />
      </div>

      <div className="smohix-developer-core-field__request-plane smohix-surface smohix-surface--active">
        <p className={`${mSystemMeta} text-accent/75`}>Request core</p>
        <h2 className="smohix-developer-core-field__headline">What you can build today</h2>
        <p className={`mt-3 max-w-3xl ${mBody}`}>
          Capabilities below map to routes and settings that already exist in this repository.
        </p>
        <ul className="smohix-developer-capability-rail" aria-label="Supported developer capabilities">
          {DEVELOPER_CAPABILITIES.map((cap) => (
            <li key={cap.title}>
              <Link href={cap.href} className={`smohix-developer-capability-rail__item ${mFocusRing}`}>
                <span className="smohix-developer-capability-rail__title">{cap.title}</span>
                <span className="smohix-developer-capability-rail__body">{cap.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <section className="smohix-developer-lifecycle" aria-labelledby="lifecycle-heading">
        <p className={`${mSystemMeta} text-muted/70`}>Request lifecycle</p>
        <h2 id="lifecycle-heading" className="smohix-developer-section-title">
          From access to observability
        </h2>
        <ol className="smohix-developer-lifecycle__rail">
          {LIFECYCLE.map((stage) => (
            <li key={stage.id} className="smohix-developer-lifecycle__stage">
              <span className="smohix-developer-lifecycle__id" aria-hidden>
                {stage.id}
              </span>
              <div>
                <p className={`${mSystemMeta} text-accent/70`}>{stage.label}</p>
                <TrackableLink
                  href={stage.href}
                  event="developer_quick_start"
                  className="smohix-developer-lifecycle__title"
                >
                  {stage.title}
                </TrackableLink>
                <p className={`mt-1 ${mBodySm}`}>{stage.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="smohix-developer-auth-arch" aria-labelledby="auth-arch-heading">
        <p className={`${mSystemMeta} text-muted/70`}>Authentication architecture</p>
        <h2 id="auth-arch-heading" className="smohix-developer-section-title">
          {DEVELOPER_AUTH.title}
        </h2>
        <p className={`mt-2 max-w-2xl ${mBodySm} text-muted/85`}>
          Credentials are purpose-scoped. Do not treat session cookies, API keys, ingest tokens, and
          provider signatures as interchangeable.
        </p>
        <ul className="smohix-developer-auth-arch__grid">
          {AUTH_PLANES.map((plane) => (
            <li key={plane.id} className={`smohix-developer-auth-plane smohix-developer-auth-plane--${plane.id}`}>
              <p className={`${mSystemMeta} text-muted/65`}>{plane.label}</p>
              <h3 className="smohix-developer-auth-plane__title">{plane.title}</h3>
              <p className={`mt-2 ${mBodySm}`}>{plane.detail}</p>
            </li>
          ))}
        </ul>
        <ul className={`mt-5 list-inside list-disc space-y-1.5 ${mBodySm} text-muted/85`}>
          {DEVELOPER_AUTH.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      <section className="smohix-developer-endpoint-arch" aria-labelledby="endpoint-arch-heading">
        <p className={`${mSystemMeta} text-muted/70`}>Endpoint architecture</p>
        <h2 id="endpoint-arch-heading" className="smohix-developer-section-title">
          Featured routes
        </h2>
        <p className={`mt-2 max-w-2xl ${mBodySm} text-muted/85`}>
          Representative routes from the live catalog. Full list lives in the HTTP API reference.
        </p>
        <ul className="smohix-developer-endpoint-arch__list">
          {FEATURED_ENDPOINTS.map((ep) => (
            <li key={`${ep.method}-${ep.path}`}>
              <EndpointRail {...ep} />
            </li>
          ))}
        </ul>
        <p className={`mt-4 ${mBodySm}`}>
          <Link href="/docs/api#endpoints" className="font-medium text-accent hover:underline">
            Full endpoint catalog →
          </Link>
        </p>
      </section>

      <div className="smohix-developer-side-layers">
        <section className="smohix-developer-sdk-arch" aria-labelledby="sdk-arch-heading">
          <p className={`${mSystemMeta} text-muted/70`}>SDK architecture</p>
          <h2 id="sdk-arch-heading" className="smohix-developer-section-title">
            SDK &amp; CLI status
          </h2>
          <p className={`mt-2 ${mBodySm} text-muted/85`}>
            Only statuses below are claimed. Preview and planned items are not published packages.
          </p>
          <ul className="mt-4 space-y-2">
            {DEVELOPER_SDKS.map((sdk) => (
              <li key={sdk.name} className="smohix-developer-sdk-row">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{sdk.name}</p>
                  <p className={`mt-1 ${mBodySm}`}>{sdk.detail}</p>
                </div>
                <StateBeacon label={sdkStatusLabel(sdk.status)} tone={sdkBeaconTone(sdk.status)} />
              </li>
            ))}
          </ul>
          <p className={`mt-4 ${mBodySm} text-muted/85`}>{DEVELOPER_VERSIONING.body}</p>
        </section>

        <section className="smohix-developer-webhook-arch" aria-labelledby="webhook-arch-heading">
          <p className={`${mSystemMeta} text-muted/70`}>Webhook architecture</p>
          <h2 id="webhook-arch-heading" className="smohix-developer-section-title">
            Inbound boundaries
          </h2>
          <ul className="mt-4 space-y-2">
            {WEBHOOK_BOUNDARIES.map((item) => (
              <li
                key={item.title}
                className={`smohix-developer-webhook-plane${item.muted ? " smohix-developer-webhook-plane--muted" : ""}`}
              >
                <p className="font-medium text-foreground">{item.title}</p>
                <p className={`mt-1 ${mBodySm}`}>{item.detail}</p>
              </li>
            ))}
          </ul>
          <p className={`mt-4 ${mBodySm}`}>
            <Link href="/docs/api#webhooks" className="font-medium text-accent hover:underline">
              Webhook documentation →
            </Link>
            {" · "}
            <Link href="/integrations" className="font-medium text-accent hover:underline">
              Integrations →
            </Link>
          </p>
        </section>
      </div>

      <section className="smohix-developer-security-layer" aria-labelledby="security-layer-heading">
        <div className="smohix-developer-security-layer__rail" aria-hidden />
        <div>
          <p className={`${mSystemMeta} text-accent/70`}>Security · status · limits</p>
          <h2 id="security-layer-heading" className="smohix-developer-section-title">
            Secure integration
          </h2>
          <ul className={`mt-3 list-inside list-disc space-y-1.5 ${mBodySm}`}>
            {DEVELOPER_SECURITY_GUIDANCE.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className={`mt-4 ${mBodySm} text-muted/85`}>
            <span className="font-medium text-foreground/85">{DEVELOPER_RATE_LIMITS.title}:</span>{" "}
            {DEVELOPER_RATE_LIMITS.body}
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm">
            <Link href="/security" className="font-medium text-accent hover:underline">
              Security →
            </Link>
            <Link href="/trust" className="font-medium text-accent hover:underline">
              Trust →
            </Link>
            <Link href="/status" className="font-medium text-accent hover:underline">
              Status →
            </Link>
            <Link href="/docs/api#api-keys" className="font-medium text-accent hover:underline">
              API keys docs →
            </Link>
          </div>
        </div>
      </section>

      <section className="smohix-developer-quickstart" aria-labelledby="quickstart-heading">
        <p className={`${mSystemMeta} text-muted/70`}>Quick start</p>
        <h2 id="quickstart-heading" className="smohix-developer-section-title">
          Six steps to a supported request
        </h2>
        <ol className="smohix-developer-quickstart__rail">
          {DEVELOPER_QUICK_START.map((step) => (
            <li key={step.step} className="smohix-developer-quickstart__step">
              <TrackableLink
                href={step.href}
                event="developer_quick_start"
                className="font-semibold text-foreground hover:text-accent"
              >
                {step.step}
              </TrackableLink>
              <p className={`mt-1.5 ${mBodySm}`}>{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
