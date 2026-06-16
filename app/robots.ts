import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/auth/",
        "/hub",
        "/overview",
        "/copilot",
        "/incidents",
        "/services",
        "/automations",
        "/runbooks",
        "/approvals",
        "/audit",
        "/settings",
        "/governance",
        "/status",
        "/api/",
        "/api/health",
        "/api/connectors/status",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base.replace(/^https?:\/\//, ""),
  };
}
