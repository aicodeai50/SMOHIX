import type { Metadata } from "next";

import { SecurityBoundaryField } from "@/components/trust/SecurityBoundaryField";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mContainer, mSection } from "@/lib/marketing-layout";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Security",
  description: "Security posture and operational safeguards for the Smohix platform.",
  path: "/security",
});

export default function SecurityPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="smohix-trust-authority flex-1">
        <section className={`${mSection} border-b border-white/[0.06]`}>
          <div className={mContainer}>
            <SecurityBoundaryField />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
