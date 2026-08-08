import type { Metadata } from "next";

import { BRAND_ASSETS } from "@/lib/brand";
import {
  SITE_BRAND_NAME,
  SITE_MARKETING_DESCRIPTION,
  SITE_MARKETING_TITLE,
  SITE_MARKETING_TWITTER_DESCRIPTION,
  SITE_SEO_KEYWORDS,
} from "@/lib/site-brand";
import { getCanonicalUrl, getSiteUrl } from "@/lib/site";

export const NOINDEX_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

export const INDEX_ROBOTS: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

function socialImages(siteUrl: string) {
  const og = new URL(BRAND_ASSETS.openGraphImage, siteUrl).href;
  const twitter = new URL(BRAND_ASSETS.twitterImage, siteUrl).href;
  return {
    openGraph: [{ url: og, width: 1200, height: 630, alt: SITE_BRAND_NAME }],
    twitter: [twitter],
  };
}

export function buildMarketingMetadata(input: {
  title: string;
  description: string;
  path: string;
  twitterDescription?: string;
}): Metadata {
  const siteUrl = getSiteUrl();
  const canonical = getCanonicalUrl(input.path);
  const fullTitle = input.title.includes(SITE_BRAND_NAME)
    ? input.title
    : `${input.title} · ${SITE_BRAND_NAME}`;
  const images = socialImages(siteUrl);

  return {
    title: fullTitle,
    description: input.description,
    keywords: [...SITE_SEO_KEYWORDS],
    alternates: { canonical },
    robots: INDEX_ROBOTS,
    openGraph: {
      type: "website",
      url: canonical,
      siteName: SITE_BRAND_NAME,
      title: fullTitle,
      description: input.description,
      locale: "en_US",
      images: images.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: input.twitterDescription ?? input.description,
      images: images.twitter,
    },
  };
}

export const homepageMetadata: Metadata = buildMarketingMetadata({
  title: SITE_MARKETING_TITLE,
  description: SITE_MARKETING_DESCRIPTION,
  path: "/",
  twitterDescription: SITE_MARKETING_TWITTER_DESCRIPTION,
});
