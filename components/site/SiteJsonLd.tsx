import {
  SITE_BRAND_NAME,
  SITE_MARKETING_DESCRIPTION,
} from "@/lib/site-brand";
import { getSiteUrl } from "@/lib/site";

export function SiteJsonLd() {
  const siteUrl = getSiteUrl();
  const logoUrl = new URL("/icon.png", siteUrl).href;

  const payload = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_BRAND_NAME,
    url: siteUrl,
    description: SITE_MARKETING_DESCRIPTION,
    inLanguage: "en-US",
    publisher: {
      "@type": "Organization",
      name: SITE_BRAND_NAME,
      url: siteUrl,
      logo: logoUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
