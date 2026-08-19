import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

/**
 * Public marketing site may be crawled. Authenticated console, admin, auth,
 * and API surfaces stay out of search indexes.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/api/health",
          "/api/connectors/status",
          "/auth/",
          "/admin",
          "/admin/",
          "/hub",
          "/hub/",
          "/vision",
          "/vision/",
          "/overview",
          "/overview/",
          "/copilot",
          "/copilot/",
          "/incidents",
          "/incidents/",
          "/services",
          "/services/",
          "/automations",
          "/automations/",
          "/runbooks",
          "/runbooks/",
          "/approvals",
          "/approvals/",
          "/audit",
          "/audit/",
          "/settings",
          "/settings/",
          "/governance",
          "/governance/",
          "/assets",
          "/assets/",
          "/changes",
          "/changes/",
          "/resilience",
          "/resilience/",
          "/status",
          "/status/",
          "/brand-preview",
          "/brand-preview/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base.replace(/^https?:\/\//, ""),
  };
}
