import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SolutionPageContent } from "@/components/solutions/SolutionPageContent";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mBody, mContainer, mEyebrow, mSection } from "@/lib/marketing-layout";
import { getAllSolutionSlugs, getSolutionPage } from "@/lib/solutions-content";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllSolutionSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const solution = getSolutionPage(slug);
  if (!solution) {
    return buildMarketingMetadata({
      title: "Solutions",
      description: "Smohix Technologies industry solutions.",
      path: `/solutions/${slug}`,
    });
  }
  return buildMarketingMetadata({
    title: `${solution.title} solutions`,
    description: solution.description,
    path: `/solutions/${slug}`,
  });
}

export default async function SolutionPage({ params }: Props) {
  const { slug } = await params;
  const solution = getSolutionPage(slug);
  if (!solution) {
    notFound();
  }

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <section className={`${mSection} border-b border-white/[0.06]`}>
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>{solution.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {solution.title}
            </h1>
            <p className={`mt-4 max-w-2xl ${mBody}`}>{solution.description}</p>
          </div>
        </section>
        <section className={`${mSection} pb-16`}>
          <div className={mContainer}>
            <SolutionPageContent solution={solution} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
