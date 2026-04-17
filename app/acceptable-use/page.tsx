import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import {
  SITE_EMAIL_CONTACT,
  SITE_EMAIL_SUPPORT,
  getGeneralMailtoHref,
  getSupportMailtoHref,
} from "@/lib/billing";

export const metadata: Metadata = {
  title: "Acceptable Use Policy",
  description: "Acceptable use rules for the Shynvo platform and APIs.",
};

export default function AcceptableUsePage() {
  return (
    <LegalLayout title="Acceptable Use Policy" lastUpdated="April 2026">
      <div className="legal-callout">
        <strong>Safety and trust.</strong> Shynvo is designed for legitimate IT
        operations with approvals and audit trails. This policy sets minimum
        standards. Your organization may impose stricter internal policies.
      </div>

      <h2>1. Scope</h2>
      <p>
        This Acceptable Use Policy (“<strong>AUP</strong>”) applies to all users of
        the Shynvo Services, including visitors, trial users, paying customers, and
        anyone who accesses our APIs, automation runners, or integrations. It
        supplements our <a href="/terms">Terms of Service</a>.
      </p>

      <h2>2. No illegal or harmful use</h2>
      <p>You must not use the Services to:</p>
      <ul>
        <li>Violate any applicable law, regulation, or governmental order;</li>
        <li>
          Infringe intellectual property, privacy, publicity, or other rights of any
          person;
        </li>
        <li>
          Distribute malware, ransomware, cryptominers, or participate in botnets;
        </li>
        <li>
          Phish, spoof, harass, threaten, defraud, or discriminate unlawfully;
        </li>
        <li>
          Facilitate human trafficking, exploitation of minors, or other serious harm.
        </li>
      </ul>

      <h2>3. No unauthorized access or abuse of systems</h2>
      <p>You must not:</p>
      <ul>
        <li>
          Probe, scan, or test the vulnerability of Shynvo systems without prior
          written authorization from our security team;
        </li>
        <li>
          Bypass authentication, rate limits, quotas, or billing controls, or attempt
          to access data you are not authorized to view;
        </li>
        <li>
          Interfere with or disrupt the integrity or performance of the Services or
          third-party systems connected through integrations, except as part of
          documented, authorized testing in your own environments;
        </li>
        <li>
          Send unsolicited bulk communications (“spam”) from Shynvo infrastructure
          or use the Services to harvest addresses without consent.
        </li>
      </ul>

      <h2>4. Automation, AI, and high-risk actions</h2>
      <ul>
        <li>
          Production-impacting automations must follow your change-management and
          approval policies. Do not configure automations intended to evade safety
          controls or approvals.
        </li>
        <li>
          AI-generated suggestions are not a substitute for human judgment in
          regulated, safety-critical, or legally significant contexts unless your
          organization has validated workflows.
        </li>
        <li>
          Do not use the Services to train competing generalized AI models on Shynvo
          confidential materials without a separate written agreement.
        </li>
      </ul>

      <h2>5. Content and Customer Data</h2>
      <p>
        You are responsible for Customer Data you submit. Do not upload unlawful
        content, highly sensitive government classified material without clearance,
        or credentials where your policies prohibit it. Use vaulting and least
        privilege for secrets.
      </p>

      <h2>6. Resource use</h2>
      <p>
        You will not monopolize shared infrastructure in a way that degrades other
        customers—e.g., abusive polling, unbounded fan-out jobs, or crypto mining. We
        may throttle or suspend abusive workloads.
      </p>

      <h2>7. Coordinated disclosure and security research</h2>
      <p>
        If you discover a vulnerability, contact our security team with details and
        reproduction steps. Do not exploit vulnerabilities beyond what is necessary
        to demonstrate impact. Do not access customer data without authorization.
      </p>

      <h2>8. Monitoring and enforcement</h2>
      <p>
        We may use technical and organizational measures to detect violations,
        including logging, automated scanning, and manual review where appropriate. We
        may remove content, suspend accounts, terminate Services, notify law
        enforcement, and cooperate with investigations.
      </p>

      <h2>9. Reporting abuse</h2>
      <p>
        Report suspected violations to{" "}
        <a href={getSupportMailtoHref()}>{SITE_EMAIL_SUPPORT}</a> with timestamps,
        URLs, and relevant headers or correlation IDs where available.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update this AUP to address new risks or product capabilities. Continued
        use after updates constitutes acceptance unless prohibited by law.
      </p>

      <h2>11. Contact</h2>
      <p>
        General: <a href={getGeneralMailtoHref()}>{SITE_EMAIL_CONTACT}</a>
        <br />
        Security &amp; abuse: <a href={getSupportMailtoHref()}>{SITE_EMAIL_SUPPORT}</a>
      </p>
    </LegalLayout>
  );
}
