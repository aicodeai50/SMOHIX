import { getBrandLogoUrl } from "@/lib/brand";
import {
  SITE_BRAND_NAME,
  SITE_LEGAL_NAME,
  SITE_MARKETING_DESCRIPTION,
  SITE_PRIMARY_DOMAIN,
  SITE_TAGLINE,
} from "@/lib/site-brand";
import { SITE_EMAIL_CONTACT } from "@/lib/billing";
import { getSiteUrl } from "@/lib/site";

export function SiteJsonLd() {
  const siteUrl = getSiteUrl();
  const logoUrl = getBrandLogoUrl(siteUrl);
  const logo = {
    "@type": "ImageObject",
    url: logoUrl,
    width: 512,
    height: 512,
  };

  const payload = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@id": `${siteUrl}/#website`,
        "@type": "WebSite",
        name: SITE_BRAND_NAME,
        alternateName: [SITE_PRIMARY_DOMAIN, SITE_LEGAL_NAME],
        url: siteUrl,
        description: SITE_MARKETING_DESCRIPTION,
        inLanguage: "en-US",
        publisher: { "@id": `${siteUrl}/#organization` },
      },
      {
        "@id": `${siteUrl}/#organization`,
        "@type": "Organization",
        name: SITE_LEGAL_NAME,
        legalName: SITE_LEGAL_NAME,
        alternateName: SITE_BRAND_NAME,
        url: siteUrl,
        logo,
        email: SITE_EMAIL_CONTACT,
        description: SITE_TAGLINE,
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
