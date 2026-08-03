import type { Metadata } from "next";

import { MarketingQuantumShell } from "@/components/landing/MarketingQuantumShell";
import { PlatformSurfaceMap } from "@/components/platform/PlatformSurfaceMap";
import { PlatformWorkspaceIntro } from "@/components/platform/PlatformWorkspaceIntro";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { buildMarketingMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Platform",
  description:
    "Zentro Platform — operational workspace for organizations, projects, knowledge, agents, usage, and administration after sign-in.",
  path: "/platform",
});

export default function PlatformPage() {
  return (
    <>
      <Header />
      <MarketingQuantumShell>
        <main id="main-content" className="flex-1 border-b border-white/[0.06]">
          <PlatformWorkspaceIntro />
          <div className="zentro-quantum-section border-t border-white/[0.06]">
            <PlatformSurfaceMap />
          </div>
        </main>
      </MarketingQuantumShell>
      <Footer />
    </>
  );
}
