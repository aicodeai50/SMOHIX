import "../hq.css";
import { PublicExperience } from "@/components/marketing/PublicExperience";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/site/Footer";
import { HqGuide } from "@/components/hq/HqGuide";
import { MaturityBadge } from "@/components/marketing/MaturityBadge";
import { buildHqGuideDocuments } from "@/lib/hq/guide-data";
import { buildMarketingMetadata } from "@/lib/metadata";
import { getRegistryProduct, registryToEcosystemStatus } from "@/lib/product-registry";
import { mBody, mContainer, mEyebrow, mH1, mH2, mFocusRing, mSection } from "@/lib/marketing-layout";
import { WORKSHOP_CONTACT_PATH, WORKSHOP_PROJECT_TYPES, WORKSHOP_STAGES } from "@/lib/workshop-content";

export const metadata = buildMarketingMetadata({ title: "Smohix Workshop", description: "Company projects from the first brief to design, development and handover. Explore Smohix Workshop and discuss your project with Smohix.", path: "/workshop" });

export default function WorkshopPage() {
  const product = getRegistryProduct("smohix-workshop")!;
  return (
    <PublicExperience>
      <div className="smohix-hq flex min-h-screen flex-1 flex-col">
        <Navbar adaptiveBrand />
        <main id="main-content" className="flex-1">
          <section className={mSection}>
            <div className={mContainer}>
              <p className={mEyebrow}>Smohix Workshop · Project delivery</p>
              <h1 className={`mt-3 max-w-3xl ${mH1}`}>From your idea to a working product.</h1>
              <p className={`mt-5 max-w-2xl ${mBody}`}>A place in the Smohix family for companies that want to build something new. Define the project, shape the experience, develop the software and plan its handover with Smohix.</p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link href={WORKSHOP_CONTACT_PATH} className={`smohix-workshop-link font-medium ${mFocusRing}`}>Discuss your project →</Link>
                <Link href="#delivery" className={`text-sm font-medium text-accent hover:underline ${mFocusRing}`}>How delivery would work</Link>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <MaturityBadge maturity={registryToEcosystemStatus(product.maturity)} />
                <p className="text-xs leading-relaxed text-muted">Project inquiries are open. The dedicated client workspace is planned.</p>
              </div>
            </div>
          </section>
          <section className={mSection} aria-labelledby="workshop-projects">
            <div className={mContainer}>
              <h2 id="workshop-projects" className={mH2}>What could we build together?</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {WORKSHOP_PROJECT_TYPES.map((item) => <article key={item.title} className="smohix-workshop-entry !mt-0"><h3 className="text-base font-semibold text-foreground">{item.title}</h3><p className={`mt-3 ${mBody}`}>{item.description}</p></article>)}
              </div>
            </div>
          </section>
          <section id="delivery" className={mSection} aria-labelledby="workshop-delivery">
            <div className={mContainer}>
              <h2 id="workshop-delivery" className={mH2}>A clear path from brief to handover.</h2>
              <p className={`mt-3 max-w-2xl ${mBody}`}>Every engagement starts with an agreed scope. These stages describe the proposed delivery approach; milestones, dates and responsibilities are agreed with your company.</p>
              <ol className="mt-7 grid gap-4 md:grid-cols-2">
                {WORKSHOP_STAGES.map((stage, index) => <li key={stage.title} className="smohix-workshop-entry !mt-0"><p className="text-xs font-medium text-accent">{String(index + 1).padStart(2, "0")}</p><h3 className="mt-3 text-lg font-semibold text-foreground">{stage.title}</h3><p className={`mt-3 ${mBody}`}>{stage.detail}</p><p className="mt-4 text-xs leading-relaxed text-muted">Agreed output: {stage.output}</p></li>)}
              </ol>
            </div>
          </section>
          <section className={mSection} aria-labelledby="workshop-access">
            <div className={`${mContainer} grid gap-8 lg:grid-cols-2`}>
              <div><h2 id="workshop-access" className={mH2}>Your project. A shared plan.</h2><p className={`mt-4 ${mBody}`}>The planned Workshop client workspace will bring briefs, milestones, files, reviews and delivery decisions together. For now, start with a project inquiry; private project rooms and secure file sharing are not yet available.</p><p className={`mt-4 ${mBody}`}>Smohix AI can support reasoning and development. Smohix Platform remains the operational command workspace. Workshop gives project delivery its own purpose in the ecosystem.</p><Link href="/products" className={`mt-4 inline-block text-sm font-medium text-accent hover:underline ${mFocusRing}`}>Explore the Smohix family →</Link></div>
              <div className="smohix-workshop-entry !mt-0"><h3 className="text-lg font-semibold text-foreground">Start with the brief.</h3><p className={`mt-3 ${mBody}`}>Tell us about your company, the problem you want to solve, who will use the product and your expected timeframe. Add a budget range if you have one.</p><p className={`mt-3 ${mBody}`}>Scope, pricing, delivery dates, source-code ownership and ongoing support are agreed for each project.</p><Link href={WORKSHOP_CONTACT_PATH} className={`smohix-workshop-link mt-5 text-sm font-medium ${mFocusRing}`}>Discuss a project →</Link></div>
            </div>
          </section>
          <HqGuide documents={buildHqGuideDocuments()} />
        </main>
        <Footer adaptiveBrand />
      </div>
    </PublicExperience>
  );
}
