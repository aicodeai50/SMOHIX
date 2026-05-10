import {
  SITE_BRAND_NAME,
  SITE_MARKETING_DESCRIPTION,
  SITE_PRIMARY_DOMAIN,
} from "@/lib/site-brand";
import { getSiteUrl } from "@/lib/site";

export function SiteJsonLd() {
  const siteUrl = getSiteUrl();
  const logoUrl = new URL("/icon.png", siteUrl).href;
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
        "@type": "WebSite",
        name: SITE_BRAND_NAME,
        alternateName: [SITE_PRIMARY_DOMAIN],
        url: siteUrl,
        description: SITE_MARKETING_DESCRIPTION,
        inLanguage: "en-US",
        publisher: { "@id": `${siteUrl}#organization` },
      },
      {
        "@id": `${siteUrl}#organization`,
        "@type": "Organization",
        name: SITE_BRAND_NAME,
        url: siteUrl,
        logo,
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
