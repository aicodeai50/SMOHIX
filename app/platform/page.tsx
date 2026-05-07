import type { Metadata } from "next";

import { PlatformSurfaceMap } from "@/components/platform/PlatformSurfaceMap";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

export const metadata: Metadata = {
  title: "Platform",
  description:
    "Operational module map for Zentro: incidents, automations, approvals, audit, runbooks, connectors, governance, and reasoning.",
};

export default function PlatformPage() {
  return (
    <>
      <Header />
      <main className="flex-1 border-b border-white/[0.06]">
        <PlatformSurfaceMap />
      </main>
      <Footer />
    </>
  );
}
