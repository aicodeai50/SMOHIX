import type { Metadata } from "next";

import { MarketingQuantumShell } from "@/components/landing/MarketingQuantumShell";
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
      <MarketingQuantumShell>
        <main className="flex-1 border-b border-white/[0.06] zentro-quantum-section">
          <PlatformSurfaceMap />
        </main>
      </MarketingQuantumShell>
      <Footer />
    </>
  );
}
