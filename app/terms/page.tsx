import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import {
  SITE_EMAIL_CONTACT,
  SITE_EMAIL_SUPPORT,
  getGeneralMailtoHref,
  getSupportMailtoHref,
} from "@/lib/billing";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for the Zentro platform.",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="April 2026">
      <div className="legal-callout">
        <strong>Scope.</strong> These Terms apply to your use of Zentro websites,
        applications, APIs, and related services. Enterprise orders may include
        additional negotiated terms that supersede conflicting sections here.
      </div>

      <h2>1. Agreement to these Terms</h2>
      <p>
        These Terms of Service (“<strong>Terms</strong>”) form a binding agreement
        between you and Zentro (“<strong>Zentro</strong>,” “<strong>we</strong>,” “
        <strong>us</strong>”) governing access to and use of the Zentro websites,
        applications, APIs, documentation, and related services (collectively, the “
        <strong>Services</strong>”).
      </p>
      <p>
        By creating an account, clicking to accept, accessing, or using the Services,
        you confirm that you have read and agree to these Terms and our{" "}
        <a href="/privacy">Privacy Policy</a>, <a href="/cookies">Cookie Policy</a>, and{" "}
        <a href="/acceptable-use">Acceptable Use Policy</a>, which are incorporated by
        reference. If you do not agree, do not use the Services.
      </p>

      <h2>2. Definitions</h2>
      <ul>
        <li>
          <strong>“Customer”</strong> means the organization or individual that
          contracts for paid or trial access, including its administrators and
          authorized users.
        </li>
        <li>
          <strong>“Customer Data”</strong> means data, content, configurations, logs,
          credentials metadata, and other materials that you or your users submit to
          or generate through the Services, excluding Zentro’s own systems telemetry
          described in the Privacy Policy.
        </li>
        <li>
          <strong>“Documentation”</strong> means our published technical and product
          materials for the Services as updated from time to time.
        </li>
        <li>
          <strong>“Order”</strong> means an online order, checkout, quote, or signed
          order form that specifies commercial terms (plan, seats, term, fees).
        </li>
      </ul>

      <h2>3. Eligibility and accounts</h2>
      <p>
        You must be at least the age of digital consent in your jurisdiction (often
        16–18) and able to form a binding contract. If you use the Services on behalf
        of an organization, you represent that you have authority to bind that
        organization.
      </p>
      <p>
        You are responsible for maintaining the confidentiality of credentials,
        configuring roles and permissions appropriately, and for all activity under
        your accounts except where caused solely by Zentro’s gross negligence or
        willful misconduct.
      </p>

      <h2>4. Description of Services</h2>
      <p>
        Zentro provides a software platform oriented toward IT operations, including
        capabilities such as incident workflows, AI-assisted guidance, automation with
        approvals, audit-oriented logging patterns, and integrations with systems you
        connect. Features may vary by plan, region, or beta program. We may modify,
        deprecate, or add features where reasonably necessary for security,
        compliance, or product improvement, subject to material change commitments in
        an applicable Order or enterprise agreement.
      </p>

      <h2>5. Customer Data and processing</h2>
      <p>
        As between you and Zentro, you retain ownership of Customer Data. You grant
        Zentro a worldwide, non-exclusive license to host, process, transmit, display,
        and otherwise use Customer Data solely to provide, secure, improve, and
        support the Services and as required by law. You represent that you have all
        rights and consents necessary to submit Customer Data and that its processing
        under these Terms will not violate third-party rights or applicable law.
      </p>
      <p>
        High-risk environments (e.g., safety-critical infrastructure, weapons systems,
        unlawful surveillance) may be prohibited or require a separate written
        engagement. Contact us before deploying in regulated sectors without guidance.
      </p>

      <h2>6. Acceptable use</h2>
      <p>
        You must comply with our <a href="/acceptable-use">Acceptable Use Policy</a>.
        We may investigate suspected violations and cooperate with law enforcement.
        We may suspend or terminate access for material violations or where
        necessary to protect the Services or third parties.
      </p>

      <h2>7. Third-party services and integrations</h2>
      <p>
        The Services may interoperate with third-party APIs, identity providers,
        ticketing systems, cloud providers, and payment processors. Those services
        are governed by their own terms. Zentro is not responsible for third-party
        outages, pricing, or conduct except as expressly stated in an Order.
      </p>

      <h2>8. Fees, trials, and taxes</h2>
      <p>
        Paid plans, usage limits, and payment methods are described at checkout, in
        your Order, or in an enterprise agreement. Fees are non-refundable except as
        stated in our <a href="/refund">Refunds &amp; billing</a> page or required by
        law. You are responsible for applicable taxes, duties, and government
        charges, excluding taxes on Zentro’s net income.
      </p>
      <p>
        Trials convert to paid subscriptions according to the terms presented at
        signup unless you cancel before conversion. We may use third-party billing
        platforms (e.g., Lemon Squeezy) to process payments; their terms may also
        apply to the transaction layer.
      </p>

      <h2>9. Intellectual property</h2>
      <p>
        Zentro and its licensors own the Services, software, branding, and
        Documentation, including all associated intellectual property rights. Except
        for the limited rights expressly granted in these Terms, no rights are
        transferred to you. Feedback you provide may be used without obligation or
        compensation to you.
      </p>

      <h2>10. Confidentiality</h2>
      <p>
        Each party may receive non-public information of the other (“
        <strong>Confidential Information</strong>”). The recipient will use reasonable
        care to protect Confidential Information and use it only for the purposes of
        these Terms. Exclusions include information that is public through no fault
        of the recipient, independently developed, or rightfully received from a third
        party without duty of confidentiality.
      </p>

      <h2>11. Warranties disclaimer</h2>
      <p>
        THE SERVICES AND DOCUMENTATION ARE PROVIDED “AS IS” AND “AS AVAILABLE.” TO
        THE MAXIMUM EXTENT PERMITTED BY LAW, ZENTRO DISCLAIMS ALL IMPLIED WARRANTIES,
        INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
        NON-INFRINGEMENT. ZENTRO DOES NOT WARRANT THAT THE SERVICES WILL BE
        UNINTERRUPTED, ERROR-FREE, OR THAT AI-GENERATED OUTPUTS WILL BE ACCURATE OR
        SUITABLE FOR ANY DECISION WITHOUT HUMAN REVIEW.
      </p>

      <h2>12. Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEITHER PARTY WILL BE LIABLE FOR ANY
        INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES,
        OR FOR LOSS OF PROFITS, REVENUE, GOODWILL, OR DATA, EVEN IF ADVISED OF THE
        POSSIBILITY. ZENTRO’S AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THE
        SERVICES OR THESE TERMS WILL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU
        PAID ZENTRO FOR THE SERVICES IN THE TWELVE (12) MONTHS BEFORE THE CLAIM OR (B)
        ONE HUNDRED U.S. DOLLARS (US$100) IF YOU HAVE NOT HAD FEES APPLICABLE IN THAT
        PERIOD.
      </p>
      <p>
        Some jurisdictions do not allow certain limitations; in those cases,
        limitations apply only to the extent permitted.
      </p>

      <h2>13. Indemnification</h2>
      <p>
        You will defend, indemnify, and hold harmless Zentro and its affiliates,
        officers, directors, employees, and agents from and against any claims,
        damages, losses, liabilities, costs, and expenses (including reasonable
        attorneys’ fees) arising out of or related to Customer Data, your use of the
        Services in violation of these Terms or law, or a dispute between you and
        your users or third parties—except to the extent caused by Zentro’s breach of
        these Terms or gross negligence.
      </p>

      <h2>14. Suspension and termination</h2>
      <p>
        You may stop using the Services at any time. We may suspend access for
        security incidents, suspected fraud, non-payment, or material breach. Either
        party may terminate for uncured material breach after written notice where
        cure is feasible. Upon termination, your right to access ceases; we may delete
        Customer Data according to the Privacy Policy and any documented retention
        settings, subject to legal retention obligations.
      </p>

      <h2>15. Export and sanctions</h2>
      <p>
        You will comply with applicable export control and sanctions laws. You may
        not use or export the Services into jurisdictions or to parties prohibited by
        applicable law.
      </p>

      <h2>16. Changes to these Terms</h2>
      <p>
        We may update these Terms to reflect product, legal, or security changes. If
        a change is material, we will provide reasonable notice where practicable
        (e.g., email or in-product notice). Continued use after the effective date
        constitutes acceptance. If you disagree with a material change, you may
        terminate your subscription according to your Order.
      </p>

      <h2>17. Governing law and disputes</h2>
      <p>
        Unless a separate written agreement specifies otherwise, these Terms are
        governed by the laws of the State of Delaware, USA, excluding conflict-of-law
        rules. Courts in Delaware (or another venue you and we specify in an
        enterprise agreement) have exclusive jurisdiction, except that either party
        may seek injunctive relief in any court of competent jurisdiction to protect
        intellectual property or confidential information.
      </p>
      <p>
        For consumers in jurisdictions that mandate local law or venue, mandatory
        rules may override this section to the extent required.
      </p>

      <h2>18. General</h2>
      <p>
        These Terms constitute the entire agreement regarding the Services and
        supersede prior understandings on the same subject. If any provision is
        unenforceable, the remainder remains in effect. No waiver is effective unless
        in writing. You may not assign these Terms without our consent; we may assign
        in connection with a merger, acquisition, or sale of assets.
      </p>

      <h2>19. Contact</h2>
      <p>
        General inquiries:{" "}
        <a href={getGeneralMailtoHref()}>{SITE_EMAIL_CONTACT}</a>
        <br />
        Product, billing, and technical support:{" "}
        <a href={getSupportMailtoHref()}>{SITE_EMAIL_SUPPORT}</a>
      </p>
    </LegalLayout>
  );
}
