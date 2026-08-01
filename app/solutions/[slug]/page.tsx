import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ComingSoonPanel } from "@/components/marketing/ComingSoonPanel";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { COMING_SOON_SOLUTIONS, getComingSoonSolution } from "@/lib/company-identity";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mBody, mContainer, mEyebrow, mSection } from "@/lib/marketing-layout";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return COMING_SOON_SOLUTIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const solution = getComingSoonSolution(slug);
  if (!solution) {
    return buildMarketingMetadata({
      title: "Solutions",
      description: "Zentro Technologies solutions.",
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
  const solution = getComingSoonSolution(slug);
  if (!solution) {
    notFound();
  }

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <section className={`${mSection} border-b border-white/[0.06]`}>
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Solutions</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {solution.title}
            </h1>
            <p className={`mt-4 max-w-2xl ${mBody}`}>{solution.description}</p>
          </div>
        </section>
        <section className="pb-16 pt-4">
          <div className={mContainer}>
            <ComingSoonPanel
              title={`${solution.title} solutions`}
              description={solution.description}
              backHref="/solutions"
              backLabel="All solutions"
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
