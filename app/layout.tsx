import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  SITE_BRAND_NAME,
  SITE_MARKETING_DESCRIPTION,
  SITE_MARKETING_TITLE,
  SITE_MARKETING_TWITTER_DESCRIPTION,
} from "@/lib/site-brand";
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
  title: {
    default: SITE_MARKETING_TITLE,
    template: `%s · ${SITE_BRAND_NAME}`,
  },
  description: SITE_MARKETING_DESCRIPTION,
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
        {children}
      </body>
    </html>
  );
}
