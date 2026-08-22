/**
 * Shared layout tokens for public marketing pages — keeps radius, padding, borders,
 * typography, and motion aligned with the design-language CSS variables in globals.css.
 */

export const mBorderB = "border-b border-white/[0.06]";

/** Vertical section padding ≈ 4× baseline (24px) rhythm. */
export const mSection = `${mBorderB} py-16 sm:py-20`;
export const mSectionTight = `${mBorderB} py-12 sm:py-14`;
export const mSectionPreview = `${mBorderB} py-14 sm:py-16`;

export const mContainer = "mx-auto min-w-0 max-w-6xl px-4 sm:px-6";

/** Narrow article shell (why, trust, status, changelog) — matches console reading width. */
export const mArticle = "mx-auto min-w-0 max-w-3xl overflow-x-clip px-4 py-12 sm:px-6 sm:py-16";

/** H1 — 34px mobile, 44px desktop (Phase 25 display scale). */
export const mH1 = "text-[2.125rem] font-semibold tracking-tight text-foreground sm:text-[2.75rem] sm:leading-[1.08]";

/** Display — homepage / hero only. */
export const mDisplay = "smohix-display smohix-headline";

/** H2 — section titles with stronger presence. */
export const mH2 = "text-[1.625rem] font-semibold tracking-tight text-foreground";
export const mH2Sm = "text-lg font-semibold tracking-tight text-foreground sm:text-xl";
export const mH3 = "text-lg font-semibold tracking-tight text-foreground";

/** Body / lede — 15px, relaxed line height (aligned with --dl-type-body). */
export const mBody = "text-[0.9375rem] leading-relaxed text-muted";
export const mLede = `mt-2 max-w-2xl ${mBody}`;

/** Subtle lift on interactive cards — pairs with duration-200 transition. */
export const mCardMotion =
  "transition-[transform,box-shadow,border-color,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-28px_rgba(0,0,0,0.55)] motion-reduce:transition-none motion-reduce:hover:transform-none";

/** Card chrome without padding (tables, stacked headers). */
export const mPanelShell = "rounded-2xl border border-white/[0.08] bg-white/[0.02]";

/** Non-interactive grid cell (outcomes, mechanics). */
export const mCard = `${mPanelShell} p-6 ${mCardMotion} hover:border-white/[0.12]`;

/** Primary navigation card (module links). */
export const mCardLink = `group flex flex-col ${mPanelShell} p-6 ${mCardMotion} hover:border-white/[0.14] hover:bg-white/[0.035]`;

/** Accent eyebrow — product / narrative labels (hero, long-form). */
export const mEyebrow = "smohix-signal-meta text-accent/90";

/** System metadata strip (hero, hub). */
export const mSystemMeta = "smohix-signal-meta";

/** Footer and in-page dense column labels. */
export const mFooterLabel =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted";

/** Grid / module card titles — between body copy and section H2. */
export const mCardTitle = "text-base font-semibold tracking-tight text-foreground";

/** Hero primary lede — body token, slightly larger from `sm`. */
export const mHeroLede = `mt-4 max-w-2xl ${mBody} sm:text-lg sm:leading-relaxed`;

/** Fine print and panel annotations. */
export const mBodySm = "text-xs leading-relaxed text-muted";

/** Prepare state for scroll-triggered reveal — paired with `MarketingReveal` + `globals.css`. */
export const mSectionEnter = "m-marketing-section-enter";

/** Applied when the block intersects the viewport (client) or immediately if reduced motion. */
export const mRevealVisible = "m-marketing-reveal--visible";

/** Direct children: subtle sequential rise (transform-only; pairs with globals). */
export const mStaggerGrid = "m-marketing-stagger-grid";

/** Product / trust card grids — consistent gap rhythm. */
export const mProductGrid = "grid gap-5 sm:grid-cols-2 lg:grid-cols-3";
export const mTrustGrid = "grid gap-3 sm:grid-cols-2 lg:grid-cols-4";

/** Inline CTA on cards — arrow slides on group hover. */
export const mLinkCta =
  "mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-[gap,color] duration-200 group-hover:gap-2.5";

/** Text link with accent underline on hover. */
export const mLinkInline =
  "font-medium text-accent underline-offset-4 transition-[color,text-decoration] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** Shared keyboard focus ring for interactive marketing surfaces. */
export const mFocusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** Subtle section background wash — pairs with MarketingReveal. */
export const mSectionGlow =
  "relative before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(99,102,241,0.06),transparent_55%)]";
