import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
    default: "Shynvo — AI operations command center",
    template: "%s · Shynvo",
  },
  description:
    "Incident Copilot, safe automations with approvals, and audit-friendly IT operations. Connect reasoning and execution backends in one trusted platform.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Shynvo",
    title: "Shynvo — AI operations command center",
    description:
      "Incident Copilot, automation engine, and runbook intelligence with approval gates and full audit trails.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shynvo — AI operations command center",
    description:
      "Trusted IT operations: copilot, automations, and audit-ready controls.",
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
