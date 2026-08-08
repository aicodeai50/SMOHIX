import { AppIcon } from "@/components/icons/AppIcon";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { WHY_CHOOSE_SMOHIX } from "@/lib/company-identity";
import { mBody, mCard, mContainer, mEyebrow, mH2, mLede, mSection, mStaggerGrid } from "@/lib/marketing-layout";

export function WhyChooseSection() {
  return (
    <MarketingReveal
      id="why-smohix"
      className={mSection}
      aria-labelledby="why-heading"
    >
      <div className={mContainer}>
        <p className={`${mEyebrow} text-primary-muted`}>Why choose Smohix</p>
        <h2 id="why-heading" className={`mt-2 ${mH2}`}>
          What makes us different
        </h2>
        <p className={`${mLede} mt-3 max-w-2xl`}>
          We combine AI capability with operational discipline — unified surfaces,
          developer-first APIs, and architecture designed to scale.
        </p>

        <ul className={`mt-12 ${mStaggerGrid} grid gap-5 sm:grid-cols-2 lg:grid-cols-3`}>
          {WHY_CHOOSE_SMOHIX.map((item) => (
            <li key={item.title} className={mCard}>
              <div className="flex items-center gap-2">
                <AppIcon name="check" size={18} className="text-accent" aria-hidden />
                <h3 className="font-semibold text-foreground">{item.title}</h3>
              </div>
              <p className={`mt-2 ${mBody}`}>{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </MarketingReveal>
  );
}
