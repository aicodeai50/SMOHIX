import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CapabilityOrbit } from "@/components/landing/CapabilityOrbit";
import { CommandExperience } from "@/components/landing/CommandExperience";
import { ConnectCTA } from "@/components/landing/ConnectCTA";
import { DimensionGate } from "@/components/landing/DimensionGate";
import { GettingStartedSection } from "@/components/landing/GettingStartedSection";
import { Hero } from "@/components/landing/Hero";
import { HomepagePricingSection } from "@/components/landing/HomepagePricingSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { MarketingQuantumShell } from "@/components/landing/MarketingQuantumShell";
import { ProductConsolePreview } from "@/components/landing/ProductConsolePreview";
import { ProofRail } from "@/components/landing/ProofRail";
import { SocialProofBand } from "@/components/landing/SocialProofBand";
import { WorkflowShowcase } from "@/components/landing/WorkflowShowcase";
import { getSignedInCheckoutUrls } from "@/lib/marketing/checkout-context";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { pro: signedInCheckoutUrl, team: signedInTeamCheckoutUrl } =
    await getSignedInCheckoutUrls();

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <MarketingQuantumShell>
          <Hero
            signedInCheckoutUrl={signedInCheckoutUrl}
            signedInTeamCheckoutUrl={signedInTeamCheckoutUrl}
          />
          <SocialProofBand />
          <DimensionGate />
          <GettingStartedSection />
          <DimensionGate />
          <ProductConsolePreview />
          <WorkflowShowcase />
          <DimensionGate />
          <CommandExperience />
          <DimensionGate />
          <HomepagePricingSection />
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
