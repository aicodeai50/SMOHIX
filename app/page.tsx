import { Footer } from "@/components/site/Footer";
import { CTASection } from "@/components/landing/CTASection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { Hero } from "@/components/landing/Hero";
import { HomepagePricingSection } from "@/components/landing/HomepagePricingSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { Navbar } from "@/components/ui/Navbar";
import { HomePageJsonLd } from "@/components/site/HomePageJsonLd";
import { homepageMetadata } from "@/lib/metadata";

export const metadata = homepageMetadata;

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <HomePageJsonLd />
      <Navbar />
      <main id="main-content" className="flex-1">
        <Hero />
        <FeaturesSection />
        <HowItWorksSection />
        <HomepagePricingSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
