import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/landing/Hero";
import { ModuleGrid } from "@/components/landing/ModuleGrid";
import { LivePanel } from "@/components/landing/LivePanel";
import { TrustSection } from "@/components/landing/TrustSection";
import { ConnectCTA } from "@/components/landing/ConnectCTA";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <ModuleGrid />
        <LivePanel />
        <TrustSection />
        <ConnectCTA />
      </main>
      <Footer />
    </>
  );
}
