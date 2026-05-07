import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { SITE_EMAIL_SUPPORT, getSupportMailtoHref } from "@/lib/billing";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "Security",
  description: "Security posture and operational safeguards for the Zentro platform.",
};

export default function SecurityPage() {
  return (
    <LegalLayout title="Security" lastUpdated="May 2026">
      <div className="legal-callout">
        <strong>Security-first operations.</strong> {SITE_BRAND_NAME} is designed to keep
        control evidence, approvals, and automation safeguards visible by default.
      </div>

      <h2>1. Platform security model</h2>
      <p>
        {SITE_BRAND_NAME} is built around a controlled operations model: high-impact changes
        require explicit approvals, dry-run context, and policy checks before execution.
        This reduces unsafe direct execution paths and supports stronger operational review.
      </p>

      <h2>2. Guardrails and execution controls</h2>
      <ul>
        <li>Approval checkpoints for high-risk actions.</li>
        <li>Dry-run and policy enforcement before automation execution.</li>
        <li>Auditable incident, approval, and automation event history.</li>
        <li>Connector health visibility before operational workflows proceed.</li>
      </ul>

      <h2>3. API and operational endpoint hardening</h2>
      <p>Operational routes are configured with hardened response policies, including:</p>
      <ul>
        <li>Restricted indexing for operational and health endpoints.</li>
        <li>Security headers such as content type protections and frame restrictions.</li>
        <li>No-store and noindex handling for sensitive runtime metadata surfaces.</li>
      </ul>

      <h2>4. Domain and transport posture</h2>
      <p>
        Production metadata and canonical links are anchored to the apex domain
        <strong> zentro.run</strong>. Requests to <code>www</code> hosts are redirected to the
        canonical apex host to avoid split-origin behavior.
      </p>

      <h2>5. Incident response and disclosure</h2>
      <p>
        If you believe you identified a vulnerability, report it privately to{" "}
        <a href={getSupportMailtoHref()}>{SITE_EMAIL_SUPPORT}</a>. Include reproduction steps,
        affected endpoints, and potential impact. We triage reports promptly and coordinate
        remediation and customer communication as needed.
      </p>

      <h2>6. Security documentation</h2>
      <p>
        Additional policy details are available in <a href="/trust">Trust &amp; governance</a>{" "}
        and the repository <code>SECURITY.md</code> document.
      </p>
    </LegalLayout>
  );
}
