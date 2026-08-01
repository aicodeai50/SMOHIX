import { Footer } from "@/components/site/Footer";
import { AboutCompanySection } from "@/components/landing/AboutCompanySection";
import { CommercialOpportunitySection } from "@/components/landing/CommercialOpportunitySection";
import { CTASection } from "@/components/landing/CTASection";
import { EcosystemSection } from "@/components/landing/EcosystemSection";
import { Hero } from "@/components/landing/Hero";
import { HomepageDevelopersSection } from "@/components/landing/HomepageDevelopersSection";
import { HomepagePricingSection } from "@/components/landing/HomepagePricingSection";
import { HomepageTrustSection } from "@/components/landing/HomepageTrustSection";
import { PlatformStatusSection } from "@/components/landing/PlatformStatusSection";
import { RoadmapSection } from "@/components/landing/RoadmapSection";
import { WhoWeBuildForSection } from "@/components/landing/WhoWeBuildForSection";
import { WhyChooseSection } from "@/components/landing/WhyChooseSection";
import { WhyZentroRunSection } from "@/components/landing/WhyZentroRunSection";
import { Navbar } from "@/components/ui/Navbar";
import { HomePageJsonLd } from "@/components/site/HomePageJsonLd";
import { homepageMetadata } from "@/lib/metadata";

export const metadata = homepageMetadata;

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <HomePageJsonLd />
      <Navbar ctaHref="/products" ctaLabel="Try Zentro" />
      <main id="main-content" className="flex-1">
        <Hero />
        <AboutCompanySection />
        <EcosystemSection />
        <WhyChooseSection />
        <PlatformStatusSection />
        <WhoWeBuildForSection />
        <WhyZentroRunSection />
        <CommercialOpportunitySection />
        <HomepageDevelopersSection />
        <HomepageTrustSection />
        <HomepagePricingSection />
        <RoadmapSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
