import { getBrandLogoUrl } from "@/lib/brand";
import {
  COMPANY_NAME,
  ECOSYSTEM_PRODUCTS,
} from "@/lib/company-identity";
import { SITE_EMAIL_CONTACT } from "@/lib/billing";
import {
  SITE_COMPANY_NAME,
  SITE_LEGAL_NAME,
  SITE_MARKETING_DESCRIPTION,
  SITE_PRIMARY_DOMAIN,
  SITE_PUBLIC_BRAND,
  SITE_TAGLINE,
} from "@/lib/site-brand";
import { getSiteUrl } from "@/lib/site";

export function HomePageJsonLd() {
  const siteUrl = getSiteUrl();
  const logoUrl = getBrandLogoUrl(siteUrl);

  const payload = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: SITE_COMPANY_NAME,
        description: SITE_MARKETING_DESCRIPTION,
        publisher: { "@id": `${siteUrl}/#organization` },
        inLanguage: "en-US",
      },
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/#webpage`,
        url: siteUrl,
        name: `${SITE_COMPANY_NAME} — Official Home`,
        description: SITE_MARKETING_DESCRIPTION,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${siteUrl}/#organization` },
        inLanguage: "en-US",
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: SITE_COMPANY_NAME,
        legalName: SITE_LEGAL_NAME,
        alternateName: [COMPANY_NAME, SITE_PRIMARY_DOMAIN, SITE_PUBLIC_BRAND],
        url: siteUrl,
        logo: logoUrl,
        email: SITE_EMAIL_CONTACT,
        description: SITE_TAGLINE,
        sameAs: [`https://${SITE_PRIMARY_DOMAIN}`, "https://github.com/aicodeai50/ZENTRO"],
      },
      {
        "@type": "ItemList",
        "@id": `${siteUrl}/#products`,
        name: "Zentro ecosystem products",
        itemListElement: ECOSYSTEM_PRODUCTS.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: product.name,
          url: new URL(product.href, siteUrl).href,
          description: product.description,
        })),
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
