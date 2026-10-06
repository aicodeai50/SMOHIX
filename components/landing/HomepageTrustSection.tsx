import Link from "next/link";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { mBody, mCardLink, mContainer, mEyebrow, mFocusRing, mH2, mSection, mSectionGlow, mTrustGrid } from "@/lib/marketing-layout";

const TRUST_LINKS = [
  { href: "/trust", label: "Trust center", detail: "Data handling, access controls, and product maturity" },
  { href: "/security", label: "Security", detail: "Responsible disclosure and security practices" },
  { href: "/privacy", label: "Privacy", detail: "How information is collected, used, and protected" },
  { href: "/changelog", label: "Changelog", detail: "Published updates and shipped changes" },
] as const;

export function HomepageTrustSection() {
  return (
    <MarketingReveal id="trust" className={`${mSection} ${mSectionGlow}`} aria-labelledby="homepage-trust-heading">
      <div className={mContainer}>
        <p className={`${mEyebrow} text-primary-muted`}>Trust</p>
        <h2 id="homepage-trust-heading" className={mH2}>Inspect the details before you decide</h2>
        <p className={`mt-3 max-w-2xl ${mBody}`}>Review our published policies and product updates. Certifications and customer metrics are only claimed when documented.</p>
        <ul className={`mt-8 ${mTrustGrid}`}>
          {TRUST_LINKS.map(item => (
            <li key={item.href}>
              <Link href={item.href} className={`block ${mCardLink} ${mFocusRing}`}>
                <span className="font-medium text-foreground">{item.label}</span>
                <span className={`mt-1 block text-sm ${mBody}`}>{item.detail}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </MarketingReveal>
  );
}
