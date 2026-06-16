import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

/** Public marketing and policy routes only (console routes may require auth). */
const PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"]; priority: number }[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.85 },
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
  return PATHS.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path === "" ? "" : path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
