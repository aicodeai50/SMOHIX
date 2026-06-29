import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import {
  SITE_BRAND_NAME,
  SITE_MARKETING_DESCRIPTION,
  SITE_MARKETING_TITLE,
  SITE_MARKETING_TWITTER_DESCRIPTION,
} from "@/lib/site-brand";
import { SiteJsonLd } from "@/components/site/SiteJsonLd";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: SITE_BRAND_NAME,
  title: {
    default: SITE_MARKETING_TITLE,
    template: `%s · ${SITE_BRAND_NAME}`,
  },
  description: SITE_MARKETING_DESCRIPTION,
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: SITE_BRAND_NAME,
    statusBarStyle: "black-translucent",
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: SITE_BRAND_NAME,
    title: SITE_MARKETING_TITLE,
    description: SITE_MARKETING_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_MARKETING_TITLE,
    description: SITE_MARKETING_TWITTER_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "pnfIca15cylpyjnEBOGo00i4YNOBlxxorcb-DBkOPuI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-background"
        >
          Skip to content
        </a>
        <SiteJsonLd />
        {children}
      </body>
    </html>
  );
}
