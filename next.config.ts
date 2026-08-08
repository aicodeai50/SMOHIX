import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.smohix.run" }],
        destination: "https://smohix.run/:path*",
        permanent: true,
      },
      // Legacy Zentro host / path compatibility during domain cutover
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.zentro.run" }],
        destination: "https://smohix.run/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "zentro.run" }],
        destination: "https://smohix.run/:path*",
        permanent: true,
      },
      { source: "/products/zentro-ai", destination: "/products/smohix-ai", permanent: true },
      { source: "/products/zentro-platform", destination: "/products/smohix-platform", permanent: true },
      { source: "/products/zentro-assistant", destination: "/products/smohix-assistant", permanent: true },
      { source: "/products/zentro-own-api", destination: "/products/smohix-own-api", permanent: true },
      { source: "/products/zentro-log", destination: "/products/smohix-log", permanent: true },
      { source: "/demo", destination: "/products", permanent: true },
      { source: "/demo/:path*", destination: "/products", permanent: true },
      { source: "/tour", destination: "/explore", permanent: true },
      { source: "/cloud", destination: "/explore", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
