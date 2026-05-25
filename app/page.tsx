import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CapabilityOrbit } from "@/components/landing/CapabilityOrbit";
import { CommandExperience } from "@/components/landing/CommandExperience";
import { ConnectCTA } from "@/components/landing/ConnectCTA";
import { Hero } from "@/components/landing/Hero";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
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
        <Hero
          signedInCheckoutUrl={signedInCheckoutUrl}
          signedInTeamCheckoutUrl={signedInTeamCheckoutUrl}
        />
        <CommandExperience />
        <CapabilityOrbit />
        <HowItWorksSection />
        <ProofRail />
        <ConnectCTA
          signedInCheckoutUrl={signedInCheckoutUrl}
          signedInTeamCheckoutUrl={signedInTeamCheckoutUrl}
        />
      </main>
      <Footer />
    </>
  );
}
