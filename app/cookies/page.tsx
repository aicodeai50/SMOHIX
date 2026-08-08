import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { LegalContactSection } from "@/components/legal/LegalContactSection";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Smohix uses cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <LegalLayout title="Cookie Policy" lastUpdated="April 2026">
      <div className="legal-callout">
        <strong>Transparency.</strong> This policy describes the cookie categories
        used by Smohix across public and authenticated product surfaces.
      </div>

      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small text files stored on your device. We also use comparable
        technologies such as local storage, session storage, pixels, and software
        development kits (SDKs). Together, we refer to these as “
        <strong>cookies</strong>” in this policy.
      </p>

      <h2>2. Who sets cookies?</h2>
      <ul>
        <li>
          <strong>First-party cookies</strong> are set by Smohix domains (e.g.,{" "}
          <code className="text-accent">smohix.run</code>).
        </li>
        <li>
          <strong>Third-party cookies</strong> are set by partners we embed (e.g.,
          analytics, error reporting, payment iframes). Those partners have their own
          policies.
        </li>
      </ul>

      <h2>3. Categories we use</h2>
      <h3>3.1 Strictly necessary</h3>
      <p>
        Required for core functionality: authentication sessions, security and fraud
        prevention, load balancing, cookie consent storage, and UI preferences that
        are essential to operate the product you requested. These may be exempt from
        consent banners in some jurisdictions.
      </p>

      <h3>3.2 Functional</h3>
      <p>
        Remember choices such as language, accessibility settings, or collapsed
        navigation states. If disabled, convenience may be reduced.
      </p>

      <h3>3.3 Analytics and performance</h3>
      <p>
        Help us understand usage patterns, diagnose errors, measure feature adoption,
        and improve reliability. Where required, we will request consent before
        enabling non-essential analytics on marketing pages.
      </p>

      <h3>3.4 Marketing (if used)</h3>
      <p>
        If we run advertising or retargeting, we will disclose partners and obtain
        consent where legally required. Enterprise console areas may omit marketing
        trackers by default.
      </p>

      <h2>4. Cookie inventory snapshot</h2>
      <p>
        Representative cookies and storage keys currently used in the platform.
      </p>
      <table>
        <thead>
          <tr>
            <th>Name / vendor</th>
            <th>Purpose</th>
            <th>Type</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>session_id (Smohix)</td>
            <td>Authentication</td>
            <td>Strictly necessary</td>
            <td>Session / rolling</td>
          </tr>
          <tr>
            <td>csrf / anti-abuse token</td>
            <td>Security</td>
            <td>Strictly necessary</td>
            <td>Session</td>
          </tr>
          <tr>
            <td>smohix_analytics_consent (local storage)</td>
            <td>Stores analytics banner choice on marketing pages</td>
            <td>Functional / analytics gate</td>
            <td>Until cleared</td>
          </tr>
          <tr>
            <td>Telemetry events</td>
            <td>Reliability and product usage analytics</td>
            <td>Analytics</td>
            <td>Per processor policy</td>
          </tr>
        </tbody>
      </table>

      <h2>5. Your choices</h2>
      <ul>
        <li>
          <strong>Consent banner:</strong> on smohix.run marketing pages, optional
          analytics load only after you accept. Decline or clear{" "}
          <code className="text-accent">smohix_analytics_consent</code> in browser
          storage to withdraw. Contact forms work without analytics consent.
        </li>
        <li>
          <strong>Browser controls:</strong> block or delete cookies via browser
          settings; note that blocking strictly necessary cookies may break sign-in.
        </li>
        <li>
          <strong>Industry tools:</strong> such as the Digital Advertising Alliance or
          similar programs where applicable.
        </li>
      </ul>

      <h2>6. Do Not Track</h2>
      <p>
        There is no consistent industry standard for “Do Not Track” browser signals.
        We treat user choices expressed through our consent tools and account
        settings as authoritative where applicable.
      </p>

      <h2>7. Changes</h2>
      <p>
        We may update this Cookie Policy to reflect new technologies or legal
        requirements. Material changes will be communicated as described in our
        Privacy Policy.
      </p>

      <LegalContactSection />
    </LegalLayout>
  );
}
