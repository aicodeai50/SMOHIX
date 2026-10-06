import Link from "next/link";
import { SITE_EMAIL_CONTACT, getMailtoHref } from "@/lib/billing";
import { mBody, mContainer, mFooterLabel } from "@/lib/marketing-layout";
import { FOOTER_COMPANY, FOOTER_DEVELOPERS, FOOTER_EXPERIENCE, FOOTER_LEGAL, FOOTER_PRODUCTS, FOOTER_SOLUTIONS, FOOTER_SUPPORT } from "@/lib/site-nav";
import { SITE_COMPANY_NAME } from "@/lib/site-brand";
import { Logo } from "./Logo";

type FooterItem = { href: string; label: string; external?: boolean };
const FOOTER_GROUPS: { label: string; items: readonly FooterItem[] }[] = [
  { label: "Products", items: FOOTER_PRODUCTS },
  { label: "Solutions", items: FOOTER_SOLUTIONS },
  { label: "Developers", items: FOOTER_DEVELOPERS },
  { label: "Company", items: FOOTER_COMPANY },
  { label: "Experience", items: FOOTER_EXPERIENCE },
  { label: "Support", items: FOOTER_SUPPORT },
  { label: "Legal", items: FOOTER_LEGAL },
];

export function Footer({ adaptiveBrand = false }: { adaptiveBrand?: boolean }) {
  const seen = new Set<string>();
  const groups = FOOTER_GROUPS.map(group => ({ ...group, items: group.items.filter(item => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  }) }));
  return (
    <footer className="border-t border-border bg-surface/40">
      <div className={`${mContainer} py-12`}>
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm space-y-3 lg:max-w-xs lg:shrink-0">
            <Logo tone={adaptiveBrand ? "mono" : undefined} />
            <p className={mBody}>Intelligent software, built with care.</p>
            <a href={getMailtoHref()} className="inline-block text-sm text-accent hover:underline">{SITE_EMAIL_CONTACT}</a>
          </div>
          <div className="grid min-w-0 flex-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {groups.filter(group => group.items.length > 0).map(group => (
              <div key={group.label} className="space-y-3">
                <p className={mFooterLabel}>{group.label}</p>
                <nav className="flex flex-col gap-2" aria-label={group.label}>
                  {group.items.map(item => item.external ? (
                    <a key={item.href} href={item.href} className="w-fit text-sm text-muted hover:text-foreground" target="_blank" rel="noopener noreferrer">{item.label}</a>
                  ) : (
                    <Link key={item.href} href={item.href} className="w-fit text-sm text-muted hover:text-foreground">{item.label}</Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">© {new Date().getFullYear()} {SITE_COMPANY_NAME}. All rights reserved.</p>
          <Link href="/" className="text-xs text-muted hover:text-foreground">Back to home</Link>
        </div>
      </div>
    </footer>
  );
}
