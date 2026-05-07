import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { SITE_EMAIL_SUPPORT, getSupportMailtoHref } from "@/lib/billing";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Zentro collects, uses, and protects personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="April 2026">
      <div className="legal-callout">
        <strong>Important.</strong> This Privacy Policy is a comprehensive template.
        Zentro is not your lawyer. Finalize data categories, subprocessors, retention
        schedules, and regional addenda (EEA/UK, US state laws, etc.) with qualified
        privacy counsel before enterprise sales and DPIAs.
      </div>

      <h2>1. Who we are</h2>
      <p>
        Zentro (“<strong>Zentro</strong>,” “<strong>we</strong>,” “<strong>us</strong>”)
        operates the websites and services described at{" "}
        <a href="https://zentro.run">zentro.run</a>. Depending on your region, the
        data controller may be the Zentro entity identified in your contract or
        checkout flow. For privacy questions, contact{" "}
        <a href={getSupportMailtoHref()}>{SITE_EMAIL_SUPPORT}</a>.
      </p>

      <h2>2. Scope</h2>
      <p>
        This Policy explains how we process information when you visit our marketing
        sites, create an account, use the Zentro platform, communicate with support,
        or interact with our APIs and integrations. It does not govern third-party
        sites linked from our Services; those sites have their own policies.
      </p>

      <h2>3. Information we collect</h2>
      <h3>3.1 You provide directly</h3>
      <ul>
        <li>
          <strong>Account and profile:</strong> name, email, organization, role,
          authentication identifiers, billing contact details.
        </li>
        <li>
          <strong>Payment data:</strong> processed by our payment partners (e.g.,
          card data is not stored on Zentro servers where the processor tokenizes
          payments).
        </li>
        <li>
          <strong>Support and communications:</strong> messages, attachments, meeting
          notes, and feedback you send us.
        </li>
        <li>
          <strong>Customer Data:</strong> content you upload or generate in the
          product (e.g., incidents, runbooks, automation definitions, audit events,
          integration metadata). Customer Data may include personal information about
          your employees or end users—your organization is typically the controller
          for that data.
        </li>
      </ul>

      <h3>3.2 Collected automatically</h3>
      <ul>
        <li>
          <strong>Device and log data:</strong> IP address, approximate location,
          user agent, timestamps, pages viewed, referring URLs, diagnostic events.
        </li>
        <li>
          <strong>Cookies and similar technologies:</strong> described in our{" "}
          <a href="/cookies">Cookie Policy</a>.
        </li>
        <li>
          <strong>Security telemetry:</strong> signals used to detect abuse, fraud,
          and unauthorized access.
        </li>
      </ul>

      <h3>3.3 From third parties</h3>
      <p>
        We may receive information from identity providers (SSO), enrichment vendors
        you authorize, payment processors, and fraud-prevention services.
      </p>

      <h2>4. How we use information</h2>
      <p>We use information to:</p>
      <ul>
        <li>Provide, operate, maintain, and improve the Services;</li>
        <li>Authenticate users, enforce access controls, and protect security;</li>
        <li>Process transactions, invoices, credits, and refunds;</li>
        <li>Communicate about updates, incidents, and support requests;</li>
        <li>Conduct analytics and product research in aggregated or de-identified
        form where feasible;</li>
        <li>Comply with law, respond to lawful requests, and enforce our terms;</li>
        <li>Develop machine-learning models where permitted, using safeguards such as
        aggregation, minimization, and contractual restrictions.</li>
      </ul>

      <h2>5. Legal bases (EEA/UK)</h2>
      <p>
        Where GDPR/UK GDPR applies, we rely on appropriate bases such as:{" "}
        <strong>contract</strong> (providing the Services you request),{" "}
        <strong>legitimate interests</strong> (security, product improvement balanced
        against your rights), <strong>consent</strong> (non-essential cookies and
        certain marketing where required), and <strong>legal obligation</strong>.
      </p>

      <h2>6. Sharing and subprocessors</h2>
      <p>We may share information with:</p>
      <ul>
        <li>
          <strong>Service providers</strong> who assist with hosting, DNS, email,
          analytics, customer support tooling, security monitoring, and payments;
        </li>
        <li>
          <strong>Professional advisors</strong> (lawyers, auditors) under
          confidentiality obligations;
        </li>
        <li>
          <strong>Corporate transactions</strong> such as a merger or acquisition,
          subject to appropriate safeguards;
        </li>
        <li>
          <strong>Authorities</strong> when required by law or to protect rights,
          safety, and integrity.
        </li>
      </ul>
      <p>
        A current list of key subprocessors should be published separately (e.g., a
        “Subprocessors” page) and updated when vendors change for enterprise
        customers.
      </p>

      <h2>7. International transfers</h2>
      <p>
        We may process data in the United States and other countries. Where required,
        we implement appropriate safeguards such as Standard Contractual Clauses (SCCs)
        or equivalent mechanisms, plus supplementary measures where appropriate.
      </p>

      <h2>8. Retention</h2>
      <p>
        We retain information as long as needed to provide the Services, comply with
        law, resolve disputes, and enforce agreements. Retention periods may depend
        on plan settings, backups, and legal holds. Customer-configured retention for
        audit logs and incidents should be documented in admin tooling.
      </p>

      <h2>9. Security</h2>
      <p>
        We implement administrative, technical, and organizational measures designed
        to protect information against unauthorized access, alteration, disclosure, or
        destruction. No method of transmission or storage is 100% secure; you are
        responsible for safeguarding credentials and integration secrets.
      </p>

      <h2>10. Your rights and choices</h2>
      <p>
        Depending on your location, you may have rights to access, rectify, erase,
        restrict or object to certain processing, portability, and withdrawal of
        consent. You may also lodge a complaint with a supervisory authority. To
        exercise rights, contact{" "}
        <a href={getSupportMailtoHref()}>{SITE_EMAIL_SUPPORT}</a>. We will verify
        requests consistent with law and may need your organization to approve
        enterprise requests.
      </p>
      <p>
        <strong>California residents:</strong> You may have additional rights under
        the CCPA/CPRA regarding categories, sources, purposes, disclosure, and
        sensitive personal information. We do not “sell” personal information in the
        traditional sense; any “sharing” for cross-context behavioral advertising (if
        ever used) should be disclosed and opted where required.
      </p>

      <h2>11. Children</h2>
      <p>
        The Services are not directed to children under 16 (or the age required in
        your jurisdiction). We do not knowingly collect personal information from
        children. If you believe we have, contact us to delete it promptly.
      </p>

      <h2>12. Automated processing and AI outputs</h2>
      <p>
        Parts of the Services may use automated or AI-assisted processing to suggest
        actions, summarize incidents, or draft content. Outputs may be incorrect or
        incomplete. Human review is required for consequential decisions in regulated
        or high-risk environments. Where legally required, we document assessments
        and controls for automated decision-making.
      </p>

      <h2>13. Changes to this Policy</h2>
      <p>
        We may update this Policy from time to time. We will post the revised version
        and update the “Last updated” date. Where changes are material and consent is
        required, we will obtain consent as appropriate.
      </p>

      <h2>14. Contact</h2>
      <p>
        Privacy and data protection inquiries:{" "}
        <a href={getSupportMailtoHref()}>{SITE_EMAIL_SUPPORT}</a>
      </p>
    </LegalLayout>
  );
}
