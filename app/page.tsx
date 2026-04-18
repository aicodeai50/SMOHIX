import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/landing/Hero";
import { ModuleGrid } from "@/components/landing/ModuleGrid";
import { LivePanel } from "@/components/landing/LivePanel";
import { TrustSection } from "@/components/landing/TrustSection";
import { ConnectCTA } from "@/components/landing/ConnectCTA";
import { getSignedInCheckoutUrl } from "@/lib/marketing/checkout-context";

export const dynamic = "force-dynamic";

export default async function Home() {
  const signedInCheckoutUrl = await getSignedInCheckoutUrl();

  return (
    <>
      <Header signedInCheckoutUrl={signedInCheckoutUrl} />
      <main className="flex-1">
        <Hero signedInCheckoutUrl={signedInCheckoutUrl} />
        <ModuleGrid />
        <LivePanel />
        <TrustSection />
        <ConnectCTA signedInCheckoutUrl={signedInCheckoutUrl} />
      </main>
      <Footer />
    </>
  );
}
