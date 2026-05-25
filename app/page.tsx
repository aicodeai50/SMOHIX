import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ControlVisibilitySection } from "@/components/landing/ControlVisibilitySection";
import { GuardedMechanicsSection } from "@/components/landing/GuardedMechanicsSection";
import { Hero } from "@/components/landing/Hero";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ModuleGrid } from "@/components/landing/ModuleGrid";
import { LivePanel } from "@/components/landing/LivePanel";
import { ProductConsolePreview } from "@/components/landing/ProductConsolePreview";
import { ProofStrip } from "@/components/landing/ProofStrip";
import { TrustSection } from "@/components/landing/TrustSection";
import { UseCasesSection } from "@/components/landing/UseCasesSection";
import { ConnectCTA } from "@/components/landing/ConnectCTA";
import { CyberDefenseSection } from "@/components/landing/CyberDefenseSection";
import { SecurityMetricsStrip } from "@/components/landing/SecurityMetricsStrip";
import { SecurityWorkflowSection } from "@/components/landing/SecurityWorkflowSection";
import { EnterpriseScaleSection } from "@/components/landing/EnterpriseScaleSection";
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
        <SecurityMetricsStrip />
        <ProductConsolePreview />
        <CyberDefenseSection />
        <HowItWorksSection />
        <SecurityWorkflowSection />
        <GuardedMechanicsSection />
        <UseCasesSection />
        <ControlVisibilitySection />
        <ModuleGrid />
        <EnterpriseScaleSection />
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
