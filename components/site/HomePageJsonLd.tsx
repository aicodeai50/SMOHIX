import {
  SITE_BRAND_NAME,
  SITE_LEGAL_NAME,
  SITE_MARKETING_DESCRIPTION,
  SITE_PRIMARY_DOMAIN,
  SITE_TAGLINE,
} from "@/lib/site-brand";
import { SITE_EMAIL_CONTACT } from "@/lib/billing";
import { getSiteUrl } from "@/lib/site";

export function HomePageJsonLd() {
  const siteUrl = getSiteUrl();
  const logoUrl = new URL("/icon.png", siteUrl).href;

  const payload = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/#webpage`,
        url: siteUrl,
        name: SITE_BRAND_NAME,
        description: SITE_MARKETING_DESCRIPTION,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${siteUrl}/#software` },
        inLanguage: "en-US",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}/#software`,
        name: SITE_BRAND_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: siteUrl,
        description: SITE_MARKETING_DESCRIPTION,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Free tier with upgrade paths for Pro, Team, and Enterprise",
        },
        featureList: [
          "Incident response command center",
          "Guarded automation with dry-runs and approvals",
          "Cybersecurity exposure and vulnerability management",
          "GRC compliance program and assessor exports",
          "Append-only audit trail",
          "AI Copilot with human-in-the-loop",
        ],
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: SITE_LEGAL_NAME,
        legalName: SITE_LEGAL_NAME,
        alternateName: [SITE_BRAND_NAME, SITE_PRIMARY_DOMAIN],
        url: siteUrl,
        logo: logoUrl,
        email: SITE_EMAIL_CONTACT,
        description: SITE_TAGLINE,
        sameAs: [`https://${SITE_PRIMARY_DOMAIN}`],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
