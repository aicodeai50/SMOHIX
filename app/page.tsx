import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ModuleGrid } from "@/components/landing/ModuleGrid";
import { LivePanel } from "@/components/landing/LivePanel";
import { ProofStrip } from "@/components/landing/ProofStrip";
import { TrustSection } from "@/components/landing/TrustSection";
import { ConnectCTA } from "@/components/landing/ConnectCTA";
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
        <HowItWorksSection />
        <ModuleGrid />
        <LivePanel />
        <ProofStrip />
        <TrustSection />
        <ConnectCTA
          signedInCheckoutUrl={signedInCheckoutUrl}
          signedInTeamCheckoutUrl={signedInTeamCheckoutUrl}
        />
      </main>
      <Footer />
    </>
  );
}
