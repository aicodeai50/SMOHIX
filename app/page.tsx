import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CapabilityOrbit } from "@/components/landing/CapabilityOrbit";
import { CommandExperience } from "@/components/landing/CommandExperience";
import { ConnectCTA } from "@/components/landing/ConnectCTA";
import { DimensionGate } from "@/components/landing/DimensionGate";
import { Hero } from "@/components/landing/Hero";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { MarketingQuantumShell } from "@/components/landing/MarketingQuantumShell";
import { ProofRail } from "@/components/landing/ProofRail";
import { getSignedInCheckoutUrls } from "@/lib/marketing/checkout-context";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { pro: signedInCheckoutUrl, team: signedInTeamCheckoutUrl } =
    await getSignedInCheckoutUrls();

  return (
    <>
      <Header />
      <main className="flex-1">
        <MarketingQuantumShell>
          <Hero
            signedInCheckoutUrl={signedInCheckoutUrl}
            signedInTeamCheckoutUrl={signedInTeamCheckoutUrl}
          />
          <DimensionGate />
          <CommandExperience />
          <DimensionGate />
          <CapabilityOrbit />
          <DimensionGate />
          <HowItWorksSection />
          <ProofRail />
          <ConnectCTA
            signedInCheckoutUrl={signedInCheckoutUrl}
            signedInTeamCheckoutUrl={signedInTeamCheckoutUrl}
          />
        </MarketingQuantumShell>
      </main>
      <Footer />
    </>
  );
}
