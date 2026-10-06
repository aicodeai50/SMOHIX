import "../../hq.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicExperience } from "@/components/marketing/PublicExperience";
import { MaturityBadge } from "@/components/marketing/MaturityBadge";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/site/Footer";
import { HqGuide } from "@/components/hq/HqGuide";
import { buildHqGuideDocuments } from "@/lib/hq/guide-data";
import { FAMILY_PROJECTS } from "@/lib/family-projects";
import { registryToEcosystemStatus } from "@/lib/product-registry";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mBody, mContainer, mEyebrow, mH1, mH2, mSection, mFocusRing } from "@/lib/marketing-layout";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return FAMILY_PROJECTS.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const project = FAMILY_PROJECTS.find((item) => item.slug === slug);
  return buildMarketingMetadata({ title: project?.name ?? "Smohix family", description: project?.purpose ?? "Explore Smohix projects.", path: `/family/${slug}` });
}
export default async function FamilyProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = FAMILY_PROJECTS.find((item) => item.slug === slug);
  if (!project) notFound();
  return <PublicExperience><div className="smohix-hq flex min-h-screen flex-1 flex-col"><Navbar adaptiveBrand />
    <main id="main-content" className="flex-1">
      <section className={mSection}><div className={mContainer}>
        <p className={mEyebrow}>Smohix family · Emerging projects</p>
        <h1 className={`mt-3 ${mH1}`}>{project.name}</h1>
        <p className={`mt-5 max-w-2xl ${mBody}`}>{project.purpose}</p>
        <div className="mt-5"><MaturityBadge maturity={registryToEcosystemStatus(project.status)} /></div>
        <p className={`mt-6 max-w-2xl ${mBody}`}>{project.description}</p>
      </div></section>
      <section className={mSection}><div className={`${mContainer} grid gap-8 md:grid-cols-2`}>
        <div><h2 className={mH2}>Current availability</h2><p className={`mt-4 ${mBody}`}>{project.limitations}</p></div>
        <div><h2 className={mH2}>What comes next</h2><p className={`mt-4 ${mBody}`}>{project.next}</p>
          <Link href={`/contact?inquiry=product&product=${project.id}`} className={`mt-5 inline-block text-sm font-medium text-accent hover:underline ${mFocusRing}`}>Ask about this project →</Link>
        </div>
      </div></section>
      <div className={`${mContainer} pb-12`}><Link href="/products" className={`text-sm text-accent hover:underline ${mFocusRing}`}>Explore the Smohix family →</Link></div>
      <HqGuide documents={buildHqGuideDocuments()} />
    </main><Footer adaptiveBrand /></div></PublicExperience>;
}
