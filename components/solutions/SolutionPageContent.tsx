import Link from "next/link";

import { Button } from "@/components/ui/Button";
import type { SolutionPage } from "@/lib/solutions-content";
import { mBody, mCard, mCardTitle, mH3, mLinkInline } from "@/lib/marketing-layout";

export function SolutionPageContent({ solution }: { solution: SolutionPage }) {
  const projectsHeading = solution.slug === "healthcare" ? "Experimental Healthcare Concepts" : "Projects in this area";
  return (
    <div className="space-y-10">
      <section aria-labelledby="outcomes-heading">
        <h2 id="outcomes-heading" className={mH3}>
          What teams achieve
        </h2>
        <ul className={`mt-4 space-y-3 ${mBody}`}>
          {solution.outcomes.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-accent" aria-hidden>
                ·
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="related-products-heading">
        <h2 id="related-products-heading" className={mH3}>
          Related products
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {solution.relatedProducts.map((product) => (
            <Link
              key={product.href}
              href={product.href}
              className={`${mCard} block hover:border-accent/30`}
            >
              <p className={mCardTitle}>{product.label}</p>
            </Link>
          ))}
        </div>
      </section>

      {solution.relatedProjects && solution.relatedProjects.length > 0 ? (
        <section aria-labelledby="related-projects-heading">
          <h2 id="related-projects-heading" className={mH3}>
            {projectsHeading}
          </h2>
          <div className="mt-4 space-y-4">
            {solution.relatedProjects.map((project) => (
              <article
                key={project.name}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5"
              >
                <h3 className="font-semibold text-foreground">{project.name}</h3>
                <p className={`mt-2 ${mBody}`}>{project.description}</p>
                {project.note ? (
                  <p className={`mt-3 text-sm text-amber-200/90 ${mBody}`}>{project.note}</p>
                ) : null}
                {project.href ? (
                  <Link href={project.href} className={`mt-4 inline-block ${mLinkInline}`}>
                    Learn more →
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3 border-t border-white/[0.06] pt-8">
        <Link href={solution.cta.href}>
          <Button size="lg">{solution.cta.label}</Button>
        </Link>
        <Link href="/solutions" className={mLinkInline}>
          All solutions
        </Link>
      </div>
    </div>
  );
}
