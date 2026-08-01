import type { Metadata } from "next";

import {
  SITE_BRAND_NAME,
  SITE_COMPANY_NAME,
  SITE_MARKETING_DESCRIPTION,
  SITE_MARKETING_TITLE,
  SITE_MARKETING_TWITTER_DESCRIPTION,
} from "@/lib/site-brand";
import { getSiteUrl } from "@/lib/site";

export const NOINDEX_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

export function buildMarketingMetadata(input: {
  title: string;
  description: string;
  path: string;
  twitterDescription?: string;
}): Metadata {
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}${input.path === "/" ? "" : input.path}`;
  const fullTitle = input.title.includes(SITE_BRAND_NAME)
    ? input.title
    : `${input.title} · ${SITE_BRAND_NAME}`;

  return {
    title: fullTitle,
    description: input.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: SITE_COMPANY_NAME,
      title: fullTitle,
      description: input.description,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: input.twitterDescription ?? input.description,
    },
  };
}

export const homepageMetadata: Metadata = buildMarketingMetadata({
  title: SITE_MARKETING_TITLE,
  description: SITE_MARKETING_DESCRIPTION,
  path: "/",
  twitterDescription: SITE_MARKETING_TWITTER_DESCRIPTION,
});
