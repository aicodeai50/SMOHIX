/**
 * Console typography — mirrors marketing tokens (`lib/marketing-layout.ts`) so app routes
 * share the same type scale and rhythm as public pages.
 */

/** Page-level section heading inside console content (24px). */
export const appPageSectionTitle = "text-2xl font-semibold tracking-tight text-foreground";

/** Card / panel title (18px). */
export const appPanelTitle = "text-lg font-semibold tracking-tight text-foreground";

/** Primary body copy (15px). */
export const appBody = "text-[0.9375rem] leading-relaxed";

/** Secondary / meta copy (13px). */
export const appMeta = "text-[13px] leading-relaxed text-muted";

/** Uppercase rail / group label. */
export const appOverline = "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted";

/** System metric / numeric emphasis. */
export const appMetric = "font-mono text-[1.125rem] font-semibold tracking-tight text-foreground tabular-nums";

/** Status chip label (pair with tone classes — never color alone). */
export const appStatus = "text-[10px] font-semibold uppercase tracking-[0.12em]";

/** Form field label (13px, muted). */
export const appLabel = "text-[13px] font-medium text-muted";
