/**
 * Privacy-conscious analytics abstraction.
 * Never tracks form field contents or PII.
 */

export type AnalyticsEvent =
  | "explore_products"
  | "start_pilot"
  | "contact_submit"
  | "contact_form_started"
  | "contact_form_submitted"
  | "contact_form_success"
  | "contact_form_validation_error"
  | "contact_form_rate_limited"
  | "pilot_application_success"
  | "developer_access_request"
  | "product_cta_clicked"
  | "open_console"
  | "developer_quick_start"
  | "product_cta"
  | "documentation_link"
  | "services_cta"
  | "pilot_apply"
  | "build_with_zentro"
  | "developers_hub";

export type AnalyticsPayload = {
  path?: string;
  product?: string;
  inquiryType?: string;
  href?: string;
  label?: string;
};

const ANALYTICS_CONSENT_KEY = "zentro_analytics_consent";

declare global {
  interface Window {
    __zentroAnalyticsQueue?: { event: AnalyticsEvent; payload?: AnalyticsPayload; at: number }[];
  }
}

export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(ANALYTICS_CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}

export function setAnalyticsConsent(granted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, granted ? "granted" : "denied");
  } catch {
    /* ignore */
  }
}

function providerConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER);
}

function requiresConsent(): boolean {
  return process.env.NEXT_PUBLIC_ANALYTICS_REQUIRES_CONSENT === "true";
}

function dispatchToProvider(event: AnalyticsEvent, payload?: AnalyticsPayload): void {
  const provider = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER;
  if (provider === "plausible" && typeof window !== "undefined") {
    const w = window as Window & { plausible?: (e: string, o?: { props: AnalyticsPayload }) => void };
    w.plausible?.(event, payload ? { props: payload } : undefined);
    return;
  }
  if (provider === "console") {
    console.info("[zentro analytics]", event, payload ?? {});
  }
}

/** Queue event — respects consent when required. Never pass PII in payload. */
export function trackEvent(event: AnalyticsEvent, payload?: AnalyticsPayload): void {
  if (typeof window === "undefined") return;

  const entry = { event, payload, at: Date.now() };
  window.__zentroAnalyticsQueue = [...(window.__zentroAnalyticsQueue ?? []), entry];

  if (process.env.NODE_ENV === "development") {
    console.debug("[zentro analytics]", event, payload ?? {});
  }

  if (!providerConfigured()) return;
  if (requiresConsent() && !hasAnalyticsConsent()) return;

  dispatchToProvider(event, payload);
}

/** Returns queue entries for tests — strips any accidental PII keys. */
export function getAnalyticsQueueForTests(): typeof window.__zentroAnalyticsQueue {
  return typeof window !== "undefined" ? window.__zentroAnalyticsQueue : undefined;
}
