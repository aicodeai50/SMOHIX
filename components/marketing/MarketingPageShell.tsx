import type { ReactNode } from "react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { mBody, mContainer, mEyebrow, mSection } from "@/lib/marketing-layout";

export function MarketingPageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <section className={`${mSection} border-b border-white/[0.06]`}>
          <div className={mContainer}>
            {eyebrow ? <p className={`${mEyebrow} text-primary-muted`}>{eyebrow}</p> : null}
            <h1 className={`mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl`}>
              {title}
            </h1>
            {description ? (
              <p className={`mt-4 max-w-2xl ${mBody}`}>{description}</p>
            ) : null}
            {children ? <div className="mt-8">{children}</div> : null}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
