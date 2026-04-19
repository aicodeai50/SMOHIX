/**
 * Shared layout tokens for public marketing pages — keeps radius, padding, borders,
 * typography, and motion aligned with the design-language CSS variables in globals.css.
 */

export const mBorderB = "border-b border-white/[0.06]";

/** Vertical section padding ≈ 4× baseline (24px) rhythm. */
export const mSection = `${mBorderB} py-16 sm:py-20`;
export const mSectionTight = `${mBorderB} py-12 sm:py-14`;
export const mSectionPreview = `${mBorderB} py-14 sm:py-16`;

export const mContainer = "mx-auto max-w-6xl px-4 sm:px-6";

/** Narrow article shell (why, trust, status, changelog) — matches console reading width. */
export const mArticle = "mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16";

/** H1 — 32px mobile, 40px desktop (aligned with --dl-type-h1). */
export const mH1 = "text-[2rem] font-semibold tracking-tight text-foreground sm:text-[2.5rem] sm:leading-tight";

/** H2 — 24px section titles. */
export const mH2 = "text-2xl font-semibold tracking-tight text-foreground";
export const mH2Sm = "text-lg font-semibold tracking-tight text-foreground sm:text-xl";
export const mH3 = "text-lg font-semibold tracking-tight text-foreground";

/** Body / lede — 15px, relaxed line height (aligned with --dl-type-body). */
export const mBody = "text-[0.9375rem] leading-relaxed text-muted";
export const mLede = `mt-2 max-w-2xl ${mBody}`;

/** Subtle lift on interactive cards — pairs with duration-200 transition. */
export const mCardMotion =
  "transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-28px_rgba(0,0,0,0.55)]";

/** Card chrome without padding (tables, stacked headers). */
export const mPanelShell = "rounded-2xl border border-white/[0.08] bg-white/[0.02]";

/** Non-interactive grid cell (outcomes, mechanics). */
export const mCard = `${mPanelShell} p-6 ${mCardMotion} hover:border-white/[0.12]`;

/** Primary navigation card (module links). */
export const mCardLink = `group flex flex-col ${mPanelShell} p-6 ${mCardMotion} hover:border-white/[0.14] hover:bg-white/[0.035]`;

/** Accent eyebrow — product / narrative labels (hero, long-form). */
export const mEyebrow = "text-xs font-semibold uppercase tracking-[0.14em] text-accent/90";

/** Footer and in-page dense column labels. */
export const mFooterLabel =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted";

/** Grid / module card titles — between body copy and section H2. */
export const mCardTitle = "text-base font-semibold tracking-tight text-foreground";

/** Hero primary lede — body token, slightly larger from `sm`. */
export const mHeroLede = `mt-4 max-w-2xl ${mBody} sm:text-lg sm:leading-relaxed`;

/** Fine print and panel annotations. */
export const mBodySm = "text-xs leading-relaxed text-muted";

/**
 * Fade-up on first paint — paired with `globals.css` and optional
 * `main.flex-1 > section` cascade delays on the home page.
 */
export const mSectionEnter = "m-marketing-section-enter";

/** Direct children: subtle sequential rise (transform-only; pairs with globals). */
export const mStaggerGrid = "m-marketing-stagger-grid";
