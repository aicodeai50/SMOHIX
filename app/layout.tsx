import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  SITE_BRAND_NAME,
  SITE_MARKETING_DESCRIPTION,
  SITE_MARKETING_TITLE,
  SITE_MARKETING_TWITTER_DESCRIPTION,
} from "@/lib/site-brand";
import { SiteJsonLd } from "@/components/site/SiteJsonLd";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    icon: [{ url: "/icon.png", sizes: "512x512", type: "image/png" }],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteJsonLd />
        {children}
      </body>
    </html>
  );
}
