import type { MetadataRoute } from "next";

import { getAllProductSlugs } from "@/lib/ecosystem-graph";
import { getSiteUrl } from "@/lib/site";
import { getAllSolutionSlugs } from "@/lib/solutions-content";

/** Public marketing and policy routes only (console routes may require auth). */
const PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"]; priority: number }[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.85 },
  { path: "/products", changeFrequency: "weekly", priority: 0.9 },
  { path: "/pilot", changeFrequency: "monthly", priority: 0.88 },
  { path: "/professional-services", changeFrequency: "monthly", priority: 0.86 },
  { path: "/developers", changeFrequency: "weekly", priority: 0.84 },
  { path: "/explore", changeFrequency: "monthly", priority: 0.82 },
  { path: "/playground", changeFrequency: "weekly", priority: 0.8 },
  { path: "/use-cases", changeFrequency: "monthly", priority: 0.78 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.72 },
  { path: "/search", changeFrequency: "weekly", priority: 0.65 },
  { path: "/architecture", changeFrequency: "monthly", priority: 0.75 },
  { path: "/technology", changeFrequency: "monthly", priority: 0.75 },
  { path: "/company", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.82 },
  { path: "/solutions", changeFrequency: "monthly", priority: 0.78 },
  { path: "/careers", changeFrequency: "monthly", priority: 0.55 },
  { path: "/enterprise", changeFrequency: "monthly", priority: 0.88 },
  { path: "/cybersecurity", changeFrequency: "monthly", priority: 0.88 },
  { path: "/platform", changeFrequency: "monthly", priority: 0.85 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.82 },
  { path: "/integrations", changeFrequency: "monthly", priority: 0.75 },
  { path: "/trust", changeFrequency: "monthly", priority: 0.78 },
  { path: "/security", changeFrequency: "monthly", priority: 0.76 },
  { path: "/why", changeFrequency: "monthly", priority: 0.7 },
  { path: "/docs", changeFrequency: "weekly", priority: 0.72 },
  { path: "/docs/api", changeFrequency: "weekly", priority: 0.68 },
  { path: "/docs/demo", changeFrequency: "monthly", priority: 0.6 },
  { path: "/docs/film", changeFrequency: "monthly", priority: 0.58 },
  { path: "/next", changeFrequency: "weekly", priority: 0.65 },
  { path: "/changelog", changeFrequency: "weekly", priority: 0.62 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.5 },
  { path: "/terms", changeFrequency: "monthly", priority: 0.5 },
  { path: "/cookies", changeFrequency: "monthly", priority: 0.4 },
  { path: "/acceptable-use", changeFrequency: "monthly", priority: 0.4 },
  { path: "/refund", changeFrequency: "monthly", priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();
  const productPaths = getAllProductSlugs().map((slug) => ({
    path: `/products/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  const solutionPaths = getAllSolutionSlugs().map((slug) => ({
    path: `/solutions/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.76,
  }));

  const origin = base.replace(/\/$/, "");
  return [...PATHS, ...productPaths, ...solutionPaths].map(({ path, changeFrequency, priority }) => ({
    // Homepage uses trailing slash to match <link rel="canonical">.
    url: path === "" ? `${origin}/` : `${origin}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
