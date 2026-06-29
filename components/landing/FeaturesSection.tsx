import { AppIcon } from "@/components/icons/AppIcon";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { Card } from "@/components/ui/Card";
import { mBody, mContainer, mEyebrow, mH2, mLede, mSection } from "@/lib/marketing-layout";
import { PRODUCT_FEATURES } from "@/lib/product-identity";

export function FeaturesSection() {
  return (
    <MarketingReveal
      id="features"
      className={`${mSection} border-b border-white/[0.06]`}
      aria-labelledby="features-heading"
    >
      <div className={mContainer}>
        <p className={`${mEyebrow} text-primary-muted`}>Features</p>
        <h2 id="features-heading" className={`mt-2 ${mH2}`}>
          Everything ops teams need in one workspace
        </h2>
        <p className={`${mLede} mt-3 max-w-2xl`}>
          Zentro connects incidents, services, automations, and audit into a
          single accountable command layer.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {PRODUCT_FEATURES.map((feature) => (
            <Card key={feature.id} className="transition-[border-color,transform] hover:-translate-y-0.5 hover:border-accent/30">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-dim">
                <AppIcon name={feature.icon} size={22} className="text-primary-muted" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className={`mt-2 ${mBody} text-muted`}>{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </MarketingReveal>
  );
}
