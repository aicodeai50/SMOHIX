import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { SITE_EMAIL_SUPPORT, getSupportMailtoHref } from "@/lib/billing";

export const metadata: Metadata = {
  title: "Refunds & billing",
  description: "Billing cycles, refunds, and subscription terms for Zentro.",
};

export default function RefundPage() {
  return (
    <LegalLayout title="Refunds & billing" lastUpdated="April 2026">
      <div className="legal-callout">
        <strong>Billing clarity.</strong> This page explains how renewals,
        cancellations, and refunds are handled for self-serve subscriptions. Signed
        enterprise orders may define different commercial terms.
      </div>

      <h2>1. Plans and pricing</h2>
      <p>
        Subscription fees, seat counts, usage limits, and feature availability are
        displayed at checkout, in-product, or in a signed Order. Unless otherwise
        stated, fees are billed in advance on a recurring basis (monthly or annual).
        Taxes may be added where applicable.
      </p>

      <h2>2. Trials</h2>
      <p>
        Trials may be offered at our discretion. Trial length, included usage, and
        conversion rules are presented at signup. Unless you cancel before the trial
        ends according to the cancellation flow, your subscription may convert to a
        paid plan and billing may begin automatically.
      </p>

      <h2>3. Renewal and cancellation</h2>
      <p>
        Subscriptions renew automatically for successive periods equal to the initial
        term unless you cancel before the renewal date. You may cancel through the
        billing portal provided by our payment processor or as described in your
        Order. Cancellation stops future renewals; it does not erase past invoices.
      </p>

      <h2>4. Refunds (general policy)</h2>
      <p>
        Unless required by law or expressly stated at checkout, payments are
        generally <strong>non-refundable</strong> after the stated refund window (if
        any). Where a refund is granted, it may be credited to the original payment
        method or as service credit at our discretion.
      </p>
      <ul>
        <li>
          <strong>Annual plans:</strong> Some jurisdictions require prorated refunds
          in specific consumer scenarios—honor mandatory rules where they apply.
        </li>
        <li>
          <strong>Monthly plans:</strong> typically non-refundable after the billing
          date, except where the law mandates otherwise.
        </li>
        <li>
          <strong>Chargebacks:</strong> initiating a chargeback without first
          contacting support may result in suspension pending investigation.
        </li>
      </ul>

      <h2>5. EU/UK consumers</h2>
      <p>
        If you market to consumers in the European Union or United Kingdom, you may
        need to provide a 14-day statutory right of withdrawal for distance contracts,
        with exceptions for digital content once performance begins with consent.
        Zentro applies mandatory local consumer rights where required by law.
      </p>

      <h2>6. Downgrades and mid-cycle changes</h2>
      <p>
        If you reduce seats or downgrade a plan, pricing adjustments may take effect
        on the next billing cycle unless your Order specifies otherwise. We do not
        guarantee prorated credits for mid-cycle downgrades unless explicitly offered.
      </p>

      <h2>7. Failed payments and dunning</h2>
      <p>
        If a payment fails, we may retry charges, notify account administrators, and
        suspend or downgrade access after a grace period to mitigate fraud and
        non-payment risk.
      </p>

      <h2>8. Invoices and records</h2>
      <p>
        Invoices and receipts are available through the billing portal. Retain copies
        for tax and accounting purposes. Company legal name, address, and VAT/GST ID
        should be kept accurate in billing settings.
      </p>

      <h2>9. Enterprise and offline contracts</h2>
      <p>
        Customers with a negotiated agreement (MSA, Order Form, DPA) are governed by
        those documents for fees, invoicing, net payment terms, purchase orders, and
        refund mechanics, which prevail over this page in case of conflict.
      </p>

      <h2>10. Contact</h2>
      <p>
        Billing and refund questions:{" "}
        <a href={getSupportMailtoHref()}>{SITE_EMAIL_SUPPORT}</a>
      </p>
    </LegalLayout>
  );
}
