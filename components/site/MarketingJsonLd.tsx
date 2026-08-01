import { getSiteUrl } from "@/lib/site";
import { SITE_EMAIL_CONTACT } from "@/lib/billing";
import { SITE_COMPANY_NAME, SITE_PUBLIC_BRAND } from "@/lib/site-brand";

type JsonLdGraph = Record<string, unknown>;

export function MarketingJsonLd({ graph }: { graph: JsonLdGraph[] }) {
  const payload = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}

export function contactPageJsonLd(): JsonLdGraph[] {
  const siteUrl = getSiteUrl();
  return [
    {
      "@type": "ContactPage",
      "@id": `${siteUrl}/contact#webpage`,
      url: `${siteUrl}/contact`,
      name: `Contact ${SITE_COMPANY_NAME}`,
      description: "Lead intake and inquiries for Zentro Technologies.",
      isPartOf: { "@id": `${siteUrl}/#website` },
      mainEntity: {
        "@type": "Organization",
        email: SITE_EMAIL_CONTACT,
        name: SITE_COMPANY_NAME,
      },
    },
  ];
}

export function pilotPageJsonLd(): JsonLdGraph[] {
  const siteUrl = getSiteUrl();
  return [
    {
      "@type": "WebPage",
      "@id": `${siteUrl}/pilot#webpage`,
      url: `${siteUrl}/pilot`,
      name: "Zentro Pilot Program",
      description: "Scoped pilots with Zentro Technologies before full product maturity.",
      isPartOf: { "@id": `${siteUrl}/#website` },
    },
    {
      "@type": "Service",
      name: "Zentro Technologies Pilot Program",
      provider: { "@id": `${siteUrl}/#organization` },
      areaServed: "Worldwide",
      description: "Collaborative pilots for AI, automation, integration, and healthcare prototypes.",
      url: `${siteUrl}/pilot`,
    },
  ];
}

export function servicesPageJsonLd(serviceNames: string[]): JsonLdGraph[] {
  const siteUrl = getSiteUrl();
  return [
    {
      "@type": "WebPage",
      "@id": `${siteUrl}/professional-services#webpage`,
      url: `${siteUrl}/professional-services`,
      name: `${SITE_PUBLIC_BRAND} Professional Services`,
      isPartOf: { "@id": `${siteUrl}/#website` },
    },
    ...serviceNames.map((name) => ({
      "@type": "Service",
      name,
      provider: { "@id": `${siteUrl}/#organization` },
      url: `${siteUrl}/professional-services`,
    })),
  ];
}

export function developersPageJsonLd(): JsonLdGraph[] {
  const siteUrl = getSiteUrl();
  return [
    {
      "@type": "WebPage",
      "@id": `${siteUrl}/developers#webpage`,
      url: `${siteUrl}/developers`,
      name: "Zentro Developers",
      description: "API catalog, authentication, and integration guides for Zentro.run.",
      isPartOf: { "@id": `${siteUrl}/#website` },
    },
    {
      "@type": "SoftwareApplication",
      name: "Zentro Platform API",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      url: `${siteUrl}/docs/api`,
    },
  ];
}
